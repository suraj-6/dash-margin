// ============================================================
// API Middleware — Auth & Permission Checking
// ============================================================
// Provides reusable middleware functions for protected routes.
// In production, these would be Next.js middleware or route wrappers.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DepthLevel, User } from "@/lib/types";

// ---------- Types ----------

export interface AuthenticatedUser {
  id: string;
  email: string;
  depthLevel: DepthLevel;
  profile: User | null;
}

export interface MiddlewareResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number; // HTTP status code
}

// ---------- Check Authentication ----------
// Verifies the user has a valid Supabase session.
// Returns the user's profile if found.

export async function requireAuth(): Promise<MiddlewareResult> {
  if (!isSupabaseConfigured()) {
    // Demo mode — return mock authenticated user
    return {
      authorized: true,
      user: {
        id: "user-1",
        email: "rahul@example.com",
        depthLevel: 3,
        profile: null,
      },
    };
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return {
        authorized: false,
        error: "Authentication required. Please sign in.",
        status: 401,
      };
    }

    // Fetch user profile to get depth level
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      return {
        authorized: false,
        error: "User profile not found. Please complete onboarding.",
        status: 401,
      };
    }

    return {
      authorized: true,
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        depthLevel: (profile.depth_level ?? 0) as DepthLevel,
        profile: {
          id: profile.id,
          name: profile.full_name ?? "Anonymous",
          email: profile.email ?? "",
          avatarUrl: profile.avatar_url ?? undefined,
          bio: profile.bio ?? undefined,
          depthLevel: (profile.depth_level ?? 0) as DepthLevel,
          institution: profile.institution ?? undefined,
          createdAt: profile.created_at,
          stats: {
            articlesRead: profile.articles_read ?? 0,
            marginNotes: profile.annotations_count ?? 0,
            conversationsSparked: 0,
          },
          readingInterests: [],
        },
      },
    };
  } catch (err) {
    console.error("Auth middleware error:", err);
    return {
      authorized: false,
      error: "Internal authentication error.",
      status: 500,
    };
  }
}

// ---------- Check Depth Level ----------
// Ensures the authenticated user has at least the required depth level.

export async function requireDepthLevel(
  minLevel: DepthLevel,
): Promise<MiddlewareResult> {
  const authResult = await requireAuth();

  if (!authResult.authorized || !authResult.user) {
    return authResult;
  }

  if (authResult.user.depthLevel < minLevel) {
    const levelNames: Record<DepthLevel, string> = {
      0: "Reader",
      1: "Highlighter",
      2: "Annotator",
      3: "Voice",
      4: "Contributor",
    };
    return {
      authorized: false,
      user: authResult.user,
      error: `This action requires Level ${minLevel}: ${levelNames[minLevel]}. You are currently Level ${authResult.user.depthLevel}: ${levelNames[authResult.user.depthLevel]}.`,
      status: 403,
    };
  }

  return authResult;
}

// ---------- Rate Limiting (simple in-memory) ----------
// In production, use Redis or a rate-limiting service.

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number; error?: string } {
  const now = Date.now();
  const key = userId;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      error: `Rate limit exceeded. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds.`,
    };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
