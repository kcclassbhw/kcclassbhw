import React from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-foreground/50">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="text-sm">Finishing sign-in…</span>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
