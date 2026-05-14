import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import HomePage from "./pages/home";
import DashboardPage from "./pages/dashboard";
import CoursesPage from "./pages/courses";
import CourseDetailPage from "./pages/course-detail";
import LessonPage from "./pages/lesson";
import ResourcesPage from "./pages/resources";
import PricingPage from "./pages/pricing";
import SettingsPage from "./pages/settings";
import AdminDashboard from "./pages/admin";
import AdminCourses from "./pages/admin-courses";
import AdminLessons from "./pages/admin-lessons";
import VideosPage from "./pages/videos";
import PaymentVerifyPage from "./pages/payment-verify";
import NotFound from "./pages/not-found";
import { useGetMe } from "@workspace/api-client-react";
import Layout from "./components/layout";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// Only use the Clerk proxy when running locally — on Replit/production the
// browser cannot reach localhost:8080, so we let Clerk load from its own CDN.
const clerkProxyUrl = (() => {
  const proxy = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
  if (!proxy) return undefined;
  const isLocalBrowser = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isLocalBrowser && proxy.includes("localhost")) return undefined;
  return proxy;
})();
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
          <li>Get your Clerk key at <a href="https://dashboard.clerk.com" target="_blank">dashboard.clerk.com</a> &rarr; API Keys</li>
          <li>Replace <code>pk_test_REPLACE_ME</code> with your actual key</li>
          <li>Save and restart the dev server (<code>Ctrl+C</code> then <code>pnpm --filter @workspace/learn run dev</code>)</li>
        </ol>
        <p style="margin-top:1rem;color:#6b7280">See <strong>SETUP.md</strong> in the project root for the full walkthrough.</p>
      </div>`;
  }
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — see the setup screen in your browser');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
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
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-zinc-950 dark:text-zinc-50",
    headerSubtitle: "text-sm text-zinc-500 dark:text-zinc-400",
    socialButtonsBlockButtonText: "text-sm font-medium text-zinc-950 dark:text-zinc-50",
    formFieldLabel: "text-sm font-medium text-zinc-950 dark:text-zinc-50",
    footerActionLink: "text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
    footerActionText: "text-sm text-zinc-500 dark:text-zinc-400",
    dividerText: "text-xs text-zinc-500 dark:text-zinc-400",
    identityPreviewEditButton: "text-indigo-600 dark:text-indigo-400",
    formFieldSuccessText: "text-sm text-green-600 dark:text-green-400",
    alertText: "text-sm text-red-600 dark:text-red-400",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-8 object-contain",
    socialButtonsBlockButton: "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-950 dark:text-zinc-50",
    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    formFieldInput: "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
    footerAction: "flex items-center justify-center gap-2",
    dividerLine: "bg-zinc-200 dark:bg-zinc-800",
    alert: "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900",
    otpCodeFieldInput: "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
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
  const { data: me, isLoading: isMeLoading } = useGetMe({ query: { enabled: isLoaded && !!isSignedIn && adminOnly, queryKey: ['getMe'] } });

  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Loading…</span></div>;
  if (!isSignedIn) return <Redirect to="/" />;

  if (adminOnly) {
    if (isMeLoading) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Loading…</span></div>;
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
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Layout>
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
              
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
