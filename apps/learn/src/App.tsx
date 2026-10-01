import React, { Component, Suspense, useEffect, useRef, useState } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./lib/auth-context";

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
import Layout from "./components/layout";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
const ForgotPasswordPage = React.lazy(() => import("./pages/forgot-password"));
const ResetPasswordPage = React.lazy(() => import("./pages/reset-password"));

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Loading…</span></div>;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <HomePage />;
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Loading…</span></div>;
  if (!isSignedIn) return <Redirect to="/" />;

  if (adminOnly) {
    if (user?.role !== 'admin') return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground text-sm">Loading…</span></div>}>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/forgot-password" component={ForgotPasswordPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />

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
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
