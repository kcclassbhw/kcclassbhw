import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useVerifyPayment } from "@workspace/api-client-react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PaymentVerifyPage() {
  const [, setLocation] = useLocation();
  const verifyMutation = useVerifyPayment();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    const plan = params.get("plan");

    if (!encodedData || !plan) {
      setStatus("error");
      setErrorMsg("Payment data is missing. Please try again from the pricing page.");
      return;
    }

    verifyMutation.mutate(
      { data: { encodedData, plan } },
      {
        onSuccess: () => {
          setStatus("success");
          setTimeout(() => setLocation("/dashboard"), 3500);
        },
        onError: (err: any) => {
          setStatus("error");
          setErrorMsg(
            err?.payload?.error ||
            err?.message ||
            "Payment verification failed. Please contact support with your transaction details."
          );
        },
      }
    );
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Verifying your payment</h2>
            <p className="text-foreground/50 text-sm">Please wait while we confirm your eSewa transaction…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 text-emerald-600 dark:text-emerald-400">
              Payment Successful!
            </h2>
            <p className="text-foreground/50 text-sm mb-6">
              Your subscription is now active. Redirecting you to your dashboard…
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 rounded-xl font-semibold gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-foreground/50 text-sm mb-6">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <Link href="/pricing">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 rounded-xl font-semibold">
                  Try Again
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full rounded-xl">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
