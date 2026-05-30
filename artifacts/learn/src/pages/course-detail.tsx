import React from "react";
import { useRoute, Link } from "wouter";
import {
  useGetCourse,
  useGetMySubscription,
  useCreateCheckoutSession
} from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, PlayCircle, Lock, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

const categoryColor: Record<string, string> = {
  Grammar: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Pedagogy: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Phonetics: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
  Literature: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const categoryGradient: Record<string, string> = {
  Grammar: "from-emerald-500 to-teal-500",
  Pedagogy: "from-amber-400 to-orange-500",
  Phonetics: "from-sky-400 to-blue-500",
  Literature: "from-rose-400 to-pink-500",
};

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id ? parseInt(params.id) : 0;

  const { data: course, isLoading } = useGetCourse(courseId, {
    query: { enabled: !!courseId, queryKey: ["getCourse", courseId] }
  });
  const { data: subscription, isLoading: isSubLoading } = useGetMySubscription();
  const checkoutMutation = useCreateCheckoutSession();
  const isPremium = subscription?.status === "active";

  useSEO({
    title: course ? `${course.title} — B.Ed English Course` : "B.Ed English Course",
    description: course?.description ?? undefined,
    ogImage: course?.thumbnailUrl ?? undefined,
  });

  const handleCheckout = () => {
    checkoutMutation.mutate({ data: { plan: "monthly" } }, {
      onSuccess: (res) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = res.paymentUrl;
        Object.entries(res.formData as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      },
      onError: (err: any) => {
        toast.error(err?.status === 503 ? "eSewa is not configured yet." : "Failed to start checkout.");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
        <Skeleton className="h-4 w-28 mb-8 bg-white/[0.05]" />
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-2/3">
            <Skeleton className="aspect-video w-full rounded-2xl mb-8 bg-white/[0.05]" />
            <Skeleton className="h-8 w-3/4 mb-4 bg-white/[0.05]" />
            <Skeleton className="h-4 w-full mb-2 bg-white/[0.05]" />
            <Skeleton className="h-4 w-2/3 bg-white/[0.05]" />
          </div>
          <div className="lg:w-1/3 space-y-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold mb-2">Course Not Found</h2>
        <p className="text-foreground/50 mb-6 text-sm">This course doesn't exist or has been removed.</p>
        <Link href="/courses"><Button data-testid="button-back-to-courses">Back to Courses</Button></Link>
      </div>
    );
  }

  const badgeClass = categoryColor[course.category] || "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20";
  const gradient = categoryGradient[course.category] || "from-violet-400 to-purple-500";

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <Link href="/courses" className="inline-flex items-center text-sm font-semibold text-foreground/50 hover:text-foreground mb-8 transition-colors group">
        <ArrowLeft className="mr-1.5 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to courses
      </Link>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left */}
        <div className="lg:w-2/3">
          <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-black/20 mb-8 shadow-2xl shadow-black/30">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-foreground/20">
                <BookOpen className="h-20 w-20 mb-4" />
                <span className="text-sm font-medium">No preview available</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* Top gradient accent line */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${gradient}`} />
            <div className="absolute bottom-5 left-5 flex gap-2">
              <Badge className={`text-xs font-bold border ${badgeClass}`}>{course.category}</Badge>
              {course.isFree && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold border-0 text-xs">FREE</Badge>
              )}
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-5">{course.title}</h1>

          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-foreground/45 mb-8 pb-8 border-b border-white/[0.06] dark:border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <span>{course.lessonCount} lessons</span>
            </div>
            {course.totalDurationMinutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>{Math.round(course.totalDurationMinutes / 60)}h {course.totalDurationMinutes % 60}m total</span>
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4">About this course</h2>
            <p className="whitespace-pre-line text-foreground/60 leading-relaxed text-base">{course.description}</p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-1/3">
          <div className="sticky top-24 space-y-5">
            {/* Upgrade card */}
            {!isPremium && !course.isFree && (
              <div className="glass-card gradient-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-base">Premium Course</h3>
                </div>
                <p className="text-sm text-foreground/50 mb-5 leading-relaxed">
                  Unlock all courses, PDF notes, and resources with a Premium subscription.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-xl font-bold h-11 gap-2 btn-glow"
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending || isSubLoading}
                  data-testid="button-upgrade-premium"
                >
                  <Sparkles className="h-4 w-4" />
                  {checkoutMutation.isPending ? "Loading..." : "Upgrade to Premium"}
                </Button>
              </div>
            )}

            {/* Lesson list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base">Course Content</h3>
                <span className="text-xs font-semibold text-foreground/40 glass-card px-2.5 py-1 rounded-full">
                  {course.lessons?.length || 0} lessons
                </span>
              </div>
              <div className="space-y-1.5">
                {course.lessons && course.lessons.length > 0 ? (
                  course.lessons.map((lesson, index) => {
                    const isLocked = !isPremium && !lesson.isFree && !course.isFree;
                    return isLocked ? (
                      <div key={lesson.id} className="flex items-center px-4 py-3 rounded-xl glass-card opacity-50">
                        <span className="text-xs font-mono text-foreground/40 w-6 shrink-0">{String(index+1).padStart(2,"0")}</span>
                        <span className="flex-1 text-sm font-medium text-foreground/50 truncate mx-3">{lesson.title}</span>
                        <Lock className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                      </div>
                    ) : (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="flex items-center px-4 py-3 rounded-xl glass-card glass-card-hover group transition-all"
                        data-testid={`link-lesson-${lesson.id}`}
                      >
                        <span className="text-xs font-mono text-foreground/40 group-hover:text-emerald-500 transition-colors w-6 shrink-0">{String(index+1).padStart(2,"0")}</span>
                        <div className="flex-1 mx-3 min-w-0">
                          <div className="text-sm font-medium line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{lesson.title}</div>
                          {lesson.durationMinutes && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-foreground/35">
                              <Clock className="h-3 w-3" /> {lesson.durationMinutes} min
                            </div>
                          )}
                        </div>
                        {lesson.isFree && !isPremium && (
                          <Badge className="text-[9px] px-1.5 py-0 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0">FREE</Badge>
                        )}
                        <PlayCircle className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-sm text-foreground/40 text-center py-8 glass-card rounded-xl border-dashed">
                    No lessons yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
