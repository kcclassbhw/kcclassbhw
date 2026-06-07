import React, { useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Megaphone, Trash2, ToggleLeft, ToggleRight, Plus, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

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

const TYPE_STYLES = {
  info: { label: "Info", icon: <Info className="h-4 w-4" />, badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400", bar: "bg-sky-500" },
  warning: { label: "Warning", icon: <AlertTriangle className="h-4 w-4" />, badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", bar: "bg-amber-500" },
  success: { label: "Success", icon: <CheckCircle className="h-4 w-4" />, badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", bar: "bg-emerald-500" },
};

export default function AdminAnnouncements() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const r = await authedFetch(getToken, `${API}/api/admin/announcements`);
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { message: string; type: string }) => {
      const r = await authedFetch(getToken, `${API}/api/admin/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Announcement created");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: () => toast.error("Failed to create announcement"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const r = await authedFetch(getToken, `${API}/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: () => toast.error("Failed to update announcement"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await authedFetch(getToken, `${API}/api/admin/announcements/${id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: () => toast.error("Failed to delete announcement"),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    createMutation.mutate({ message: message.trim(), type });
  };

  return (
    <AdminLayout title="Announcements">
      <p className="text-muted-foreground mb-8 -mt-4">
        Post banners that appear at the top of the homepage for all visitors.
      </p>

      {/* Create Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="msg">Message</Label>
              <Input
                id="msg"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. Exam season is here — new mock papers added!"
                required
              />
            </div>
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Blue)</SelectItem>
                    <SelectItem value="warning">Warning (Amber)</SelectItem>
                    <SelectItem value="success">Success (Green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={!message.trim() || createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createMutation.isPending ? "Posting..." : "Post Announcement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      {message.trim() && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Preview</p>
          <div className={`${TYPE_STYLES[type as keyof typeof TYPE_STYLES]?.bar || "bg-sky-500"} text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-semibold rounded-lg`}>
            {TYPE_STYLES[type as keyof typeof TYPE_STYLES]?.icon}
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-500" />
            All Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No announcements yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: any) => {
                const style = TYPE_STYLES[a.type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.info;
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                      a.is_active ? "bg-card" : "bg-zinc-50 dark:bg-zinc-900/30 opacity-60"
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-lg ${style.badge} shrink-0`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold">{a.message}</span>
                        <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">
                          {a.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Posted {format(new Date(a.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={a.is_active ? "Deactivate" : "Activate"}
                        onClick={() => toggleMutation.mutate({ id: a.id, isActive: !a.is_active })}
                        disabled={toggleMutation.isPending}
                        className={a.is_active ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-zinc-400 hover:text-zinc-600"}
                      >
                        {a.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => {
                          if (confirm("Delete this announcement?")) deleteMutation.mutate(a.id);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
