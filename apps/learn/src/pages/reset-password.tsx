import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { updatePassword } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setTimeout(() => {
        setLocation("/sign-in");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Choose a new password</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create a strong password for your account
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                ✓
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Password updated!</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link href="/sign-in">
                <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                  Sign in now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
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
                {loading ? "Updating password…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
