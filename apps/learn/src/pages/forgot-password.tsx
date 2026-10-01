import React, { useState } from "react";
import { Link } from "wouter";
import { resetPasswordForEmail, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Password reset requires Supabase Auth to be enabled in .env. Please contact the administrator.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordForEmail(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="w-[440px] max-w-full flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <a href={basePath || "/"} className="flex items-center gap-2.5 group">
            <img
              src={`${basePath}/logo.png`}
              alt="KC Class BHW"
              className="h-11 w-11 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">KC Class BHW</span>
          </a>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Reset your password</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Enter your email and we'll send you a password recovery link
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                ✓
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Check your inbox</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We've sent a password reset link to <strong className="text-zinc-900 dark:text-zinc-100">{email}</strong>.
              </p>
              <Link href="/sign-in">
                <Button variant="outline" className="w-full mt-2">
                  Return to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Registered email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0"
              >
                {loading ? "Sending link…" : "Send reset link"}
              </Button>

              <div className="text-center mt-2">
                <Link href="/sign-in" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-emerald-600">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
