import React, { useEffect } from "react";
import {
  useGetMe, useUpdateMe, useGetMySubscription, useGetDownloadHistory
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, User, CreditCard, ShieldCheck, Sparkles, ArrowUpRight, RefreshCw, Clock, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format, differenceInDays } from "date-fns";
import { Link } from "wouter";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { data: me, isLoading: isMeLoading } = useGetMe();
  const updateMeMutation = useUpdateMe();
  const { data: subscription, isLoading: isSubLoading } = useGetMySubscription();
  const { data: downloads, isLoading: isDownloadsLoading } = useGetDownloadHistory();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", bio: "" },
  });

  useEffect(() => {
    if (me) form.reset({ name: me.name || "", bio: me.bio || "" });
  }, [me, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateMeMutation.mutate({ data }, {
      onSuccess: () => toast.success("Profile updated"),
      onError: () => toast.error("Failed to update profile"),
    });
  };

  if (isMeLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <Skeleton className="h-10 w-56 mb-10 bg-white/[0.05]" />
        <Skeleton className="h-12 w-full mb-8 rounded-xl bg-white/[0.05]" />
        <Skeleton className="h-72 w-full rounded-2xl bg-white/[0.05]" />
      </div>
    );
  }

  const isPremium = subscription?.status === "active";
  const daysLeft = subscription?.currentPeriodEnd
    ? differenceInDays(new Date(subscription.currentPeriodEnd), new Date())
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2">Account</p>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20 shrink-0">
            <AvatarImage src={me?.avatarUrl || ""} />
            <AvatarFallback className="font-bold text-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              {me?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{me?.name || "Your Account"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-foreground/45">{me?.email}</span>
              <Badge variant="outline" className="text-[10px] font-bold border-white/[0.1] px-2">
                {me?.role === "admin" ? "Admin" : "Student"}
              </Badge>
              {isPremium && (
                <Badge className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass-card rounded-xl p-1 h-auto gap-1 w-full sm:w-auto">
          <TabsTrigger value="profile" className="rounded-lg text-sm font-semibold px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-lg text-sm font-semibold px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="downloads" className="rounded-lg text-sm font-semibold px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
            <Download className="h-3.5 w-3.5" /> Downloads
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-5 mt-0">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-sm uppercase tracking-wider text-foreground/50 mb-6">Edit Profile</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/50">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl h-11 bg-white/50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.07]" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                      Bio <span className="normal-case font-normal text-foreground/35">(optional, max 160 chars)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us a bit about yourself"
                        className="resize-none h-20 rounded-xl bg-white/50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.07]"
                        data-testid="input-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button
                  type="submit"
                  disabled={updateMeMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-xl font-semibold h-11 px-8 btn-glow"
                  data-testid="button-save-profile"
                >
                  {updateMeMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </div>

          {me?.role === "admin" && (
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="h-12 w-12 glass-card rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-0.5">Admin Access</h3>
                <p className="text-xs text-foreground/40">Manage courses, lessons, users, and subscriptions.</p>
              </div>
              <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 rounded-xl font-semibold gap-2 text-sm shrink-0">
                <a href="/admin">Admin Panel <ArrowUpRight className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="mt-0">
          <div className={`glass-card rounded-2xl p-6 ${isPremium ? "gradient-border" : ""}`}>
            <h2 className="font-bold text-sm uppercase tracking-wider text-foreground/50 mb-6">Subscription Status</h2>
            {isSubLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl bg-white/[0.05]" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/[0.05]" />
              </div>
            ) : isPremium ? (
              <div className="space-y-4">
                <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/15 flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">Premium Active</div>
                    <div className="text-sm text-foreground/50 capitalize">{subscription?.plan} plan</div>
                  </div>
                </div>

                {subscription?.currentPeriodEnd && (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isExpiringSoon
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "glass-card text-foreground/55"
                  }`}>
                    {isExpiringSoon ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
                    {isExpiringSoon
                      ? `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — renew now to keep access`
                      : `Active until ${format(new Date(subscription.currentPeriodEnd), "MMMM d, yyyy")}`}
                  </div>
                )}

                <Link href="/pricing">
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl font-semibold border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-11"
                    data-testid="button-renew"
                  >
                    <RefreshCw className="h-4 w-4" /> Renew Subscription
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 glass-card rounded-xl">
                  <div className="font-bold mb-1">Free Tier</div>
                  <div className="text-sm text-foreground/40">Access to free lessons only. Upgrade to unlock everything.</div>
                </div>
                <Link href="/pricing">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-xl font-semibold h-11 gap-2 btn-glow">
                    <Sparkles className="h-4 w-4" /> Get Premium via eSewa
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Downloads Tab */}
        <TabsContent value="downloads" className="mt-0">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-sm uppercase tracking-wider text-foreground/50 mb-6">Download History</h2>
            {isDownloadsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/[0.05]" />)}
              </div>
            ) : downloads && downloads.length > 0 ? (
              <div className="rounded-xl overflow-hidden border border-white/[0.06] dark:border-white/[0.05] divide-y divide-white/[0.05] dark:divide-white/[0.04]">
                {downloads.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium flex-1 truncate">{d.resourceTitle}</span>
                    <span className="text-xs text-foreground/35 font-medium shrink-0">{format(new Date(d.downloadedAt), "MMM d, yyyy")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-14 w-14 glass-card rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Download className="h-6 w-6 text-foreground/25" />
                </div>
                <p className="font-semibold text-foreground/50 mb-1">No downloads yet</p>
                <p className="text-sm text-foreground/35 mb-5">Resources you download will appear here.</p>
                <Link href="/resources">
                  <Button variant="outline" className="rounded-full font-semibold border-white/[0.1]">
                    Browse Resource Vault
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
