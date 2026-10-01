import React, { useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

const API = import.meta.env.VITE_API_URL || "";

async function authedFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers ?? {}),
    },
  });
}

const TYPE_CONFIG = {
  info:    { label: "Info",    color: "bg-sky-500"    },
  warning: { label: "Warning", color: "bg-amber-500"  },
  success: { label: "Success", color: "bg-emerald-500" },
};

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const r = await authedFetch(`${API}/api/admin/announcements`);
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { message: string; type: string }) => {
      const r = await authedFetch(`${API}/api/admin/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Announcement posted");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: () => toast.error("Failed to post announcement"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const r = await authedFetch(`${API}/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] }),
    onError: () => toast.error("Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await authedFetch(`${API}/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <AdminLayout title="Announcements">
      <p className="text-muted-foreground text-sm mb-8 -mt-4">
        Post a banner that appears at the top of the homepage for all visitors.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> New announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={e => { e.preventDefault(); if (message.trim()) createMutation.mutate({ message: message.trim(), type }); }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className="text-sm">Message</Label>
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. New mock papers added for 2025 exam season!"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (blue)</SelectItem>
                    <SelectItem value="warning">Warning (amber)</SelectItem>
                    <SelectItem value="success">Success (green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {message.trim() && (
                <div className="rounded-lg overflow-hidden border">
                  <div className="text-[10px] font-semibold text-muted-foreground px-3 py-1.5 border-b bg-muted/50">Preview</div>
                  <div className={`${TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.color ?? "bg-sky-500"} px-4 py-2.5 text-white text-sm font-medium text-center`}>
                    {message}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={!message.trim() || createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Posting…" : "Post announcement"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Posted announcements</h3>

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              No announcements yet.
            </div>
          ) : (
            announcements.map((a: any) => {
              const cfg = TYPE_CONFIG[a.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-4 transition-opacity ${a.is_active ? "" : "opacity-50"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cfg.label} · {format(new Date(a.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={a.is_active}
                        onCheckedChange={checked => toggleMutation.mutate({ id: a.id, isActive: checked })}
                        aria-label="Toggle active"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => { if (confirm("Delete this announcement?")) deleteMutation.mutate(a.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
