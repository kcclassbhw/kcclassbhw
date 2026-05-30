import React, { useState } from "react";
import { useCreateCheckoutSession, useGetMySubscription } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Check, Info, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

function submitEsewaForm(paymentUrl: string, formData: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  Object.entries(formData).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function PricingPage() {
  useSEO({
    title: "Pricing — KC Class Premium",
    description: "Get full access to all B.Ed English courses, PDF notes, and resources. NPR 299/month or NPR 2399/year. Secure payment via eSewa.",
  });
  const [isYearly, setIsYearly] = useState(true);
  const checkoutMutation = useCreateCheckoutSession();
  const { data: subscription, isLoading: isSubLoading } = useGetMySubscription();
  const isPremium = subscription?.status === "active";

  const handleCheckout = (plan: "monthly" | "yearly") => {
    if (isPremium) return;
    checkoutMutation.mutate({ data: { plan } }, {
      onSuccess: (res) => {
        submitEsewaForm(res.paymentUrl, res.formData as Record<string, string>);
      },
      onError: (err: any) => {
        if (err?.status === 503) {
          toast.error("eSewa payment is not configured yet.");
        } else {
          toast.error("Failed to start checkout. Please try again.");
        }
      },
    });
  };

  const features = [
    "Unlimited access to all B.Ed English courses",
    "Downloadable PDF notes and grammar charts",
    "Question banks and model answer papers",
    "Previous year exam questions with solutions",
    "Phonetics and language pedagogy modules",
    "New lessons added regularly",
    "Cancel anytime",
  ];

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/[0.08] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 pt-16 md:pt-24 max-w-5xl relative z-10">
        {/* Heading */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-5">
            Simple,{" "}
            <span className="text-gradient">affordable</span>{" "}
            pricing
          </h1>
          <p className="text-foreground/55 text-lg max-w-xl mx-auto">
            Full access to all B.Ed English courses, PDF notes, and resources from KC Class BHW.
          </p>
          <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 glass-card rounded-full text-sm font-semibold text-foreground/60">
            <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            Secure payment via eSewa
          </div>
        </div>

        {/* Premium banner */}
        {isPremium && (
          <div className="glass-card gradient-border rounded-2xl max-w-2xl mx-auto mb-12 p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-emerald-600 dark:text-emerald-400">You are a Premium Member</h3>
                <p className="text-sm text-foreground/50">
                  {subscription?.currentPeriodEnd
                    ? `Access valid until ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}`
                    : "Full access to all content is active."}
                </p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" className="rounded-full font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0">
                View Subscription
              </Button>
            </Link>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="glass-card inline-flex items-center p-1.5 rounded-full gap-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                !isYearly
                  ? "bg-foreground text-background shadow-sm"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                isYearly
                  ? "bg-foreground text-background shadow-sm"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              Yearly
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Save 33%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className={`glass-card gradient-border rounded-3xl overflow-hidden transition-all ${isPremium ? "opacity-50 pointer-events-none" : "hover:shadow-2xl hover:shadow-emerald-500/[0.12]"}`}>
            {/* Top Bar */}
            <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center relative">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5" />
                <span className="font-display font-bold text-xl">KC Class Premium</span>
              </div>
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="text-center mb-8">
                <p className="text-sm text-foreground/50 font-medium mb-4">Complete B.Ed English preparation</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-foreground/50 text-lg font-semibold pb-2">NPR</span>
                  <span className="font-display text-6xl font-bold">{isYearly ? "2,399" : "299"}</span>
                  <span className="text-foreground/50 text-lg font-medium pb-2">/{isYearly ? "yr" : "mo"}</span>
                </div>
                {isYearly && (
                  <div className="inline-block mt-3 px-4 py-1.5 glass-card rounded-full text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Only NPR 199.92/month — save NPR 1,189
                  </div>
                )}
                {!isYearly && (
                  <div className="inline-block mt-3 px-4 py-1.5 glass-card rounded-full text-sm font-semibold text-foreground/50">
                    Billed monthly — switch to yearly to save 33%
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3.5 mb-8">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground/70">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className="w-full h-13 text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-2xl btn-glow transition-all active:scale-[0.98]"
                onClick={() => handleCheckout(isYearly ? "yearly" : "monthly")}
                disabled={checkoutMutation.isPending || isSubLoading || isPremium}
                data-testid="button-checkout"
              >
                {checkoutMutation.isPending ? "Redirecting to eSewa…" : isPremium ? "Current Plan" : (
                  <span className="flex items-center gap-2">Pay with eSewa <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>

              <div className="flex justify-center items-center gap-2 text-xs text-foreground/35 font-medium mt-4">
                <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                You will be redirected to eSewa to complete payment securely
              </div>
            </div>
          </div>

          {/* Renew notice for active subscribers */}
          {isPremium && (
            <div className="mt-6 text-center">
              <Link href="/settings">
                <Button variant="outline" className="gap-2 rounded-full font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                  <RefreshCw className="h-3.5 w-3.5" /> Renew or extend subscription
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-20 md:mt-28 max-w-4xl mx-auto">
          <h3 className="font-display text-3xl font-bold text-center mb-10">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: "How do I pay with eSewa?", a: "Click 'Pay with eSewa' and you'll be redirected to eSewa's secure payment page. Log in to your eSewa account or pay from your wallet to complete the transaction." },
              { q: "Are the PDFs and notes mine to keep?", a: "Yes — any notes or PDFs you download are yours to keep even after your subscription ends." },
              { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee. Contact us and we'll process your refund promptly." },
              { q: "Will new courses be added?", a: "Yes! New B.Ed English lessons and topics are added regularly based on the syllabus and student requests." },
              { q: "Can I cancel my subscription anytime?", a: "Since payments are processed per period via eSewa, your subscription simply expires at the end of the period. No automatic charges." },
              { q: "Do I need to renew manually?", a: "Yes — each payment covers one period (monthly or yearly). You can renew from your settings page before it expires." },
            ].map((faq, i) => (
              <div key={i} className="glass-card glass-card-hover rounded-2xl p-6">
                <h4 className="font-bold text-sm mb-2">{faq.q}</h4>
                <p className="text-sm text-foreground/50 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
