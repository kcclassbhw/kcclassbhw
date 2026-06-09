import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin-layout";
import { Link } from "wouter";
import { useListCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Course } from "@workspace/api-client-react";

const DEFAULT_CATEGORY = "Grammar";

export default function AdminCourses() {
  const { data: courses, isLoading, refetch } = useListCourses();
  const [search, setSearch] = useState("");
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title);
      setDescription(editingCourse.description);
      setCategory(editingCourse.category);
      setThumbnailUrl(editingCourse.thumbnailUrl || "");
      setIsFree(editingCourse.isFree || false);
      setIsPublished(editingCourse.isPublished);
    } else {
      resetForm();
    }
  }, [editingCourse, isModalOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory(DEFAULT_CATEGORY);
    setThumbnailUrl("");
    setIsFree(false);
    setIsPublished(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title, description, category, thumbnailUrl, isFree, isPublished };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data }, {
        onSuccess: () => {
          toast.success("Course updated");
          setIsModalOpen(false);
          refetch();
        }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast.success("Course created");
          setIsModalOpen(false);
          refetch();
        }
      });
    }
  };

  const handleTogglePublish = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({ id, data: { isPublished: !currentStatus } }, {
      onSuccess: () => {
        toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'}`);
        refetch();
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingCourse) return;
    deleteMutation.mutate({ id: deletingCourse.id }, {
      onSuccess: () => {
        toast.success("Course deleted");
        setDeletingCourse(null);
        refetch();
      },
      onError: () => {
        toast.error("Failed to delete course");
        setDeletingCourse(null);
      }
    });
  };

  const filteredCourses = courses?.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AdminLayout title="Course Manager">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search courses..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setEditingCourse(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={category} onChange={e => setCategory(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                    <Input id="thumbnailUrl" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
                    <Label htmlFor="isFree">Free Course</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} />
                    <Label htmlFor="isPublished">Published</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCourse ? "Update Course" : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid gap-4">
          {filteredCourses.map(course => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0 flex items-stretch">
                <div className="w-48 bg-zinc-100 dark:bg-zinc-900 hidden sm:block">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {course.category}</span>
                        <span>•</span>
                        <span>{course.lessonCount} lessons</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.isPublished ? "default" : "secondary"} className={course.isPublished ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0" : ""}>
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {course.isFree && <Badge variant="outline">Free</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 pt-4 border-t">
                    <Link href={`/admin/courses/${course.id}/lessons`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <BookOpen className="h-4 w-4" /> Manage Lessons
                      </Button>
                    </Link>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title={course.isPublished ? "Unpublish" : "Publish"}
                        onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      >
                        {course.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Edit"
                        onClick={() => { setEditingCourse(course); setIsModalOpen(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Delete" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setDeletingCourse(course)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border rounded-xl border-dashed bg-zinc-50 dark:bg-zinc-900/20">
          <BookOpen className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No courses found</h3>
          <p className="text-muted-foreground text-sm">Create a new course to get started.</p>
        </div>
      )}

      <AlertDialog open={!!deletingCourse} onOpenChange={(open) => { if (!open) setDeletingCourse(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingCourse?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course and all its lessons. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDeleteConfirm}
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
