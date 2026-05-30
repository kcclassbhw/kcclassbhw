import React from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  useGetDashboardSummary,
  useGetContinueWatching,
  useGetMySubscription
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle, Clock, Download, PlayCircle, Trophy, Sparkles, Library, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: continueWatching, isLoading: isContinueWatchingLoading } = useGetContinueWatching();
  const { data: subscription, isLoading: isSubLoading } = useGetMySubscription();
  const isPremium = subscription?.status === "active";

  const completionPct = summary && summary.totalLessons > 0
    ? Math.round((summary.completedLessons / summary.totalLessons) * 100)
    : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5">
        <div>
          <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2">
            {greeting}{user?.firstName ? `, ${user.firstName}` : ""} 👋
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">My Dashboard</h1>
        </div>
        {isSubLoading ? (
          <Skeleton className="h-9 w-36 rounded-full bg-white/[0.05]" />
        ) : isPremium ? (
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" /> Premium Member
          </div>
        ) : (
          <Link href="/pricing">
            <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-full font-semibold btn-glow">
              <Trophy className="h-4 w-4" /> Upgrade to Premium
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Enrolled"
          value={summary?.enrolledCourses}
          icon={<BookOpen className="h-5 w-5" />}
          iconColor="text-emerald-400"
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Completed"
          value={summary?.completedLessons}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="text-teal-400"
          sub={summary ? `of ${summary.totalLessons} lessons` : undefined}
          isLoading={isSummaryLoading}
        />
        <StatCard
          title="Downloads"
          value={summary?.totalDownloads}
          icon={<Download className="h-5 w-5" />}
          iconColor="text-sky-400"
          isLoading={isSummaryLoading}
        />
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Total Courses</span>
            <Library className="h-4 w-4 text-foreground/30" />
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-8 w-12 bg-white/[0.05]" />
          ) : (
            <div className="text-3xl font-display font-bold">{summary?.totalCourses || 0}</div>
          )}
          <Link href="/courses">
            <Button variant="link" className="px-0 h-auto py-0 text-emerald-500 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all" data-testid="link-browse-courses">
              Browse catalog <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      {!isSummaryLoading && summary && summary.totalLessons > 0 && (
        <div className="glass-card rounded-2xl p-5 mb-12 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold">Overall Progress</span>
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{completionPct}%</span>
          </div>
          <div className="h-2.5 w-full bg-white/[0.07] dark:bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-xs text-foreground/40 font-medium mt-2">
            {summary.completedLessons} of {summary.totalLessons} lessons completed
          </p>
        </div>
      )}
      {!isSummaryLoading && (!summary || summary.totalLessons === 0) && (
        <div className="mb-12" />
      )}

      {/* Continue Watching */}
      <div className="mb-6 flex items-center gap-2">
        <Clock className="h-4 w-4 text-foreground/40" />
        <h2 className="font-display text-xl font-bold">Continue Watching</h2>
        {continueWatching && continueWatching.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-foreground/35 glass-card px-2.5 py-1 rounded-full">
            {continueWatching.length} in progress
          </span>
        )}
      </div>

      {isContinueWatchingLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none bg-white/[0.05]" />
              <div className="p-5">
                <Skeleton className="h-4 w-3/4 mb-2 bg-white/[0.05]" />
                <Skeleton className="h-4 w-1/2 mb-5 bg-white/[0.05]" />
                <Skeleton className="h-9 w-full rounded-xl bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : continueWatching && continueWatching.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {continueWatching.map((item) => (
            <div key={`${item.courseId}-${item.lessonId}`} className="glass-card glass-card-hover rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/[0.08]">
              <div className="aspect-video relative bg-black/10 dark:bg-white/[0.03]">
                {item.courseThumbnailUrl ? (
                  <img src={item.courseThumbnailUrl} alt={item.courseTitle} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/20">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                {item.completed && (
                  <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-sm line-clamp-1 mb-1">{item.courseTitle}</h3>
                <p className="text-xs text-foreground/50 font-medium line-clamp-1 mb-4">{item.lessonTitle}</p>
                <Link href={`/courses/${item.courseId}/lessons/${item.lessonId}`}>
                  <Button
                    className={`w-full gap-2 rounded-xl font-semibold text-sm h-9 transition-all ${
                      item.completed
                        ? "bg-white/[0.07] dark:bg-white/[0.06] hover:bg-white/[0.12] text-foreground border border-white/[0.08]"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 btn-glow"
                    }`}
                    data-testid={`button-continue-${item.lessonId}`}
                  >
                    {item.completed ? "Review Lesson" : "Resume"} <PlayCircle className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl py-16 text-center">
          <div className="h-16 w-16 rounded-2xl glass-card flex items-center justify-center mb-5 mx-auto">
            <PlayCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">No courses started yet</h3>
          <p className="text-foreground/50 mb-7 max-w-sm mx-auto text-sm">
            Browse our catalog and start learning today.
          </p>
          <Link href="/courses">
            <Button className="rounded-full px-8 font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 btn-glow" data-testid="button-explore-courses">
              Explore Courses
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, iconColor, sub, isLoading }: {
  title: string; value?: number; icon: React.ReactNode; iconColor: string; sub?: string; isLoading: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{title}</span>
        <div className={`${iconColor}`}>{icon}</div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-16 bg-white/[0.05]" />
      ) : (
        <div className="text-3xl font-display font-bold">{value ?? 0}</div>
      )}
      {sub && <p className="text-xs text-foreground/40 font-medium">{sub}</p>}
    </div>
  );
}
