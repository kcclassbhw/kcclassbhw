import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin-layout";
import { Link, useRoute } from "wouter";
import { useGetCourse, useListLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, ArrowLeft, GripVertical, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Lesson } from "@workspace/api-client-react";

export default function AdminLessons() {
  const [, params] = useRoute("/admin/courses/:id/lessons");
  const courseId = params?.id ? parseInt(params.id) : 0;

  const { data: course, isLoading: isCourseLoading } = useGetCourse(courseId, { query: { enabled: !!courseId, queryKey: ['getCourse', courseId] } });
  const { data: lessons, isLoading: isLessonsLoading, refetch } = useListLessons(courseId, { query: { enabled: !!courseId, queryKey: ['listLessons', courseId] } });
  
  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const deleteMutation = useDeleteLesson();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [order, setOrder] = useState<number>(1);

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title);
      setDescription(editingLesson.description || "");
      setYoutubeVideoId(editingLesson.youtubeVideoId || "");
      setVideoUrl(editingLesson.videoUrl || "");
      setDurationMinutes(editingLesson.durationMinutes || 0);
      setIsFree(editingLesson.isFree || false);
      setIsPublished(editingLesson.isPublished);
      setOrder(editingLesson.order);
    } else {
      resetForm();
    }
  }, [editingLesson, isModalOpen, lessons]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setYoutubeVideoId("");
    setVideoUrl("");
    setDurationMinutes(0);
    setIsFree(false);
    setIsPublished(false);
    setOrder((lessons?.length || 0) + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      title, 
      description, 
      youtubeVideoId: youtubeVideoId || undefined, 
      videoUrl: videoUrl || undefined, 
      durationMinutes: durationMinutes || undefined,
      isFree, 
      isPublished,
      order
    };

    if (editingLesson) {
      updateMutation.mutate({ courseId, id: editingLesson.id, data }, {
        onSuccess: () => {
          toast.success("Lesson updated");
          setIsModalOpen(false);
          refetch();
        }
      });
    } else {
      createMutation.mutate({ courseId, data }, {
        onSuccess: () => {
          toast.success("Lesson created");
          setIsModalOpen(false);
          refetch();
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      deleteMutation.mutate({ courseId, id }, {
        onSuccess: () => {
          toast.success("Lesson deleted");
          refetch();
        }
      });
    }
  };

  return (
    <AdminLayout title="Lesson Manager">
      <div className="mb-6">
        <Link href="/admin/courses" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Link>
        {isCourseLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Managing lessons for: <span className="text-foreground">{course?.title}</span>
          </h2>
        )}
      </div>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="text-sm text-muted-foreground">
          {lessons?.length || 0} lessons total
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setEditingLesson(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingLesson ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description / Notes</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                </div>
                
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg space-y-4 border">
                  <div className="font-medium text-sm">Video Source (Provide One)</div>
                  <div className="grid gap-2">
                    <Label htmlFor="youtubeId">YouTube Video ID (e.g. dQw4w9WgXcQ)</Label>
                    <Input id="youtubeId" value={youtubeVideoId} onChange={e => setYoutubeVideoId(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="videoUrl">Direct Video URL (.mp4)</Label>
                    <Input id="videoUrl" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" type="number" min="0" value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="order">Sort Order</Label>
                    <Input id="order" type="number" min="1" value={order} onChange={e => setOrder(parseInt(e.target.value) || 1)} required />
                  </div>
                </div>
                
                <div className="flex items-center gap-8 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
                    <Label htmlFor="isFree">Free Preview</Label>
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
                  {editingLesson ? "Update Lesson" : "Create Lesson"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLessonsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : lessons && lessons.length > 0 ? (
        <div className="space-y-3">
          {[...lessons].sort((a,b) => a.order - b.order).map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-muted-foreground cursor-grab hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="w-8 text-center font-mono text-muted-foreground">{lesson.order}</div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {lesson.title}
                      {!lesson.isPublished && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Draft</Badge>}
                      {lesson.isFree && <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1 py-0 h-4 border-0 hover:bg-emerald-500/20">Free Preview</Badge>}
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      {lesson.durationMinutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.durationMinutes} min</span>}
                      {lesson.youtubeVideoId && <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" /> YouTube</span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Edit"
                      onClick={() => { setEditingLesson(lesson); setIsModalOpen(true); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Delete" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleDelete(lesson.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-xl border-dashed bg-zinc-50 dark:bg-zinc-900/20">
          <PlayCircle className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-1">No lessons yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Start adding content to your course.</p>
          <Button onClick={() => setIsModalOpen(true)}>Add First Lesson</Button>
        </div>
      )}
    </AdminLayout>
  );
}