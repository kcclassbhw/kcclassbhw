import React, { useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { useGetAdminStats, useListAdminUsers, useListAdminSubscriptions, useUpdateUserRole } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard, BookOpen, TrendingUp, Check, Download, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = import.meta.env.VITE_API_URL || "";

async function authedFetch(getToken: () => Promise<string | null>, url: string, options: RequestInit = {}) {
  const token = await getToken();
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats({
    query: { refetchInterval: 30_000, queryKey: ["adminStats"] },
  });
  const { data: users, isLoading: isUsersLoading } = useListAdminUsers({
    query: { refetchInterval: 30_000, queryKey: ["adminUsers"] },
  });
  const { data: subscriptions, isLoading: isSubsLoading } = useListAdminSubscriptions({
    query: { refetchInterval: 30_000, queryKey: ["adminSubs"] },
  });

  const { data: enrollmentStats, isLoading: isEnrollmentLoading } = useQuery({
    queryKey: ["enrollmentStats"],
    queryFn: async () => {
      const r = await authedFetch(getToken, `${API}/api/admin/enrollment-stats`);
      return r.json();
    },
    refetchInterval: 60_000,
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ["adminActivity"],
    queryFn: async () => {
      const r = await authedFetch(getToken, `${API}/api/admin/activity`);
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const updateRoleMutation = useUpdateUserRole();

  const grantSubMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const r = await authedFetch(getToken, `${API}/api/admin/subscriptions/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Subscription granted");
      queryClient.invalidateQueries({ queryKey: ["adminSubs"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
    onError: () => toast.error("Failed to grant subscription"),
  });

  const revokeSubMutation = useMutation({
    mutationFn: async (userId: string) => {
      const r = await authedFetch(getToken, `${API}/api/admin/subscriptions/${userId}/revoke`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Subscription revoked");
      queryClient.invalidateQueries({ queryKey: ["adminSubs"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
    onError: () => toast.error("Failed to revoke subscription"),
  });

  const handleRoleChange = (clerkId: string, role: string) => {
    updateRoleMutation.mutate({ clerkId, data: { role } }, {
      onSuccess: () => {
        toast.success(`Role updated to ${role}`);
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      },
      onError: () => toast.error("Failed to update role"),
    });
  };

  const handleExportCSV = async () => {
    try {
      const r = await authedFetch(getToken, `${API}/api/admin/users/export`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlan, setGrantPlan] = useState("monthly");

  return (
    <AdminLayout title="Overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Total users" value={stats?.totalUsers} icon={<Users className="h-4 w-4" />} isLoading={isStatsLoading} />
        <StatCard title="Active subscriptions" value={stats?.activeSubscriptions} icon={<CreditCard className="h-4 w-4" />} isLoading={isStatsLoading} />
        <StatCard title="Courses" value={stats?.totalCourses} icon={<BookOpen className="h-4 w-4" />} isLoading={isStatsLoading} />
        <StatCard
          title="Est. monthly revenue"
          value={stats?.monthlyRevenue != null ? `NPR ${stats.monthlyRevenue.toLocaleString()}` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={isStatsLoading}
        />
      </div>

      <Tabs defaultValue="users">
        <TabsList className="h-auto bg-transparent rounded-none border-b border-border w-full justify-start p-0 gap-6 mb-8">
          {["users", "subscriptions", "enrollment", "transactions", "activity"].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none bg-transparent px-0 pb-3 pt-1 capitalize font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-colors"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* USERS */}
        <TabsContent value="users">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {!isUsersLoading && users ? `${users.length} registered users` : ""}
            </p>
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-2 h-8 text-xs">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {isUsersLoading ? (
                <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">No users yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={user.clerkId} className={`hover:bg-muted/40 transition-colors ${i < users.length - 1 ? "border-b" : ""}`}>
                        <td className="px-5 py-3 font-medium">{user.name || <span className="text-muted-foreground italic">No name</span>}</td>
                        <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-5 py-3">
                          {user.role === "admin" ? (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Admin</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">User</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {user.subscriptionStatus === "active" ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Premium</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Free</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => handleRoleChange(user.clerkId, "user")}>
                                Set as user {user.role === "user" && <Check className="ml-auto h-3.5 w-3.5" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(user.clerkId, "admin")} className="text-red-600 focus:text-red-600">
                                Set as admin {user.role === "admin" && <Check className="ml-auto h-3.5 w-3.5" />}
                              </DropdownMenuItem>
                              {user.subscriptionStatus !== "active" ? (
                                <DropdownMenuItem onClick={() => { setGrantUserId(user.clerkId); setGrantDialogOpen(true); }} className="text-emerald-600 focus:text-emerald-600">
                                  Grant premium access
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => revokeSubMutation.mutate(user.clerkId)} className="text-amber-600 focus:text-amber-600">
                                  Revoke premium access
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTIONS */}
        <TabsContent value="subscriptions">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {!isSubsLoading && subscriptions ? `${(subscriptions as any[]).length} total records` : ""}
            </p>
            <Button size="sm" onClick={() => { setGrantUserId(""); setGrantDialogOpen(true); }} className="gap-2 h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="h-3.5 w-3.5" /> Grant access manually
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {isSubsLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !subscriptions || (subscriptions as any[]).length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">No subscriptions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Expires</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(subscriptions as any[]).map((sub, i, arr) => (
                      <tr key={sub.id} className={`hover:bg-muted/40 transition-colors ${i < arr.length - 1 ? "border-b" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="font-medium">{sub.userName || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{sub.userEmail}</div>
                        </td>
                        <td className="px-5 py-3 capitalize text-sm">{sub.plan}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold ${sub.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {sub.status === "active" ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950" onClick={() => revokeSubMutation.mutate(sub.userId)}>
                              Revoke
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => { setGrantUserId(sub.userId); setGrantDialogOpen(true); }}>
                              Grant
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENROLLMENT */}
        <TabsContent value="enrollment">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Course enrollment</CardTitle>
              <p className="text-sm text-muted-foreground">Unique students who have started each course.</p>
            </CardHeader>
            <CardContent>
              {isEnrollmentLoading ? (
                <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !enrollmentStats || enrollmentStats.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">No enrollment data yet.</div>
              ) : (
                <div className="space-y-5">
                  {enrollmentStats.map((c: any) => {
                    const max = Math.max(...enrollmentStats.map((x: any) => x.enrollments), 1);
                    const pct = Math.round((c.enrollments / max) * 100);
                    return (
                      <div key={c.courseId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.title}</span>
                            {!c.isPublished && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">Draft</span>}
                          </div>
                          <span className="text-sm tabular-nums text-muted-foreground">
                            <span className="font-semibold text-foreground">{c.enrollments}</span> students
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRANSACTIONS */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">eSewa transactions</CardTitle>
              <p className="text-sm text-muted-foreground">All subscription records with payment reference IDs.</p>
            </CardHeader>
            <CardContent className="p-0">
              {isSubsLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !subscriptions || (subscriptions as any[]).length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">No transactions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Transaction ID</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subscriptions as any[]).map((sub, i, arr) => (
                      <tr key={sub.id} className={`hover:bg-muted/40 transition-colors ${i < arr.length - 1 ? "border-b" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="font-medium">{sub.userName || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{sub.userEmail}</div>
                        </td>
                        <td className="px-5 py-3">
                          {sub.esewaTransactionId ? (
                            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{sub.esewaTransactionId}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 capitalize text-sm">{sub.plan}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold ${sub.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {format(new Date(sub.createdAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest signups and subscription changes.</p>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <div className="space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !activityData || activityData.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">No activity yet.</div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-5 pl-6">
                    {activityData.map((event: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-muted ring-1 ring-border" />
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium leading-snug">{event.description}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{event.detail}</div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0 mt-0.5">
                            {format(new Date(event.at), "MMM d, h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* GRANT DIALOG */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant premium access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">User ID</Label>
              <Input
                value={grantUserId}
                onChange={e => setGrantUserId(e.target.value)}
                placeholder="user_2xyz…"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Find the Clerk ID in the Users tab.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Duration</Label>
              <Select value={grantPlan} onValueChange={setGrantPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly — 30 days</SelectItem>
                  <SelectItem value="yearly">Yearly — 365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!grantUserId.trim() || grantSubMutation.isPending}
              onClick={() => grantSubMutation.mutate({ userId: grantUserId.trim(), plan: grantPlan }, { onSuccess: () => setGrantDialogOpen(false) })}
            >
              {grantSubMutation.isPending ? "Granting…" : "Grant access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon, isLoading }: {
  title: string; value: string | number | undefined; icon: React.ReactNode; isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground/60">{icon}</div>
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <p className="text-2xl font-bold tracking-tight">{value ?? "—"}</p>
        )}
      </CardContent>
    </Card>
  );
}
