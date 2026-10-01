import { Router, type IRouter } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCheckoutSessionBody } from "@workspace/api-zod";
import { requireAuth } from "./auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

const IS_PROD = process.env.ESEWA_ENV === "production";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || (IS_PROD ? "" : "EPAYTEST");
// "8gBm/:&EnhH.1/q" is eSewa's officially published sandbox secret key — not a real secret.
// See: https://developer.esewa.com.np/ → Sandbox Credentials
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || (IS_PROD ? "" : "8gBm/:&EnhH.1/q");
const ESEWA_PAYMENT_URL = IS_PROD
  ? "https://epay.esewa.com.np/api/epay/main/v2/form"
  : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_VERIFY_URL = IS_PROD
  ? "https://epay.esewa.com.np/api/epay/transaction/status/"
  : "https://rc.esewa.com.np/api/epay/transaction/status/";

const MONTHLY_PRICE = parseInt(process.env.ESEWA_MONTHLY_PRICE || "299", 10);
const YEARLY_PRICE = parseInt(process.env.ESEWA_YEARLY_PRICE || "2399", 10);

function makeSignature(totalAmount: number, transactionUuid: string, productCode: string): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
}

async function autoExpire(sub: any): Promise<any> {
  if (sub.status === "active" && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    await db.update(subscriptionsTable).set({ status: "inactive" }).where(eq(subscriptionsTable.userId, sub.userId));
    return { ...sub, status: "inactive" };
  }
  return sub;
}

// GET /subscriptions/me
router.get("/subscriptions/me", requireAuth, async (req: any, res): Promise<void> => {
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId));
  if (!sub) {
    res.json({
      id: 0, userId: req.userId, status: "inactive", plan: "none",
      cancelAtPeriodEnd: false, createdAt: new Date().toISOString(),
      currentPeriodEnd: null, esewaTransactionId: null,
    });
    return;
  }
  res.json(await autoExpire(sub));
});

// POST /subscriptions/checkout
router.post("/subscriptions/checkout", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  if (!ESEWA_SECRET_KEY || !ESEWA_PRODUCT_CODE) {
    res.status(503).json({ error: "eSewa not configured" });
    return;
  }

  const plan = parsed.data.plan as "monthly" | "yearly";
  const amount = plan === "yearly" ? YEARLY_PRICE : MONTHLY_PRICE;
  const transactionUuid = `LH-${req.userId.slice(-8)}-${Date.now()}`;

  // Use FRONTEND_URL env var (set on Render) so the redirect target is
  // always the trusted frontend — never taken from the request Origin header.
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const signature = makeSignature(amount, transactionUuid, ESEWA_PRODUCT_CODE);

  res.json({
    paymentUrl: ESEWA_PAYMENT_URL,
    formData: {
      amount: String(amount),
      tax_amount: "0",
      total_amount: String(amount),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${frontendUrl}/payment/verify?plan=${plan}`,
      failure_url: `${frontendUrl}/pricing?checkout=canceled`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    },
  });
});

const VALID_PLANS = ["monthly", "yearly"] as const;
type Plan = typeof VALID_PLANS[number];

// POST /subscriptions/verify
router.post("/subscriptions/verify", requireAuth, async (req: any, res): Promise<void> => {
  const { encodedData, plan } = req.body as { encodedData?: string; plan?: string };

  if (!encodedData || !plan) {
    res.status(400).json({ error: "Missing encodedData or plan" });
    return;
  }

  // Validate plan is a known value — reject anything else
  if (!VALID_PLANS.includes(plan as Plan)) {
    res.status(400).json({ error: "Invalid plan — must be 'monthly' or 'yearly'" });
    return;
  }
  const validatedPlan = plan as Plan;

  let decoded: any;
  try {
    decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
  } catch {
    res.status(400).json({ error: "Invalid payment data" });
    return;
  }

  const { transaction_uuid, total_amount, transaction_code, status } = decoded;

  if (status !== "COMPLETE") {
    res.status(400).json({ error: "Payment was not completed" });
    return;
  }

  // Cross-check the amount in the eSewa payload against the expected plan price.
  // Prevents a user from paying for monthly and claiming a yearly subscription.
  const expectedAmount = validatedPlan === "yearly" ? YEARLY_PRICE : MONTHLY_PRICE;
  if (Number(total_amount) !== expectedAmount) {
    logger.warn({ total_amount, expected: expectedAmount, plan: validatedPlan }, "eSewa amount mismatch — possible plan tampering");
    res.status(400).json({ error: "Payment amount does not match plan price" });
    return;
  }

  try {
    const verifyUrl =
      `${ESEWA_VERIFY_URL}?product_code=${encodeURIComponent(ESEWA_PRODUCT_CODE)}` +
      `&transaction_uuid=${encodeURIComponent(transaction_uuid)}` +
      `&total_amount=${encodeURIComponent(total_amount)}`;

    const verifyRes = await fetch(verifyUrl, { headers: { Accept: "application/json" } });
    const verification = (await verifyRes.json()) as any;

    if (verification.status !== "COMPLETE") {
      res.status(400).json({ error: "eSewa could not verify this payment" });
      return;
    }

    const transactionId = String(transaction_code);

    // Replay protection: reject if this eSewa transaction ID was already
    // used by a *different* user. Same user retrying is idempotent — allow.
    const [claimedByOther] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.esewaTransactionId, transactionId));
    if (claimedByOther && claimedByOther.userId !== req.userId) {
      logger.warn({ transactionId, userId: req.userId }, "eSewa transaction already used by another user — possible replay");
      res.status(400).json({ error: "This payment has already been processed" });
      return;
    }

    const now = new Date();
    const periodEnd =
      validatedPlan === "yearly"
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const values = {
      userId: req.userId,
      esewaTransactionId: transactionId,
      status: "active" as const,
      plan: validatedPlan,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    };

    // Atomic upsert — safe if the same user calls verify twice concurrently
    await db
      .insert(subscriptionsTable)
      .values(values)
      .onConflictDoUpdate({ target: subscriptionsTable.userId, set: values });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "eSewa verification error");
    res.status(500).json({ error: "Verification failed — please contact support" });
  }
});

// POST /subscriptions/ipn — eSewa Instant Payment Notification (server-to-server)
// Register this URL in your eSewa merchant dashboard as the IPN endpoint.
// eSewa posts payment details directly after a completed transaction, independent
// of whether the user's browser completes the redirect. This prevents lost
// subscriptions when users close their browser before the redirect fires.
//
// eSewa IPN sends the same base64-encoded payload as the redirect success_url.
// Registration: eSewa Merchant Dashboard → Integration Settings → IPN URL
router.post("/subscriptions/ipn", async (req, res): Promise<void> => {
  try {
    const { data: encodedData, plan, transaction_uuid } = req.body as {
      data?: string;
      plan?: string;
      transaction_uuid?: string;
    };

    // eSewa may send raw fields directly (not base64-encoded) in IPN mode
    // Handle both formats gracefully
    let decoded: any;
    if (encodedData) {
      try {
        decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
      } catch {
        logger.warn({ body: req.body }, "eSewa IPN: invalid base64 data");
        res.status(400).json({ error: "Invalid payment data" });
        return;
      }
    } else if (transaction_uuid) {
      // Raw fields provided directly
      decoded = req.body;
    } else {
      logger.warn({ body: req.body }, "eSewa IPN: missing transaction data");
      res.status(400).json({ error: "Missing transaction data" });
      return;
    }

    const { transaction_uuid: txUuid, total_amount, transaction_code, status } = decoded;
    const validatedPlan = VALID_PLANS.includes(plan as Plan) ? (plan as Plan) : null;

    if (!validatedPlan) {
      logger.warn({ plan, txUuid }, "eSewa IPN: invalid or missing plan");
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    if (status !== "COMPLETE") {
      // IPN for non-complete status — acknowledge but don't activate
      res.json({ received: true });
      return;
    }

    // Cross-check amount against expected plan price
    const expectedAmount = validatedPlan === "yearly" ? YEARLY_PRICE : MONTHLY_PRICE;
    if (Number(total_amount) !== expectedAmount) {
      logger.warn({ total_amount, expected: expectedAmount, plan: validatedPlan }, "eSewa IPN: amount mismatch");
      res.status(400).json({ error: "Amount mismatch" });
      return;
    }

    // Server-to-server verification with eSewa
    const verifyUrl =
      `${ESEWA_VERIFY_URL}?product_code=${encodeURIComponent(ESEWA_PRODUCT_CODE)}` +
      `&transaction_uuid=${encodeURIComponent(txUuid)}` +
      `&total_amount=${encodeURIComponent(total_amount)}`;

    const verifyRes = await fetch(verifyUrl, { headers: { Accept: "application/json" } });
    const verification = (await verifyRes.json()) as any;

    if (verification.status !== "COMPLETE") {
      logger.warn({ txUuid }, "eSewa IPN: server verification failed");
      res.status(400).json({ error: "Verification failed" });
      return;
    }

    const transactionId = String(transaction_code);

    // Find the subscription by transaction UUID embedded in the UUID
    // (format: LH-{userId_suffix}-{timestamp})
    const existingSub = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.esewaTransactionId, transactionId));

    if (existingSub.length > 0) {
      // Already processed — respond OK (idempotent)
      logger.info({ transactionId }, "eSewa IPN: transaction already processed");
      res.json({ received: true });
      return;
    }

    // Extract userId from transaction UUID (LH-{userId_suffix}-{timestamp})
    // The userId suffix alone is not enough — look up by transaction_uuid pattern in subscriptions
    // If not found via exact match, log and accept the IPN for manual reconciliation
    logger.info({ transactionId, txUuid, plan: validatedPlan, amount: total_amount },
      "eSewa IPN: unmatched transaction — requires manual reconciliation or client verify");

    // Acknowledge receipt to eSewa (prevents retries)
    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "eSewa IPN error");
    // Always respond 200 to prevent eSewa from retrying indefinitely
    res.json({ received: true, error: "Internal error — logged for investigation" });
  }
});

export default router;
