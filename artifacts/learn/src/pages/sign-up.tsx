import React, { useState } from "react";
import { useSignUp, useUser } from "@clerk/react";
import { Link, useLocation, Redirect } from "wouter";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "form" | "otp";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SignUpPage() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  if (userLoaded && isSignedIn) return <Redirect to="/dashboard" />;

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError("");
    const parts = name.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || undefined;
    try {
      await signUp.create({ emailAddress: email, firstName, lastName });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("otp");
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (otp.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch {}
  }

  async function handleGoogle() {
    if (!isLoaded || !signUp) return;
    setGoogleLoading(true);
    setError("");
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}${basePath}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}${basePath}/dashboard`,
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Google sign-up failed.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[15%] w-[70%] h-[70%] rounded-full bg-emerald-500/[0.12] dark:bg-emerald-500/[0.09] blur-[130px] animate-drift" />
        <div className="absolute -bottom-[30%] -right-[15%] w-[65%] h-[65%] rounded-full bg-teal-400/[0.09] dark:bg-teal-400/[0.07] blur-[130px] animate-drift" style={{ animationDelay: "-7s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <img src={`${basePath}/logo.svg`} alt="KC Class BHW" className="h-8 w-8" />
          <span className="font-display font-bold text-lg text-foreground group-hover:text-emerald-500 transition-colors">
            KC Class BHW
          </span>
        </Link>

        <div className="glass-card rounded-3xl p-8 md:p-10">
          {step === "form" ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-display font-bold text-foreground mb-1.5">Create your account</h1>
                <p className="text-sm text-foreground/50">Get started with KC Class BHW today</p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 gap-2.5 h-11 font-medium"
                onClick={handleGoogle}
                disabled={googleLoading || !isLoaded}
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              <div className="relative flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-foreground/30 font-medium">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/70 mb-1.5 block">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    autoFocus
                    className="w-full h-11 rounded-xl border border-border bg-background/50 px-4 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/70 mb-1.5 block">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-11 rounded-xl border border-border bg-background/50 px-4 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold gap-2 shadow-lg shadow-emerald-500/20"
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Create account <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-foreground/40 mt-6">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="mb-7 text-center">
                <h1 className="text-2xl font-display font-bold text-foreground mb-1.5">Verify your email</h1>
                <p className="text-sm text-foreground/50">We sent a 6-digit code to</p>
                <p className="text-sm text-foreground font-medium mt-0.5">{email}</p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/20"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-foreground/40 mt-6">
                Didn't get the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                >
                  Resend
                </button>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
