/**
 * Unified Auth Context — supports Supabase Auth + native JWT fallback.
 *
 * Provides:
 *   useAuth()        → { user, isLoaded, isSignedIn, isSupabaseEnabled, signOut, refreshUser, signInWithEmail, signUpWithEmail, signInWithGoogle }
 *   AuthProvider     → wraps the app, synchronizes Supabase sessions with PostgreSQL backend
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured, signInWithOAuth } from "./supabase";

const API = import.meta.env.VITE_API_URL || "";

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isSupabaseEnabled: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  isSupabaseEnabled: false,
  signOut: async () => {},
  refreshUser: async () => {},
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => {},
});

function buildUser(raw: any): AuthUser {
  const name: string | null = raw.name ?? null;
  const parts = name?.trim().split(/\s+/) ?? [];
  const firstName = parts[0] ?? null;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return {
    id: raw.clerkId ?? raw.id ?? "",
    clerkId: raw.clerkId ?? raw.id ?? "",
    email: raw.email ?? "",
    name,
    role: raw.role ?? "user",
    avatarUrl: raw.avatarUrl ?? null,
    bio: raw.bio ?? null,
    firstName,
    lastName,
    fullName: name,
    imageUrl: raw.avatarUrl ?? null,
    primaryEmailAddress: raw.email ? { emailAddress: raw.email } : null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isSupabaseEnabled = isSupabaseConfigured();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(buildUser(data));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const syncSupabaseWithBackend = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${API}/api/auth/supabase-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessToken }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(buildUser(data.user));
          return true;
        }
      }
    } catch (err) {
      console.error("Failed to sync Supabase session:", err);
    }
    return false;
  }, []);

  useEffect(() => {
    // Initial backend session check
    fetchMe();

    // If Supabase is configured, listen to auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token) {
          await syncSupabaseWithBackend(session.access_token);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
    return undefined;
  }, [fetchMe, syncSupabaseWithBackend]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Try Supabase Auth first if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.session?.access_token) {
          await syncSupabaseWithBackend(data.session.access_token);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to sign in" };
      }
    }

    // 2. Native Auth fallback
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Invalid email or password" };
      }
      setUser(buildUser(data.user));
      return { success: true };
    } catch {
      return { success: false, error: "Network error — please try again" };
    }
  }, [syncSupabaseWithBackend]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Try Supabase Auth first if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name?.trim() || email.split("@")[0],
              full_name: name?.trim() || email.split("@")[0],
            },
          },
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.session?.access_token) {
          await syncSupabaseWithBackend(data.session.access_token);
          return { success: true };
        }
        // If email confirmation is required by Supabase settings:
        if (data.user && !data.session) {
          return {
            success: true,
            error: "Registration successful! Please check your email to confirm your account.",
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || "Registration failed" };
      }
    }

    // 2. Native Auth fallback
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password, name: name?.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      setUser(buildUser(data.user));
      return { success: true };
    } catch {
      return { success: false, error: "Network error — please try again" };
    }
  }, [syncSupabaseWithBackend]);

  const signInWithGoogle = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await signInWithOAuth("google");
    } else {
      alert("Google Sign-In requires Supabase credentials to be configured in .env");
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: !!user,
        isSupabaseEnabled,
        signOut,
        refreshUser: fetchMe,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
