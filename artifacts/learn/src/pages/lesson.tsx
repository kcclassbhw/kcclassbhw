import React from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetCourse, useGetLesson, useMarkLessonComplete, useGetProgress, useGetMySubscription
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LessonPage() {
  const [, params] = useRoute("/courses/:courseId/lessons/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;
  const lessonId = params?.id ? parseInt(params.id) : 0;

  const { data: course, isLoading: isCourseLoading } = useGetCourse(courseId, {
    query: { enabled: !!courseId, queryKey: ["getCourse", courseId] }
  });
  const { data: lesson, isLoading: isLessonLoading, error: lessonError } = useGetLesson(courseId, lessonId, {
    query: { enabled: !!(courseId && lessonId), queryKey: ["getLesson", courseId, lessonId], retry: false }
  });
  const { data: progressList } = useGetProgress();
  const { data: subscription } = useGetMySubscription();
  const markCompleteMutation = useMarkLessonComplete();

  const isPremium = subscription?.status === "active";
  const lessons = course?.lessons || [];
  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const isCompleted = progressList?.some(p => p.lessonId === lessonId && p.completed);

  React.useEffect(() => {
    if (lessonError && (lessonError as any).status === 403) {
      toast.error("This is a premium lesson. Please upgrade to access.");
      setLocation(`/courses/${courseId}`);
    }
  }, [lessonError, courseId, setLocation]);

  const handleMarkComplete = () => {
    const newState = !isCompleted;
    markCompleteMutation.mutate({ lessonId, data: { completed: newState } }, {
      onSuccess: () => toast.success(newState ? "Lesson marked as complete" : "Lesson marked as incomplete"),
    });
  };

  if (isCourseLoading || isLessonLoading) {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-68px)]">
        <div className="flex-1 p-6">
          <Skeleton className="w-full aspect-video rounded-2xl mb-6 bg-white/[0.05]" />
          <Skeleton className="h-8 w-2/3 mb-4 bg-white/[0.05]" />
          <Skeleton className="h-4 w-full mb-2 bg-white/[0.05]" />
          <Skeleton className="h-4 w-3/4 bg-white/[0.05]" />
        </div>
        <div className="w-full lg:w-80 border-l border-white/[0.06] p-4">
          <Skeleton className="h-6 w-1/2 mb-5 bg-white/[0.05]" />
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold mb-2">Lesson Not Found</h2>
        <p className="text-foreground/50 mb-6 text-sm">This lesson doesn't exist or you don't have access.</p>
        <Link href={course ? `/courses/${course.id}` : "/courses"}>
          <Button data-testid="button-back">Back to Course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-68px)]">
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-10 gap-3">
          <Link href={`/courses/${courseId}`} className="inline-flex items-center text-sm font-semibold text-foreground/50 hover:text-foreground transition-colors group shrink-0">
            <ArrowLeft className="mr-1.5 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline truncate max-w-[180px]">{course.title}</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkComplete}
            disabled={markCompleteMutation.isPending}
            className={cn(
              "gap-2 rounded-full font-semibold text-xs shrink-0 h-8 px-4 border",
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                : "glass-card border-white/[0.08] hover:border-white/[0.14]"
            )}
            data-testid="button-mark-complete"
          >
            <CheckCircle className={cn("h-3.5 w-3.5", isCompleted && "fill-current")} />
            {isCompleted ? "Completed" : "Mark Complete"}
          </Button>
        </div>

        <div className="flex-1 p-5 lg:p-8 max-w-5xl mx-auto w-full">
          {/* Video */}
          <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-black/40 border border-white/[0.06]">
            {lesson.youtubeVideoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${lesson.youtubeVideoId}?rel=0&showinfo=0&modestbranding=1`}
                title={lesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : lesson.videoUrl ? (
              <video src={lesson.videoUrl} controls className="w-full h-full object-contain" controlsList="nodownload" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-foreground/25">
                <PlayCircle className="h-14 w-14 mb-3 opacity-50" />
                <p className="text-sm">No video available.</p>
              </div>
            )}
          </div>

          <div className="mb-10">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">{lesson.title}</h1>
            {lesson.description && (
              <p className="whitespace-pre-line text-foreground/55 leading-relaxed text-base">{lesson.description}</p>
            )}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.06] pb-10 lg:pb-0 gap-4">
            {prevLesson ? (
              <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                <Button variant="outline" className="gap-2 rounded-full font-semibold glass-card border-white/[0.08] text-sm h-9" data-testid="button-prev-lesson">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
              </Link>
            ) : <div />}

            {nextLesson ? (
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-full font-semibold btn-glow text-sm h-9" data-testid="button-next-lesson">
                  Next Lesson <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href={`/courses/${courseId}`}>
                <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-full font-semibold btn-glow text-sm h-9" data-testid="button-finish-course">
                  Finish Course <CheckCircle className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col h-[50vh] lg:h-auto bg-background/50 backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-white/[0.06] font-bold text-xs uppercase tracking-wider text-foreground/40 flex items-center justify-between sticky top-0 bg-background/70 backdrop-blur-xl z-10">
          Course Content
          <span className="glass-card px-2.5 py-1 rounded-full text-xs font-semibold text-foreground/40 normal-case">
            {lessons.length} parts
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {lessons.map((l, idx) => {
              const isCurrent = l.id === lessonId;
              const isDone = progressList?.some(p => p.lessonId === l.id && p.completed);
              const isLocked = !isPremium && !l.isFree && !course.isFree;

              return isLocked ? (
                <div key={l.id} className="flex items-center p-3 rounded-xl opacity-40 text-foreground/50">
                  <Lock className="h-3.5 w-3.5 mr-3 shrink-0" />
                  <span className="text-sm font-medium truncate">{idx+1}. {l.title}</span>
                </div>
              ) : (
                <Link
                  key={l.id}
                  href={`/courses/${courseId}/lessons/${l.id}`}
                  className={cn(
                    "flex items-center p-3 rounded-xl transition-all cursor-pointer group border",
                    isCurrent
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "hover:bg-white/[0.04] border-transparent hover:border-white/[0.06]"
                  )}
                  data-testid={`link-sidebar-lesson-${l.id}`}
                >
                  <div className="mr-3 shrink-0">
                    {isDone ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                    ) : isCurrent ? (
                      <PlayCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-foreground/25 group-hover:text-foreground/50 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className={cn(
                      "text-sm font-medium line-clamp-2",
                      isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/60 group-hover:text-foreground/80 transition-colors"
                    )}>
                      {idx+1}. {l.title}
                    </div>
                    {l.durationMinutes && (
                      <div className="text-xs text-foreground/30 mt-0.5">{l.durationMinutes} min</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
