import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin-layout";
import {
  useListResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Search,
  Download,
  Link2,
  BookOpen,
  FolderOpen,
} from "lucide-react";

const CATEGORIES = [
  "Grammar",
  "Literature",
  "Pedagogy",
  "Phonetics",
  "Academic Writing",
  "Question Papers",
  "Notes",
  "Other",
];

type ResourceForm = {
  title: string;
  description: string;
  category: string;
  storageKey: string;
  fileSize: string;
  fileType: string;
};

const defaultForm: ResourceForm = {
  title: "",
  description: "",
  category: "Notes",
  storageKey: "",
  fileSize: "",
  fileType: "application/pdf",
};

export default function AdminResources() {
  const queryClient = useQueryClient();
  const { data: resources, isLoading } = useListResources(undefined, {
    query: { refetchInterval: 30_000, queryKey: ["listResources"] },
  });
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deleteMutation = useDeleteResource();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ResourceForm>(defaultForm);

  const filtered = (resources ?? []).filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || r.category === categoryFilter;
    return matchSearch && matchCat;
  });

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  }

  function openEdit(r: any) {
    setEditingId(r.id);
    setForm({
      title: r.title,
      description: r.description ?? "",
      category: r.category,
      storageKey: r.storageKey ?? "",
      fileSize: r.fileSize != null ? String(r.fileSize) : "",
      fileType: r.fileType ?? "application/pdf",
    });
    setIsModalOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["listResources"] });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId !== null) {
      const updateData = {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
      };
      updateMutation.mutate(
        { id: editingId, data: updateData },
        {
          onSuccess: () => {
            toast.success("Resource updated");
            setIsModalOpen(false);
            invalidate();
          },
          onError: () => toast.error("Failed to update resource"),
        }
      );
    } else {
      const createData = {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        storageKey: form.storageKey || "",
        fileSize: form.fileSize ? parseInt(form.fileSize) : 0,
        fileType: form.fileType || "application/pdf",
      };
      createMutation.mutate(
        { data: createData },
        {
          onSuccess: () => {
            toast.success("Resource created");
            setIsModalOpen(false);
            invalidate();
          },
          onError: () => toast.error("Failed to create resource"),
        }
      );
    }
  }

  function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Resource deleted");
          invalidate();
        },
        onError: () => toast.error("Failed to delete resource"),
      }
    );
  }

  return (
    <AdminLayout title="Resource Vault">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={(o) => {
            setIsModalOpen(o);
            if (!o) setEditingId(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shrink-0"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingId !== null ? "Edit Resource" : "Add New Resource"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    required
                    placeholder="e.g. B.Ed First Year Grammar Notes"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={2}
                    placeholder="Brief description of the resource"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>File Type</Label>
                    <Select
                      value={form.fileType}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, fileType: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="application/pdf">PDF</SelectItem>
                        <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</SelectItem>
                        <SelectItem value="application/vnd.openxmlformats-officedocument.presentationml.presentation">PPTX</SelectItem>
                        <SelectItem value="image/jpeg">Image (JPG)</SelectItem>
                        <SelectItem value="image/png">Image (PNG)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> File Details
                  </div>
                  <div className="grid gap-2">
                    <Label>
                      Storage Key{" "}
                      <span className="text-muted-foreground font-normal text-xs">
                        (internal file path for object storage)
                      </span>
                    </Label>
                    <Input
                      value={form.storageKey}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, storageKey: e.target.value }))
                      }
                      placeholder="resources/grammar-notes.pdf"
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>
                      File Size{" "}
                      <span className="text-muted-foreground font-normal text-xs">
                        (bytes, optional)
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.fileSize}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fileSize: e.target.value }))
                      }
                      placeholder="e.g. 204800"
                      disabled={editingId !== null}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId !== null ? "Update Resource" : "Create Resource"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats bar */}
      {!isLoading && resources && (
        <div className="flex gap-6 mb-6 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{resources.length}</strong>{" "}
            total resources
          </span>
          <span>
            <strong className="text-foreground">{filtered.length}</strong>{" "}
            shown
          </span>
          <span>
            <strong className="text-foreground">
              {resources.reduce((s, r) => s + (r.downloadCount ?? 0), 0)}
            </strong>{" "}
            total downloads
          </span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm truncate">{r.title}</h4>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {r.category}
                    </Badge>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {r.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {r.downloadCount ?? 0} downloads
                    </span>
                    {r.fileSize != null && r.fileSize > 0 && (
                      <span>{(r.fileSize / 1024).toFixed(0)} KB</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    onClick={() => openEdit(r)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDelete(r.id, r.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-xl border-dashed bg-zinc-50 dark:bg-zinc-900/20">
          <FolderOpen className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No resources yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add PDFs, notes, and study materials for your students.
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add First Resource
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
