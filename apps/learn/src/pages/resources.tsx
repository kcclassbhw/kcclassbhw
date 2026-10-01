import React, { useState } from "react";
import { useListResources } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X, FileText, FileArchive, Download, FileCode, FileImage } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ResourcesPage() {
  useSEO({
    title: "Study Resources & PDF Notes",
    description: "Download PDF notes, grammar charts, question banks, and model answer papers for B.Ed English — exclusively for subscribers.",
    noIndex: true,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: resources, isLoading } = useListResources({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
  });

  const categories = ["all", "Grammar", "Literature", "Pedagogy", "Phonetics", "Writing Skills", "Question Banks"];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return { icon: <FileText className="h-6 w-6" />, color: "text-red-400", bg: "bg-red-500/10", ext: "PDF" };
    if (fileType.includes("zip") || fileType.includes("rar")) return { icon: <FileArchive className="h-6 w-6" />, color: "text-amber-400", bg: "bg-amber-500/10", ext: "ZIP" };
    if (fileType.includes("json") || fileType.includes("javascript")) return { icon: <FileCode className="h-6 w-6" />, color: "text-blue-400", bg: "bg-blue-500/10", ext: "CODE" };
    if (fileType.includes("image")) return { icon: <FileImage className="h-6 w-6" />, color: "text-emerald-400", bg: "bg-emerald-500/10", ext: "IMG" };
    return { icon: <FileText className="h-6 w-6" />, color: "text-foreground/40", bg: "bg-foreground/[0.05]", ext: "FILE" };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/resources/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.signedUrl) {
        window.open(data.signedUrl, "_blank");
        toast.success("Download started");
      } else {
        toast.error("Download link not available");
      }
    } catch {
      toast.error("Failed to start download");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-6xl">
      {/* Header */}
      <div className="mb-10 md:mb-14">
        <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3">Subscribers Only</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Resource Vault</h1>
        <p className="text-foreground/55 text-lg max-w-xl">PDF notes, grammar charts, question banks — exclusive for subscribers.</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input
            placeholder="Search resources..."
            className="pl-10 h-11 rounded-xl bg-white/50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.07] focus-visible:ring-emerald-500 font-medium placeholder:text-foreground/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground" onClick={() => setSearch("")}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="sm:w-52 shrink-0">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl bg-white/50 dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.07] focus:ring-emerald-500 font-medium">
              <Filter className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl glass-card border-white/[0.08]">
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="rounded-lg font-medium">
                  {c === "all" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource) => {
            const { icon, color, bg, ext } = getFileIcon(resource.fileType);
            return (
              <div key={resource.id} className="glass-card glass-card-hover rounded-2xl overflow-hidden flex group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/[0.06]">
                {/* File type icon */}
                <div className={`w-20 shrink-0 flex flex-col items-center justify-center gap-2 border-r border-white/[0.05] dark:border-white/[0.04] ${bg}`}>
                  <div className={color}>{icon}</div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{ext}</span>
                </div>

                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {resource.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-semibold shrink-0 border-white/[0.1] dark:border-white/[0.08]">
                        {resource.category}
                      </Badge>
                    </div>
                    {resource.description && (
                      <p className="text-xs text-foreground/45 line-clamp-2 leading-relaxed">{resource.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05] dark:border-white/[0.04]">
                    <div className="text-[10px] font-semibold text-foreground/35 flex gap-3">
                      <span>{formatFileSize(resource.fileSize)}</span>
                      <span>{resource.downloadCount} downloads</span>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 px-3 gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-lg"
                      onClick={() => handleDownload(resource.id)}
                      disabled={downloadingId === resource.id}
                      data-testid={`button-download-${resource.id}`}
                    >
                      <Download className="h-3 w-3" />
                      {downloadingId === resource.id ? "..." : "Download"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl py-20 text-center">
          <div className="h-16 w-16 rounded-2xl glass-card flex items-center justify-center mb-5 mx-auto rotate-6">
            <FileArchive className="h-8 w-8 text-foreground/30 -rotate-6" />
          </div>
          <h3 className="font-display font-bold text-2xl mb-3">No resources found</h3>
          <p className="text-foreground/50 mb-7 max-w-sm mx-auto text-sm">Try adjusting your filters.</p>
          <Button className="rounded-full px-8 font-semibold" variant="outline" onClick={() => { setSearch(""); setCategory("all"); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
