import React, { useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { useGetAdminStats, useListAdminUsers, useListAdminSubscriptions, useUpdateUserRole } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CreditCard, BookOpen, TrendingUp, Check, Download, UserPlus, Activity, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
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
import { Label } from "@/components/ui/label";
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
    },
    onError: () => toast.error("Failed to revoke subscription"),
  });

  const handleRoleChange = (clerkId: string, role: string) => {
    updateRoleMutation.mutate({ clerkId, data: { role } }, {
      onSuccess: () => {
        toast.success(`Role updated to ${role}`);
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      },
      onError: () => toast.error("Failed to update user role"),
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
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  // Manual grant dialog
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlan, setGrantPlan] = useState("monthly");

  return (
    <AdminLayout title="Overview">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users className="h-4 w-4" />} isLoading={isStatsLoading} />
        <StatCard title="Active Subscriptions" value={stats?.activeSubscriptions} icon={<CreditCard className="h-4 w-4" />} isLoading={isStatsLoading} />
        <StatCard title="Total Courses" value={stats?.totalCourses} icon={<BookOpen className="h-4 w-4" />} isLoading={isStatsLoading} />
        <StatCard
          title="Monthly Revenue (NPR)"
          value={stats?.monthlyRevenue != null ? `NPR ${stats.monthlyRevenue.toLocaleString()}` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={isStatsLoading}
        />
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-8 max-w-2xl">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ── USERS TAB ── */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span>User Management</span>
                <div className="flex items-center gap-2">
                  {!isUsersLoading && users && (
                    <span className="text-sm font-normal text-muted-foreground">{users.length} users</span>
                  )}
                  <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-2">
                    <Download className="h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No users yet.</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Joined</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map(user => (
                        <tr key={user.clerkId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3 font-medium">{user.name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.subscriptionStatus === 'active' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">Premium</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs uppercase tracking-wider">Free</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">Actions</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(user.clerkId, "user")}>
                                  Set to User {user.role === "user" && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.clerkId, "admin")} className="text-red-600 focus:text-red-600">
                                  Set to Admin {user.role === "admin" && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                {user.subscriptionStatus !== "active" && (
                                  <DropdownMenuItem onClick={() => { setGrantUserId(user.clerkId); setGrantDialogOpen(true); }} className="text-emerald-600 focus:text-emerald-600">
                                    Grant Premium
                                  </DropdownMenuItem>
                                )}
                                {user.subscriptionStatus === "active" && (
                                  <DropdownMenuItem onClick={() => revokeSubMutation.mutate(user.clerkId)} className="text-amber-600 focus:text-amber-600">
                                    Revoke Premium
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SUBSCRIPTIONS TAB ── */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span>Subscriptions</span>
                <Button size="sm" onClick={() => { setGrantUserId(""); setGrantDialogOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <UserPlus className="h-4 w-4" /> Grant Manual Access
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubsLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !subscriptions || (subscriptions as any[]).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No subscriptions yet.</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Expires</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(subscriptions as any[]).map(sub => (
                        <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{sub.userName || "—"}</div>
                            <div className="text-xs text-muted-foreground">{sub.userEmail || sub.userId}</div>
                          </td>
                          <td className="px-4 py-3 capitalize font-medium">{sub.plan}</td>
                          <td className="px-4 py-3">
                            <Badge className={sub.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-zinc-400 hover:bg-zinc-500'}>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {sub.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), "MMM d, yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {sub.status === "active" ? (
                              <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => revokeSubMutation.mutate(sub.userId)}>
                                Revoke
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => { setGrantUserId(sub.userId); setGrantDialogOpen(true); }}>
                                Grant
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ENROLLMENT TAB ── */}
        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-500" />
                Course Enrollment Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEnrollmentLoading ? (
                <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !enrollmentStats || enrollmentStats.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No enrollment data yet.</div>
              ) : (
                <div className="space-y-3">
                  {enrollmentStats.map((c: any) => {
                    const max = Math.max(...enrollmentStats.map((x: any) => x.enrollments), 1);
                    const pct = Math.round((c.enrollments / max) * 100);
                    return (
                      <div key={c.courseId} className="flex items-center gap-4">
                        <div className="w-48 shrink-0 text-sm font-medium truncate">{c.title}</div>
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-24 text-right text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">{c.enrollments}</span> students
                        </div>
                        <div className="w-20 text-right text-xs text-muted-foreground">
                          {c.lessonsCompleted} completions
                        </div>
                        {!c.isPublished && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Draft</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TRANSACTIONS TAB ── */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>eSewa Transaction Log</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubsLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !subscriptions || (subscriptions as any[]).length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No transactions yet.</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">eSewa Tx ID</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(subscriptions as any[]).map(sub => (
                        <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{sub.userName || "—"}</div>
                            <div className="text-xs text-muted-foreground">{sub.userEmail || sub.userId}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {sub.esewaTransactionId ? (
                              <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{sub.esewaTransactionId}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Manual / None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 capitalize">{sub.plan}</td>
                          <td className="px-4 py-3">
                            <Badge className={sub.status === "active" ? "bg-emerald-500" : "bg-zinc-400"}>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {format(new Date(sub.createdAt), "MMM d, yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACTIVITY TAB ── */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <div className="space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !activityData || activityData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No activity yet.</div>
              ) : (
                <div className="space-y-1">
                  {activityData.map((event: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 px-3 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        event.type === "user_joined"
                          ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}>
                        {event.type === "user_joined" ? <Users className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{event.description}</div>
                        <div className="text-xs text-muted-foreground">{event.detail}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(event.at), "MMM d, h:mm a")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── GRANT SUBSCRIPTION DIALOG ── */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Premium Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>User ID (Clerk ID)</Label>
              <Input
                value={grantUserId}
                onChange={e => setGrantUserId(e.target.value)}
                placeholder="user_2xyz..."
              />
              <p className="text-xs text-muted-foreground">
                Find this in the Users tab. It starts with <code>user_</code>.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={grantPlan} onValueChange={setGrantPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                  <SelectItem value="yearly">Yearly (365 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!grantUserId.trim() || grantSubMutation.isPending}
              onClick={() => {
                grantSubMutation.mutate({ userId: grantUserId.trim(), plan: grantPlan }, {
                  onSuccess: () => setGrantDialogOpen(false),
                });
              }}
            >
              {grantSubMutation.isPending ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string;
  value: string | number | undefined;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-md">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : value == null ? (
          <div className="text-2xl font-bold text-muted-foreground">—</div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
