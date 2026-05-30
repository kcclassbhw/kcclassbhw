import React, { useState } from "react";
import { useListChannelVideos } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, ThumbsUp, PlayCircle, Search, X, Youtube } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function VideosPage() {
  useSEO({
    title: "Free B.Ed English Videos",
    description: "Watch all B.Ed English video lessons from the KC Class BHW YouTube channel — grammar, literature, pedagogy, phonetics, and more.",
  });
  const { data: videos, isLoading, error } = useListChannelVideos();
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);

  const filtered = videos?.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.description.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-7xl">
      {/* Header */}
      <div className="mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm font-bold text-red-500 mb-4">
            <Youtube className="h-4 w-4" />
            KC Class BHW Channel
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Course Videos</h1>
          <p className="text-foreground/55 text-lg max-w-xl">
            All lessons from the KC Class BHW YouTube channel — watch directly or open on YouTube.
          </p>
        </div>
        <a
          href="https://www.youtube.com/@kcclassbhw/videos"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button
            variant="outline"
            className="gap-2 rounded-full font-semibold glass-card border-red-500/20 text-red-500 hover:bg-red-500/10 h-11 px-6"
          >
            <Youtube className="h-4 w-4" />
            Subscribe on YouTube
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 mb-10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input
            placeholder="Search videos by title or topic..."
            className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.07] focus-visible:ring-emerald-500 font-medium placeholder:text-foreground/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-foreground/40 font-medium mt-2 px-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none bg-white/[0.05]" />
              <div className="p-5">
                <Skeleton className="h-4 w-full mb-2 bg-white/[0.05]" />
                <Skeleton className="h-4 w-2/3 mb-4 bg-white/[0.05]" />
                <Skeleton className="h-3 w-1/3 bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <div className="h-16 w-16 rounded-2xl glass-card flex items-center justify-center mb-5 mx-auto">
            <Youtube className="h-8 w-8 text-red-400/60" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Couldn't load videos</h3>
          <p className="text-foreground/45 text-sm mb-6">There was a problem fetching the channel feed. Try again later.</p>
          <a href="https://www.youtube.com/@kcclassbhw/videos" target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full px-8 bg-red-500 hover:bg-red-600 text-white border-0 gap-2 font-semibold">
              <Youtube className="h-4 w-4" /> Watch on YouTube
            </Button>
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <div className="h-16 w-16 rounded-2xl glass-card flex items-center justify-center mb-5 mx-auto rotate-6">
            <Search className="h-8 w-8 text-foreground/30 -rotate-6" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">No videos found</h3>
          <p className="text-foreground/45 text-sm mb-6">Try a different search term.</p>
          <Button variant="outline" className="rounded-full px-8 font-semibold" onClick={() => setSearch("")}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isPlaying={playing === video.id}
              onPlay={() => setPlaying(playing === video.id ? null : video.id)}
            />
          ))}
        </div>
      )}

      {/* Channel CTA */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="mt-16 glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="h-16 w-16 mx-auto mb-5 rounded-2xl bg-red-500/15 flex items-center justify-center">
              <Youtube className="h-9 w-9 text-red-500" />
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">More videos on YouTube</h2>
            <p className="text-foreground/50 mb-8 max-w-md mx-auto">
              Subscribe to KC Class BHW for new lessons, grammar tips, and B.Ed preparation content every week.
            </p>
            <a href="https://www.youtube.com/@kcclassbhw/videos" target="_blank" rel="noopener noreferrer">
              <Button className="h-12 px-8 gap-2 bg-red-500 hover:bg-red-600 text-white border-0 rounded-full font-bold text-base shadow-lg shadow-red-500/25">
                <Youtube className="h-5 w-5" /> Visit the Channel
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video,
  isPlaying,
  onPlay,
}: {
  video: {
    id: string; title: string; description: string;
    publishedAt: string; thumbnailUrl: string; videoUrl: string;
    viewCount: number; likeCount: number;
  };
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
      {/* Thumbnail / Player */}
      <div className="aspect-video relative bg-black overflow-hidden">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Play button overlay */}
            <button
              onClick={onPlay}
              className="absolute inset-0 flex items-center justify-center group/play"
              aria-label="Play video"
            >
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl transition-all duration-200 group-hover/play:scale-110 group-hover/play:bg-red-500/80 group-hover/play:border-red-400/50">
                <PlayCircle className="h-7 w-7 text-white" />
              </div>
            </button>

            {/* Stats bottom */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {video.viewCount > 0 && (
                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                    <Eye className="h-2.5 w-2.5" /> {formatViews(video.viewCount)}
                  </span>
                )}
                {video.likeCount > 0 && (
                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                    <ThumbsUp className="h-2.5 w-2.5" /> {formatViews(video.likeCount)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col gap-3">
        <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-foreground/45 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.05] dark:border-white/[0.04]">
          <span className="text-[10px] font-semibold text-foreground/35">
            {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onPlay}
              className="h-7 px-3 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg border-0 flex items-center gap-1.5 transition-all"
            >
              <PlayCircle className="h-3 w-3" />
              {isPlaying ? "Playing" : "Watch"}
            </button>
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 glass-card rounded-lg flex items-center justify-center text-foreground/40 hover:text-red-500 transition-colors"
              title="Open on YouTube"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
