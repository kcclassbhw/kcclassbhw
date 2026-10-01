import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center mb-6">
        <GraduationCap className="h-8 w-8 text-emerald-500" />
      </div>
      <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3">404 Error</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">Page not found</h1>
      <p className="text-foreground/50 text-lg max-w-md mb-10">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="gap-2 rounded-full px-7 font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 btn-glow">
            <ArrowLeft className="h-4 w-4" /> Go Home
          </Button>
        </Link>
        <Link href="/courses">
          <Button variant="outline" className="gap-2 rounded-full px-7 font-semibold glass-card border-white/[0.12]">
            Browse Courses
          </Button>
        </Link>
      </div>
    </div>
  );
}
