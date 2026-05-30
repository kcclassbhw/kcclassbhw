import React, { useState } from "react";
import { Link } from "wouter";
import { useListCourses } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, Clock, X } from "lucide-react";

export default function CoursesPage() {
  useSEO({
    title: "Course Catalog",
    description: "Browse all B.Ed English courses — grammar, literature, pedagogy, phonetics, and writing skills. Structured lessons for B.Ed students.",
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: courses, isLoading } = useListCourses({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
  });

  const categories = ["all", "Grammar", "Literature", "Pedagogy", "Language Skills", "Phonetics", "Writing Skills"];

  const getCategoryGradient = (cat: string) => {
    switch (cat) {
      case "Grammar": return "from-emerald-500 to-teal-500";
      case "Pedagogy": return "from-amber-400 to-orange-500";
      case "Phonetics": return "from-sky-400 to-blue-500";
      case "Literature": return "from-rose-400 to-pink-500";
      default: return "from-violet-400 to-purple-500";
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "Grammar": return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Pedagogy": return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Phonetics": return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "Literature": return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default: return "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20";
    }
  };

  const getCategoryPillStyle = (cat: string, active: boolean) => {
    if (!active) return "glass-card text-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/[0.08] border border-white/[0.08]";
    switch (cat) {
      case "all": return "bg-foreground text-background border border-transparent shadow-sm";
      case "Grammar": return "bg-emerald-500 text-white border border-emerald-400/30 shadow-md shadow-emerald-500/25";
      case "Pedagogy": return "bg-amber-500 text-white border border-amber-400/30 shadow-md shadow-amber-500/25";
      case "Phonetics": return "bg-sky-500 text-white border border-sky-400/30 shadow-md shadow-sky-500/25";
      case "Literature": return "bg-rose-500 text-white border border-rose-400/30 shadow-md shadow-rose-500/25";
      default: return "bg-violet-500 text-white border border-violet-400/30 shadow-md shadow-violet-500/25";
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-7xl">
      {/* Header */}
      <div className="mb-10 md:mb-12">
        <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3">Explore</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Course Catalog</h1>
            <p className="text-foreground/55 text-lg max-w-xl">Structured B.Ed English lessons — grammar, literature, pedagogy, and more.</p>
          </div>
          {!isLoading && courses && (
            <div className="shrink-0 glass-card rounded-full px-4 py-2 text-sm font-bold text-foreground/50">
              {courses.length} course{courses.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <Input
          placeholder="Search courses and topics..."
          className="pl-11 h-12 rounded-2xl bg-white/60 dark:bg-white/[0.04] border-black/[0.07] dark:border-white/[0.08] focus-visible:ring-emerald-500 font-medium placeholder:text-foreground/30 text-base shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-courses"
        />
        {search && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors"
            onClick={() => setSearch("")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${getCategoryPillStyle(cat, category === cat)}`}
            data-testid={`filter-${cat}`}
          >
            {cat === "all" ? "All Courses" : cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <Skeleton className="h-52 w-full rounded-none bg-white/[0.05]" />
              <div className="p-6">
                <Skeleton className="h-4 w-20 mb-4 bg-white/[0.05]" />
                <Skeleton className="h-6 w-full mb-3 bg-white/[0.05]" />
                <Skeleton className="h-4 w-3/4 mb-2 bg-white/[0.05]" />
                <Skeleton className="h-4 w-1/2 bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <>
          {(search || category !== "all") && (
            <p className="text-sm text-foreground/45 font-medium mb-5">
              {courses.length} result{courses.length !== 1 ? "s" : ""}
              {search && <> for <span className="text-foreground/70">"{search}"</span></>}
              {category !== "all" && <> in <span className="text-foreground/70">{category}</span></>}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/[0.08] hover:-translate-y-1">
                  {/* Top gradient accent */}
                  <div className={`h-1 w-full bg-gradient-to-r ${getCategoryGradient(course.category)}`} />

                  {/* Thumbnail */}
                  <div className="aspect-[16/10] relative overflow-hidden bg-black/10 dark:bg-white/[0.03]">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/20">
                        <BookOpen className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <Badge className={`absolute top-4 left-4 text-xs font-bold border ${getCategoryBadge(course.category)}`}>
                      {course.category}
                    </Badge>
                    {course.isFree && (
                      <Badge className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold border-0 text-xs">
                        FREE
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col gap-3">
                    <h3 className="text-base font-bold leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-foreground/50 line-clamp-2 leading-relaxed flex-1">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground/40 pt-3 border-t border-white/[0.05] dark:border-white/[0.04]">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{course.lessonCount} lessons</span>
                      </div>
                      {course.totalDurationMinutes ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{Math.round(course.totalDurationMinutes / 60)}h {course.totalDurationMinutes % 60}m</span>
                        </div>
                      ) : (
                        <span className="text-foreground/25">Free to start</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl py-20 text-center">
          <div className="h-20 w-20 rounded-2xl glass-card flex items-center justify-center mb-6 mx-auto rotate-6">
            <Search className="h-9 w-9 text-foreground/30 -rotate-6" />
          </div>
          <h3 className="font-display font-bold text-2xl mb-3">No courses found</h3>
          <p className="text-foreground/50 mb-8 max-w-sm mx-auto text-sm">
            Try adjusting your search or selecting a different category.
          </p>
          <Button
            className="rounded-full px-8 font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
            onClick={() => { setSearch(""); setCategory("all"); }}
            data-testid="button-clear-filters"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
