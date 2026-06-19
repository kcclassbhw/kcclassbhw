import React, { Component, Suspense, useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const HomePage = React.lazy(() => import("./pages/home"));
const DashboardPage = React.lazy(() => import("./pages/dashboard"));
const CoursesPage = React.lazy(() => import("./pages/courses"));
const CourseDetailPage = React.lazy(() => import("./pages/course-detail"));
const LessonPage = React.lazy(() => import("./pages/lesson"));
const ResourcesPage = React.lazy(() => import("./pages/resources"));
const PricingPage = React.lazy(() => import("./pages/pricing"));
const SettingsPage = React.lazy(() => import("./pages/settings"));
const AdminDashboard = React.lazy(() => import("./pages/admin"));
const AdminCourses = React.lazy(() => import("./pages/admin-courses"));
const AdminLessons = React.lazy(() => import("./pages/admin-lessons"));
const AdminResources = React.lazy(() => import("./pages/admin-resources"));
const AdminAnnouncements = React.lazy(() => import("./pages/admin-announcements"));
const VideosPage = React.lazy(() => import("./pages/videos"));
const PaymentVerifyPage = React.lazy(() => import("./pages/payment-verify"));
const NotFound = React.lazy(() => import("./pages/not-found"));
import { useGetMe } from "@workspace/api-client-react";
import Layout from "./components/layout";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// Only use the Clerk proxy URL in a production build (import.meta.env.PROD).
// In Vite's dev server (import.meta.env.PROD = false), the proxy URL points to
// the Replit dev domain which does NOT support the `clerk.` subdomain that Clerk
// prepends to construct the script URL — causing Clerk JS to fail to load entirely.
// In production, Vite bakes in the correct production proxy URL at build time.
const clerkProxyUrl: string | undefined = import.meta.env.PROD
  ? (import.meta.env.VITE_CLERK_PROXY_URL as string | undefined)
  : undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}


if (!clerkPubKey) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family:monospace;padding:2rem;max-width:640px;margin:4rem auto;line-height:1.7;color:#111">
        <h2 style="color:#dc2626;margin-bottom:1rem">&#9888; Missing environment variable</h2>
        <p><strong>VITE_CLERK_PUBLISHABLE_KEY</strong> is not set.</p>
        <p style="margin-top:1rem">To fix this on Windows:</p>
        <ol style="padding-left:1.5rem">
          <li>In File Explorer, copy <code>artifacts\\learn\\.env.example</code> and rename the copy to <code>.env</code></li>
          <li>Open the <code>.env</code> file in Notepad or VSCode</li>
          <li>Get your Clerk key at <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer">dashboard.clerk.com</a> &rarr; API Keys</li>
          <li>Replace <code>pk_test_REPLACE_ME</code> with your actual key</li>
          <li>Save and restart the dev server (<code>Ctrl+C</code> then <code>pnpm --filter @workspace/learn run dev</code>)</li>
        </ol>
        <p style="margin-top:1rem;color:#6b7280">See <strong>DOCS.md</strong> in the project root for the full walkthrough.</p>
      </div>`;
  }
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — see the setup screen in your browser');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "none" as const,
  },
  variables: {
    colorPrimary: "hsl(158 64% 35%)",
    colorForeground: "hsl(240 10% 3.9%)",
    colorMutedForeground: "hsl(240 3.8% 46.1%)",
    colorDanger: "hsl(0 84.2% 60.2%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(240 5.9% 90%)",
    colorInputForeground: "hsl(240 10% 3.9%)",
    colorNeutral: "hsl(240 5.9% 90%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white dark:bg-zinc-950 rounded-2xl w-[440px] max-w-full overflow-hidden border border-zinc-200 dark:border-zinc-800",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    header: "hidden",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footerPages: { style: { display: "none" } },
    headerTitle: "text-2xl font-bold text-zinc-950 dark:text-zinc-50",
    headerSubtitle: "text-sm text-zinc-500 dark:text-zinc-400",
    socialButtonsBlockButtonText: "text-sm font-medium text-zinc-950 dark:text-zinc-50",
    formFieldLabel: "text-sm font-medium text-zinc-950 dark:text-zinc-50",
    footerActionLink: "text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300",
    footerActionText: "text-sm text-zinc-500 dark:text-zinc-400",
    dividerText: "text-xs text-zinc-500 dark:text-zinc-400",
    identityPreviewEditButton: "text-emerald-600 dark:text-emerald-400",
    formFieldSuccessText: "text-sm text-green-600 dark:text-green-400",
    alertText: "text-sm text-red-600 dark:text-red-400",
    logoBox: "hidden",
    logoImage: "hidden",
    socialButtonsBlockButton: "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-950 dark:text-zinc-50",
    formButtonPrimary: "!bg-gradient-to-r !from-emerald-500 !to-teal-500 hover:!from-emerald-400 hover:!to-teal-400 !text-white !border-0 !shadow-none",
    formFieldInput: "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
    footerAction: "flex items-center justify-center gap-2",
    dividerLine: "bg-zinc-200 dark:bg-zinc-800",
    alert: "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900",
    otpCodeFieldInput: "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function useHideClerkBranding() {
  useEffect(() => {
    const remove = () => {
      // Find text nodes containing ONLY Clerk branding (not the sign-in/sign-up navigation links)
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = (node.textContent || "").trim();
        if (text === "Secured by" || text === "Development mode") {
          // Walk UP to the nearest block/flex ancestor that is a self-contained badge
          // but stop before we reach a container that also holds auth navigation links
          let target: HTMLElement | null = node.parentElement;
          while (target && target !== document.body) {
            // If this container also has a sign-in or sign-up link, stop — don't hide it
            if (target.querySelector('a[href*="sign-in"], a[href*="sign-up"], a[href*="signin"], a[href*="signup"]')) break;
            const d = getComputedStyle(target).display;
            if (d === "block" || d === "flex" || d === "grid") {
              target.style.setProperty("display", "none", "important");
              break;
            }
            target = target.parentElement;
          }
        }
      }
    };
    remove();
    const observer = new MutationObserver(remove);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

function AuthBrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  useHideClerkBranding();
  return (
    <div className="flex flex-col items-center gap-3 pb-2">
      <a href={basePath || "/"} className="flex items-center gap-2.5 group">
        <img
          src={`${basePath}/logo.png`}
          alt="KC Class BHW"
          className="h-11 w-11 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
        />
        <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">KC Class BHW</span>
      </a>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-[440px] max-w-full flex flex-col gap-4">
        <AuthBrandHeader title="Welcome back" subtitle="Sign in to access your account" />
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-[440px] max-w-full flex flex-col gap-4">
        <AuthBrandHeader title="Create your account" subtitle="Join KC Class BHW today" />
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return <HomePage />;
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: me, isLoading: isMeLoading, isError: isMeError } = useGetMe({ query: { enabled: isLoaded && !!isSignedIn && adminOnly, queryKey: ['getMe'] } });

  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Loading…</span></div>;
  if (!isSignedIn) return <Redirect to="/" />;

  if (adminOnly) {
    if (isMeLoading) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Loading…</span></div>;
    if (isMeError) return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-3 text-center px-4">
        <span className="text-lg font-semibold text-destructive">Could not verify admin access</span>
        <span className="text-sm text-muted-foreground">The server did not respond. Make sure you are signed in and try refreshing the page.</span>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Refresh</button>
      </div>
    );
    if (me?.role !== 'admin') return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Layout>
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground text-sm">Loading…</span></div>}>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              
              <Route path="/courses" component={CoursesPage} />
              <Route path="/courses/:id" component={CourseDetailPage} />
              <Route path="/videos" component={VideosPage} />
              
              <Route path="/pricing" component={PricingPage} />
              <Route path="/payment/verify" component={PaymentVerifyPage} />
              
              <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
              <Route path="/courses/:courseId/lessons/:id"><ProtectedRoute component={LessonPage} /></Route>
              <Route path="/resources"><ProtectedRoute component={ResourcesPage} /></Route>
              <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>
              
              <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly={true} /></Route>
              <Route path="/admin/courses"><ProtectedRoute component={AdminCourses} adminOnly={true} /></Route>
              <Route path="/admin/courses/:id/lessons"><ProtectedRoute component={AdminLessons} adminOnly={true} /></Route>
              <Route path="/admin/resources"><ProtectedRoute component={AdminResources} adminOnly={true} /></Route>
              <Route path="/admin/announcements"><ProtectedRoute component={AdminAnnouncements} adminOnly={true} /></Route>
              
              <Route component={NotFound} />
            </Switch>
            </Suspense>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App crash:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-background text-foreground">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md text-sm">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="px-5 py-2 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <ErrorBoundary>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
