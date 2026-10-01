import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
// Prefer SERVICE_ROLE_KEY for server operations, or fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const isSupabaseServerConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith("http") &&
    supabaseKey.length > 20
  );
};

export const supabaseServer: SupabaseClient | null = isSupabaseServerConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Validates a Supabase JWT access token by calling the Supabase Auth API
 */
export async function verifySupabaseToken(accessToken: string) {
  if (!supabaseServer) return null;
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(accessToken);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}
