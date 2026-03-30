// ============================================================
// API Route: /api/auth
// ============================================================
// Handles authentication endpoints and auth callback.
//
// In Next.js:
//   /app/api/auth/route.ts         — sign in, sign up, sign out
//   /app/api/auth/callback/route.ts — OAuth callback + profile creation

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, DepthLevel } from "@/lib/types";

// ---------- Payloads & Responses ----------

export interface AuthPayload {
  email: string;
  password: string;
  fullName?: string; // for sign-up
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  status?: number;
}

// ---------- POST: Sign In ----------

export async function handleSignIn(
  payload: AuthPayload,
): Promise<AuthResponse> {
  if (!payload.email?.trim()) {
    return { success: false, error: "Email is required.", status: 400 };
  }
  if (!payload.password) {
    return { success: false, error: "Password is required.", status: 400 };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          status: 401,
        };
      }

      if (!data.user || !data.session) {
        return { success: false, error: "Authentication failed.", status: 401 };
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const user = profileToUser(data.user.id, data.user.email ?? "", profile);

      return {
        success: true,
        user,
        token: data.session.access_token,
      };
    } catch (err) {
      console.error("Sign in error:", err);
      return {
        success: false,
        error: "An unexpected error occurred during sign in.",
        status: 500,
      };
    }
  }

  // Mock path
  return {
    success: true,
    token: "mock-jwt-token",
    user: getMockUser(),
  };
}

// ---------- POST: Sign Up ----------

export async function handleSignUp(
  payload: AuthPayload,
): Promise<AuthResponse> {
  if (!payload.email?.trim()) {
    return { success: false, error: "Email is required.", status: 400 };
  }
  if (!payload.password) {
    return { success: false, error: "Password is required.", status: 400 };
  }
  if (payload.password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters.",
      status: 400,
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return {
      success: false,
      error: "Please provide a valid email address.",
      status: 400,
    };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName ?? "",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message, status: 400 };
      }

      if (!data.user) {
        return {
          success: false,
          error: "Failed to create account.",
          status: 500,
        };
      }

      // Profile is created via the auth callback / trigger
      // Return preliminary user
      return {
        success: true,
        user: {
          id: data.user.id,
          name: payload.fullName ?? "New Reader",
          email: payload.email,
          depthLevel: 0,
          createdAt: new Date().toISOString(),
          stats: {
            articlesRead: 0,
            marginNotes: 0,
            conversationsSparked: 0,
          },
          readingInterests: [],
        },
        token: data.session?.access_token,
      };
    } catch (err) {
      console.error("Sign up error:", err);
      return {
        success: false,
        error: "An unexpected error occurred during sign up.",
        status: 500,
      };
    }
  }

  // Mock path
  return {
    success: true,
    token: "mock-jwt-token",
    user: {
      ...getMockUser(),
      name: payload.fullName ?? "New Reader",
      email: payload.email,
      depthLevel: 0,
      stats: { articlesRead: 0, marginNotes: 0, conversationsSparked: 0 },
    },
  };
}

// ---------- POST: Sign Out ----------

export async function handleSignOut(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: true };
}

// ---------- Auth Callback ----------
// Handles the Supabase auth callback (e.g., after email verification or OAuth).
// Creates a profile record for new users.

export async function handleAuthCallback(): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { success: true, user: getMockUser() };
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return {
        success: false,
        error: "No active session found.",
        status: 401,
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email ?? "";
    const userMeta = session.user.user_metadata ?? {};

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingProfile) {
      // Create a new profile for the user
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        email: userEmail,
        full_name: (userMeta.full_name as string) ?? (userMeta.name as string) ?? "Anonymous Reader",
        avatar_url: (userMeta.avatar_url as string) ?? null,
        bio: null,
        institution: null,
        depth_level: 0,
        articles_read: 0,
        annotations_count: 0,
      });

      if (insertError) {
        console.error("Profile creation error:", insertError);
        // Non-fatal — auth still succeeded
      }
    }

    // Fetch the profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return {
      success: true,
      user: profileToUser(userId, userEmail, profile),
      token: session.access_token,
    };
  } catch (err) {
    console.error("Auth callback error:", err);
    return {
      success: false,
      error: "Failed to process authentication.",
      status: 500,
    };
  }
}

// ---------- Get Current User ----------

export async function handleGetCurrentUser(): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return { success: true, user: getMockUser() };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { success: false, error: "Not authenticated.", status: 401 };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    return {
      success: true,
      user: profileToUser(
        session.user.id,
        session.user.email ?? "",
        profile,
      ),
      token: session.access_token,
    };
  } catch (err) {
    console.error("Get current user error:", err);
    return { success: false, error: "Failed to fetch user.", status: 500 };
  }
}

// ---------- Helpers ----------

function profileToUser(
  id: string,
  email: string,
  profile: Record<string, unknown> | null,
): User {
  if (!profile) {
    return {
      id,
      email,
      name: "Anonymous Reader",
      depthLevel: 0,
      createdAt: new Date().toISOString(),
      stats: { articlesRead: 0, marginNotes: 0, conversationsSparked: 0 },
      readingInterests: [],
    };
  }

  return {
    id,
    email: (profile.email as string) ?? email,
    name: (profile.full_name as string) ?? "Anonymous Reader",
    avatarUrl: (profile.avatar_url as string) ?? undefined,
    bio: (profile.bio as string) ?? undefined,
    institution: (profile.institution as string) ?? undefined,
    depthLevel: ((profile.depth_level as number) ?? 0) as DepthLevel,
    createdAt: (profile.created_at as string) ?? new Date().toISOString(),
    stats: {
      articlesRead: (profile.articles_read as number) ?? 0,
      marginNotes: (profile.annotations_count as number) ?? 0,
      conversationsSparked: 0,
    },
    readingInterests: [],
  };
}

function getMockUser(): User {
  return {
    id: "user-1",
    name: "Rahul Verma",
    email: "rahul@example.com",
    bio: "Strategy @ McKinsey | Interested in network effects",
    depthLevel: 3,
    institution: "McKinsey",
    createdAt: "2024-09-15T00:00:00Z",
    stats: {
      articlesRead: 142,
      marginNotes: 47,
      conversationsSparked: 23,
    },
    readingInterests: ["Strategy", "Tech", "Psychology", "Economics"],
  };
}
