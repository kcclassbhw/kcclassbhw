import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, FolderOpen, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Course Manager", icon: BookOpen, exact: false },
  { href: "/admin/resources", label: "Resource Vault", icon: FolderOpen, exact: false },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, exact: false },
];

export default function AdminLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      <div className="w-64 border-r bg-zinc-50/50 dark:bg-zinc-950/50 p-4 flex flex-col gap-1 shrink-0">
        <div className="font-semibold px-2 mb-4 text-xs text-muted-foreground uppercase tracking-wider">Admin Panel</div>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? location === href : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                active
                  ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 font-medium"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full min-w-0">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}
