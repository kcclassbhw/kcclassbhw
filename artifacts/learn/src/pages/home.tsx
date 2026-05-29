import React from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { PlayCircle, FileText, ArrowRight, Star, GraduationCap, Youtube, Twitter, Instagram, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Shared animation variants ─────────────────────────────────────────── */

const ease = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = (delay = 0.1): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } },
};

const viewportOpts = { once: true, margin: "-60px" };

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center py-20 sm:py-24 overflow-hidden">
        {/* BG blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-emerald-500/20 blur-[120px] animate-drift" />
          <div className="absolute bottom-[-10%] right-[5%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-teal-400/15 blur-[120px] animate-drift" style={{ animationDelay: "-8s" }} />
          <div className="absolute top-[30%] right-[20%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-emerald-300/10 blur-[80px] animate-drift" style={{ animationDelay: "-4s" }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(52,211,153,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-8 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            B.Ed English — Now Enrolling
          </motion.div>

          {/* Headline */}
          <div className="overflow-hidden mb-6">
            <motion.h1
              className="font-display text-[clamp(2.6rem,8vw,7rem)] font-bold leading-[1.05] tracking-tight"
              initial="hidden"
              animate="show"
              variants={stagger(0.12)}
            >
              <motion.span
                variants={fadeUp}
                className="block text-foreground"
              >
                Learn English.
              </motion.span>
              <motion.span
                variants={fadeUp}
                className="block text-gradient"
              >
                Ace Your B.Ed.
              </motion.span>
            </motion.h1>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-foreground/60 dark:text-foreground/50 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            The complete online academy for B.Ed English students. Clear video lessons,
            grammar in depth, exam-focused notes — all from KC Class BHW.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14 sm:mb-16"
          >
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-13 px-7 sm:px-8 text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 rounded-full btn-glow transition-all hover:scale-105 active:scale-95">
                Start Learning Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-13 px-7 sm:px-8 text-base font-bold rounded-full glass-card border-white/[0.12] dark:border-white/[0.1] hover:bg-white/10 dark:hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95">
                <PlayCircle className="mr-2 h-4 w-4 text-emerald-500" /> Browse Courses
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger(0.12)}
            transition={{ delayChildren: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto"
          >
            {[
              { num: "12K+", label: "Students Enrolled" },
              { num: "4", label: "Comprehensive Courses" },
              { num: "Free", label: "To Start Learning" },
            ].map(({ num, label }) => (
              <motion.div
                key={label}
                variants={cardVariant}
                className="glass-card rounded-2xl px-6 py-5 text-center"
              >
                <div className="text-3xl font-display font-bold text-gradient mb-1">{num}</div>
                <div className="text-xs font-semibold text-foreground/50 uppercase tracking-widest">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent to-emerald-500" />
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">

          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.1)}
            className="text-center mb-14 md:mb-20"
          >
            <motion.p variants={fadeUp} className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-4">
              What you get
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Everything you need to{" "}
              <span className="text-gradient">excel</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-foreground/55 max-w-xl mx-auto text-base sm:text-lg">
              Structured lessons built around the B.Ed English curriculum.
            </motion.p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.12)}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            <motion.div variants={cardVariant}>
              <FeatureCard
                icon={<PlayCircle className="h-6 w-6 text-emerald-400" />}
                iconBg="bg-emerald-500/10 dark:bg-emerald-500/15"
                title="Clear Video Lessons"
                description="Concept-by-concept video explanations covering literature, grammar, pedagogy, and language skills for B.Ed."
                accent="from-emerald-500/20 to-teal-500/10"
              />
            </motion.div>
            <motion.div variants={cardVariant}>
              <FeatureCard
                icon={<FileText className="h-6 w-6 text-amber-400" />}
                iconBg="bg-amber-500/10 dark:bg-amber-500/15"
                title="Notes & PDF Downloads"
                description="Ready-to-print notes, grammar charts, question banks, and model answers for every topic."
                accent="from-amber-500/20 to-orange-500/10"
              />
            </motion.div>
            <motion.div variants={cardVariant}>
              <FeatureCard
                icon={<GraduationCap className="h-6 w-6 text-sky-400" />}
                iconBg="bg-sky-500/10 dark:bg-sky-500/15"
                title="Exam-Focused Approach"
                description="Every lesson maps to exam requirements. Practice questions, previous year patterns, and scoring tips."
                accent="from-sky-500/20 to-blue-500/10"
              />
            </motion.div>
          </motion.div>

          {/* Mini feature pills */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.1)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5"
          >
            {[
              { icon: <Zap className="h-4 w-4 text-amber-400" />, text: "Learn at your own pace" },
              { icon: <Shield className="h-4 w-4 text-emerald-400" />, text: "7-day money-back guarantee" },
              { icon: <Clock className="h-4 w-4 text-sky-400" />, text: "Lifetime access to downloads" },
            ].map(({ icon, text }) => (
              <motion.div key={text} variants={cardVariant} className="glass-card rounded-xl px-5 py-4 flex items-center gap-3">
                <div className="shrink-0">{icon}</div>
                <span className="text-sm font-semibold text-foreground/70">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TOPICS ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.1)}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-4">Curriculum</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">Topics covered</motion.h2>
            <motion.p variants={fadeUp} className="text-foreground/55 text-base sm:text-lg max-w-xl mx-auto">A complete curriculum across all key areas of B.Ed English.</motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.05)}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {[
              "English Grammar", "Parts of Speech", "Tenses & Voice",
              "Transformation", "Reading Skills", "Writing Skills",
              "Language Pedagogy", "Literature in English",
              "Phonetics & Phonology", "Communication Skills",
              "Previous Year Q&A", "Model Answer Papers",
            ].map((topic) => (
              <motion.div
                key={topic}
                variants={cardVariant}
                className="glass-card glass-card-hover rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 cursor-default group"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-150 transition-transform" />
                <span className="text-xs sm:text-sm font-semibold text-foreground/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">{topic}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.1)}
            className="text-center mb-12 sm:mb-14"
          >
            <motion.p variants={fadeUp} className="text-sm font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-4">Student Reviews</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">What our students say</motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOpts}
            variants={stagger(0.14)}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {[
              { quote: "KC Class BHW made English grammar finally make sense. The video explanations are so clear — I wish I found this channel sooner.", name: "Priya Sharma", role: "B.Ed 2nd Year", color: "text-emerald-500" },
              { quote: "The PDF notes saved me hours of writing. I downloaded them, revised the key topics, and scored well in my unit test. Thank you!", name: "Rahul Verma", role: "B.Ed 1st Year", color: "text-amber-400" },
              { quote: "The grammar series is outstanding. Tenses, parts of speech, transformation — everything explained step by step. Absolutely worth it.", name: "Anjali Mishra", role: "B.Ed Student", color: "text-sky-400" },
            ].map((t) => (
              <motion.div key={t.name} variants={cardVariant}>
                <TestimonialCard {...t} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewportOpts}
        variants={fadeIn}
        className="py-20 md:py-28 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-teal-600/80 to-emerald-800/90" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[200%] rounded-full bg-white/10 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOpts}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10 text-center"
        >
          <p className="text-emerald-100/80 text-sm font-bold uppercase tracking-widest mb-4">Limited Time</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
            Start your B.Ed English
            <br className="hidden sm:block" />
            preparation today
          </h2>
          <p className="text-emerald-50/80 text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of students learning from KC Class BHW. Instant access to all courses, notes, and resources.
          </p>
          <Link href="/pricing">
            <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold text-emerald-800 bg-white hover:bg-emerald-50 rounded-full group shadow-2xl shadow-black/30 transition-all hover:scale-105 active:scale-95">
              View Plans <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-10 sm:py-12 border-t border-black/[0.06] dark:border-white/[0.06]">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 mb-8 sm:mb-10">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="KC Class BHW" className="h-11 w-11 object-contain drop-shadow-sm" />
              <span className="font-display font-bold text-xl">KC Class BHW</span>
            </div>
            <div className="flex gap-3">
              <a href="https://www.youtube.com/@kcclassbhw" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full glass-card flex items-center justify-center text-foreground/50 hover:text-red-500 transition-colors" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://twitter.com/kcclassbhw" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full glass-card flex items-center justify-center text-foreground/50 hover:text-sky-400 transition-colors" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/kcclassbhw" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full glass-card flex items-center justify-center text-foreground/50 hover:text-pink-500 transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-6 sm:mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground/40 font-medium">
            <div>&copy; {new Date().getFullYear()} KC Class BHW. All rights reserved.</div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href="mailto:kcclassbhw@gmail.com" className="hover:text-foreground transition-colors">Contact</a>
              <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="/courses" className="hover:text-foreground transition-colors">Courses</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function FeatureCard({ icon, iconBg, title, description, accent }: {
  icon: React.ReactNode; iconBg: string; title: string; description: string; accent: string;
}) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col gap-5 relative overflow-hidden group h-full">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className={`relative h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="relative">
        <h3 className="text-base sm:text-lg font-bold mb-2">{title}</h3>
        <p className="text-foreground/55 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role, color }: {
  quote: string; name: string; role: string; color: string;
}) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col gap-5 h-full">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
      </div>
      <p className="text-foreground/75 text-sm leading-relaxed flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06] dark:border-white/[0.05]">
        <div className={`h-9 w-9 rounded-full glass-card flex items-center justify-center font-bold text-sm ${color} shrink-0`}>
          {name.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-bold">{name}</div>
          <div className={`text-xs font-semibold ${color}`}>{role}</div>
        </div>
      </div>
    </div>
  );
}
