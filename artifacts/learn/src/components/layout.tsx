import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { LayoutDashboard, LogOut, Settings, ShieldCheck, Sun, Moon, Library, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMe } from "@workspace/api-client-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isAuthPage = location.startsWith("/sign-in") || location.startsWith("/sign-up");

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative">
      {/* Global gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[15%] w-[70%] h-[70%] rounded-full bg-emerald-500/[0.12] dark:bg-emerald-500/[0.09] blur-[130px] animate-drift" />
        <div className="absolute -bottom-[30%] -right-[15%] w-[65%] h-[65%] rounded-full bg-teal-400/[0.09] dark:bg-teal-400/[0.07] blur-[130px] animate-drift" style={{ animationDelay: "-7s" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-emerald-600/[0.04] dark:bg-emerald-600/[0.03] blur-[100px] animate-drift" style={{ animationDelay: "-3s" }} />
      </div>

      <Navbar />
      <div className="flex flex-1">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: me } = useGetMe({ query: { enabled: !!isSignedIn, queryKey: ["getMe"] } });
  const isAdmin = me?.role === "admin";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (path: string) => location === path;

  const navLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/videos", label: "Videos" },
    { href: "/pricing", label: "Pricing" },
  ];

  const cubicEase = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];
  const mobileMenuVariants: Variants = {
    hidden: { opacity: 0, y: -8, scaleY: 0.96, transformOrigin: "top" },
    show: {
      opacity: 1,
      y: 0,
      scaleY: 1,
      transition: { duration: 0.22, ease: cubicEase },
    },
    exit: {
      opacity: 0,
      y: -6,
      scaleY: 0.97,
      transition: { duration: 0.18, ease: "easeIn" },
    },
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.2 },
    }),
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.06] shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex h-[64px] sm:h-[68px] items-center justify-between px-4 md:px-6 max-w-7xl">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="KC Class BHW"
              className="h-10 w-10 object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
            />
            <span className="font-display font-bold tracking-tight text-base sm:text-lg hidden sm:inline">KC Class BHW</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isActive(href)
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : "text-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/[0.06]"
                }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </Link>
            ))}
            <Show when="signed-in">
              <Link
                href="/resources"
                className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isActive("/resources")
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : "text-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/[0.06]"
                }`}
              >
                Resources
              </Link>
            </Show>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full h-9 w-9 hover:bg-white/50 dark:hover:bg-white/[0.08] transition-all"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </Button>

            <Show when="signed-in">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-transparent hover:ring-emerald-500/30 transition-all">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-2xl glass-card border-white/[0.08] dark:border-white/[0.08] shadow-xl shadow-black/20"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold leading-none">{user?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex cursor-pointer items-center gap-2 rounded-xl mx-1 font-medium">
                      <LayoutDashboard className="h-4 w-4 text-emerald-500" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex cursor-pointer items-center gap-2 rounded-xl mx-1 font-medium">
                      <Settings className="h-4 w-4 text-emerald-500" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex cursor-pointer items-center gap-2 rounded-xl mx-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive font-medium gap-2 rounded-xl mx-1 mb-1"
                    onClick={() => signOut({ redirectUrl: "/" })}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>

            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-sm font-semibold rounded-full px-4 text-foreground/70 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/[0.07]">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="text-sm font-bold rounded-full px-5 h-9 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 btn-glow transition-all hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </Show>
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full h-9 w-9"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="md:hidden border-t border-white/[0.06] bg-white/90 dark:bg-black/70 backdrop-blur-2xl overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1 max-w-7xl">
                {navLinks.map(({ href, label }, i) => (
                  <motion.div key={href} custom={i} variants={mobileItemVariants} initial="hidden" animate="show">
                    <Link
                      href={href}
                      className={`block px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                        isActive(href)
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}

                <Show when="signed-in">
                  {[
                    { href: "/resources", label: "Resources", icon: <Library className="h-4 w-4 text-emerald-500" /> },
                    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 text-emerald-500" /> },
                    { href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4 text-emerald-500" /> },
                  ].map(({ href, label, icon }, i) => (
                    <motion.div key={href} custom={navLinks.length + i} variants={mobileItemVariants} initial="hidden" animate="show">
                      <Link href={href} className="px-4 py-3 text-sm font-semibold rounded-xl text-foreground/70 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2">
                        {icon} {label}
                      </Link>
                    </motion.div>
                  ))}
                  {isAdmin && (
                    <motion.div custom={navLinks.length + 3} variants={mobileItemVariants} initial="hidden" animate="show">
                      <Link href="/admin" className="px-4 py-3 text-sm font-bold rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    </motion.div>
                  )}
                  <motion.div custom={navLinks.length + 4} variants={mobileItemVariants} initial="hidden" animate="show">
                    <button
                      className="w-full px-4 py-3 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left flex items-center gap-2"
                      onClick={() => signOut({ redirectUrl: "/" })}
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </motion.div>
                </Show>

                <Show when="signed-out">
                  <motion.div custom={navLinks.length} variants={mobileItemVariants} initial="hidden" animate="show">
                    <div className="flex gap-2 pt-2">
                      <Link href="/sign-in" className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl font-semibold border-white/[0.12] dark:border-white/[0.1]">Sign In</Button>
                      </Link>
                      <Link href="/sign-up" className="flex-1">
                        <Button className="w-full rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 btn-glow">Get Started</Button>
                      </Link>
                    </div>
                  </motion.div>
                </Show>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
