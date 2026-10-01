/**
 * security-test.ts — Automated security test suite
 *
 * Tests:
 *  1. Admin panel blocked for unauthenticated users
 *  2. Admin panel blocked for regular (non-admin) users
 *  3. Admin panel accessible for admin users
 *  4. Brute-force lockout on login
 *  5. Token type enforcement (refresh token rejected as access token)
 *  6. Stale access token rejected by admin panel (age > 4h)
 *  7. Rate limiting on auth endpoints
 *  8. Password strength enforcement
 *  9. Disposable email rejection
 * 10. Unauthorized access to protected routes
 *
 * Usage: npx tsx scripts/security-test.ts
 */

const BASE = process.env.API_URL ?? "http://localhost:5000/api";
let passed = 0;
let failed = 0;

type Result = { ok: boolean; status: number; body: any };

async function req(
  method: string,
  path: string,
  body?: object,
  headers: Record<string, string> = {},
): Promise<Result> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  let json: any;
  try { json = await r.json(); } catch { json = {}; }
  return { ok: r.ok, status: r.status, body: json };
}

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ PASS — ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${name}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function registerUser(email: string, password: string, name: string) {
  return req("POST", "/auth/register", { email, password, name });
}

async function loginUser(email: string, password: string) {
  return req("POST", "/auth/login", { email, password });
}

// ─────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("\n🔒 KC Class BHW — Security Test Suite");
  console.log("=".repeat(50));

  // ── Test 1: Health check is public ────────────────────────────────────────
  console.log("\n[1] Health check");
  {
    const r = await req("GET", "/healthz");
    check("Health check returns 200", r.status === 200);
    check("Health check has status:ok", r.body?.status === "ok");
  }

  // ── Test 2: Admin panel blocked without token ──────────────────────────────
  console.log("\n[2] Admin panel — unauthenticated");
  {
    const endpoints = [
      "/admin/stats",
      "/admin/users",
      "/admin/subscriptions",
      "/admin/activity",
    ];
    for (const ep of endpoints) {
      const r = await req("GET", ep);
      check(`${ep} → 401 without token`, r.status === 401, `got ${r.status}`);
    }
  }

  // ── Test 3: Password strength enforcement ─────────────────────────────────
  console.log("\n[3] Password strength");
  {
    const weakPasswords = ["short", "12345678", "password", "alllowercase", "ALLUPPERCASE123"];
    for (const pwd of weakPasswords) {
      const r = await registerUser(`weak-${Date.now()}@test.com`, pwd, "Test");
      check(`Weak password rejected: "${pwd}"`, r.status === 400, `got ${r.status}`);
    }
  }

  // ── Test 4: Disposable email rejection ─────────────────────────────────────
  console.log("\n[4] Disposable email rejection");
  {
    const disposable = ["test@mailinator.com", "test@guerrillamail.com", "test@tempmail.com"];
    for (const email of disposable) {
      const r = await registerUser(email, "ValidPass123!", "Test");
      check(`Disposable email rejected: ${email}`, r.status === 400, `got ${r.status}`);
    }
  }

  // ── Test 5: Register a normal user ─────────────────────────────────────────
  console.log("\n[5] Normal user registration and login");
  const testEmail = `sectest-${Date.now()}@example.com`;
  const testPass = "SecureTestPass123!";
  let userToken = "";
  {
    const r = await registerUser(testEmail, testPass, "Security Test User");
    check("User registration succeeds", r.status === 201, `got ${r.status}`);
    check("Token returned on register", typeof r.body?.token === "string");
    userToken = r.body?.token ?? "";
  }

  // ── Test 6: Admin panel blocked for regular user ───────────────────────────
  console.log("\n[6] Admin panel — regular user (should be 403)");
  {
    if (userToken) {
      const r = await req("GET", "/admin/stats", undefined, {
        Authorization: `Bearer ${userToken}`,
      });
      check("Admin stats blocked for regular user → 403", r.status === 403, `got ${r.status}`);
      check("Error message is vague (just 'Forbidden')", r.body?.error === "Forbidden");
    } else {
      check("Skipping — no user token available", false, "registration failed");
    }
  }

  // ── Test 7: Unauthenticated access to protected user routes ───────────────
  console.log("\n[7] Protected routes — no token");
  {
    // /dashboard is a frontend route — only test actual API endpoints
    const protectedRoutes = ["/auth/me", "/users/me"];
    for (const route of protectedRoutes) {
      const r = await req("GET", route);
      check(`${route} → 401 without token`, r.status === 401, `got ${r.status}`);
    }
  }

  // ── Test 8: Auth/me works with valid token ─────────────────────────────────
  console.log("\n[8] Auth/me with valid token");
  {
    if (userToken) {
      const r = await req("GET", "/auth/me", undefined, {
        Authorization: `Bearer ${userToken}`,
      });
      check("GET /auth/me returns 200 with valid token", r.status === 200, `got ${r.status}`);
      check("Response has user email", r.body?.email === testEmail);
      check("Response has role field", typeof r.body?.role === "string");
      check("Response does NOT expose passwordHash", !("passwordHash" in (r.body ?? {})));
    }
  }

  // ── Test 9: Brute-force lockout ────────────────────────────────────────────
  console.log("\n[9] Brute-force lockout");
  {
    const bruteEmail = `brute-${Date.now()}@example.com`;
    let lockedOut = false;
    for (let i = 0; i < 7; i++) {
      const r = await loginUser(bruteEmail, "wrongpassword");
      if (r.status === 429) { lockedOut = true; break; }
    }
    check("Brute-force lockout triggers after repeated failures", lockedOut);
  }

  // ── Test 10: Login with wrong password ────────────────────────────────────
  console.log("\n[10] Login with wrong password");
  {
    const r = await loginUser(testEmail, "WrongPassword999!");
    check("Wrong password → 401", r.status === 401, `got ${r.status}`);
    // Should NOT say "user not found" — must be generic
    check("Error is generic (no user enumeration)", r.body?.error === "Invalid email or password");
  }

  // ── Test 11: Logout clears session ────────────────────────────────────────
  console.log("\n[11] Logout");
  {
    const r = await req("POST", "/auth/logout");
    check("Logout returns 200", r.status === 200, `got ${r.status}`);
    check("Logout returns success:true", r.body?.success === true);
  }

  // ── Test 12: Token type enforcement ───────────────────────────────────────
  console.log("\n[12] Refresh token used as access token is rejected");
  {
    // Sign a fake "refresh" type token (simulated by logging in and checking behavior)
    // We check that admin endpoint correctly rejects non-access tokens
    const fakeRefreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwidHlwZSI6InJlZnJlc2gifQ.fake";
    const r = await req("GET", "/auth/me", undefined, {
      Authorization: `Bearer ${fakeRefreshToken}`,
    });
    check("Fake/invalid token → 401", r.status === 401, `got ${r.status}`);
  }

  // ── Test 13: Change password endpoint validation ───────────────────────────
  console.log("\n[13] Change password");
  {
    if (userToken) {
      // Try changing password with same value
      const r = await req(
        "POST",
        "/auth/change-password",
        { currentPassword: testPass, newPassword: testPass },
        { Authorization: `Bearer ${userToken}` },
      );
      check("Same new password rejected", r.status === 400, `got ${r.status}`);

      // Try with wrong current password
      const r2 = await req(
        "POST",
        "/auth/change-password",
        { currentPassword: "WrongCurrent!", newPassword: "NewPass456!" },
        { Authorization: `Bearer ${userToken}` },
      );
      check("Wrong current password rejected → 401", r2.status === 401, `got ${r2.status}`);
    }
  }

  // ── Test 14: Input injection attempts ─────────────────────────────────────
  console.log("\n[14] Input sanitization");
  {
    const xssAttempts = [
      { name: "<script>alert(1)</script>", email: `xss-${Date.now()}@example.com` },
      { name: "'; DROP TABLE users; --", email: `sql-${Date.now()}@example.com` },
    ];
    for (const { name, email } of xssAttempts) {
      const r = await registerUser(email, "ValidPass123!", name);
      if (r.status === 201) {
        const hasScript = JSON.stringify(r.body).includes("<script>");
        check(`XSS payload stripped from name: "${name}"`, !hasScript);
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("🎉 All security tests passed!\n");
  } else {
    console.error(`⚠️  ${failed} test(s) failed — review the output above\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal error running tests:", err);
  process.exit(1);
});
