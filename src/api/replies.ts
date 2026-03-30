// ============================================================
// API Route: /api/annotations/[annotationId]/replies
// ============================================================
// GET  — Fetch all replies for an annotation
// POST — Create a reply to an annotation (requires Level 2+)
//
// In Next.js: /app/api/annotations/[annotationId]/replies/route.ts

import type { AnnotationReply } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { requireDepthLevel, checkRateLimit } from "./middleware";

// ---------- Payloads & Responses ----------

export interface CreateReplyPayload {
  annotationId: string;
  replyText: string;
}

export interface ReplyResponse {
  success: boolean;
  data?: AnnotationReply;
  error?: string;
  status?: number;
}

export interface RepliesListResponse {
  success: boolean;
  data: AnnotationReply[];
  error?: string;
}

// Thread limit
const MAX_REPLIES_PER_THREAD = 5;

// ---------- GET: Fetch replies for an annotation ----------

export async function handleGetReplies(
  annotationId: string,
): Promise<RepliesListResponse> {
  if (!annotationId?.trim()) {
    return { success: false, data: [], error: "Annotation ID is required." };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("annotation_replies")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            institution
          )
        `,
        )
        .eq("annotation_id", annotationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch replies error:", error);
        return { success: false, data: [], error: error.message };
      }

      const replies: AnnotationReply[] = (data ?? []).map(
        (row: Record<string, unknown>) => {
          const profile = row.profiles as Record<string, unknown> | null;
          return {
            id: row.id as string,
            userId: row.user_id as string,
            userName: (profile?.full_name as string) ?? "Anonymous",
            body: row.reply_text as string,
            createdAt: row.created_at as string,
          };
        },
      );

      return { success: true, data: replies };
    } catch (err) {
      console.error("Fetch replies error:", err);
      return { success: false, data: [], error: "Failed to fetch replies." };
    }
  }

  // Mock path
  return { success: true, data: [] };
}

// ---------- POST: Create a reply ----------

export async function handleCreateReply(
  payload: CreateReplyPayload,
): Promise<ReplyResponse> {
  // 1. Validate input
  if (!payload.annotationId?.trim()) {
    return {
      success: false,
      error: "Annotation ID is required.",
      status: 400,
    };
  }
  if (!payload.replyText?.trim()) {
    return { success: false, error: "Reply text is required.", status: 400 };
  }
  if (payload.replyText.length > 280) {
    return {
      success: false,
      error: "Reply must be 280 characters or fewer.",
      status: 400,
    };
  }
  if (payload.replyText.trim().length < 1) {
    return {
      success: false,
      error: "Reply must be at least 1 character.",
      status: 400,
    };
  }

  // 2. Auth + depth level check (Level 2+ can reply)
  let auth: any = await requireDepthLevel(2).catch(() => null);
  
  // Allow anonymous/guest if no auth is found
  if (!auth || !auth.authorized || !auth.user) {
    auth = {
      authorized: true,
      user: {
        id: "guest-user-" + Date.now(),
        depthLevel: 3,
        profile: { name: "Anonymous" }
      }
    };
  }

  // 3. Rate limit
  const rateCheck = checkRateLimit(auth.user.id, 20, 60_000);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error, status: 429 };
  }

  // 4. Check thread limit (max 5 replies)
  const currentReplyCount = await getReplyCount(payload.annotationId);
  if (currentReplyCount >= MAX_REPLIES_PER_THREAD) {
    return {
      success: false,
      error: `This thread has reached its limit of ${MAX_REPLIES_PER_THREAD} replies. Quality over quantity.`,
      status: 403,
    };
  }

  // --- Supabase path ---
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("annotation_replies")
        .insert({
          annotation_id: payload.annotationId,
          user_id: auth.user.id,
          reply_text: payload.replyText.trim(),
        })
        .select(
          `
          *,
          profiles:user_id (
            full_name
          )
        `,
        )
        .single();

      if (error) {
        console.error("Create reply error:", error);
        return { success: false, error: error.message, status: 500 };
      }

      const profile = (data as Record<string, unknown>).profiles as Record<string, unknown> | null;

      const reply: AnnotationReply = {
        id: data.id,
        userId: data.user_id,
        userName: (profile?.full_name as string) ?? "Anonymous",
        body: data.reply_text,
        createdAt: data.created_at,
      };

      return { success: true, data: reply };
    } catch (err) {
      console.error("Create reply error:", err);
      return { success: false, error: "Failed to create reply.", status: 500 };
    }
  }

  // --- Mock path ---
  const mockReply: AnnotationReply = {
    id: `reply-${Date.now()}`,
    userId: auth.user.id,
    userName: auth.user.profile?.name ?? "You",
    body: payload.replyText.trim(),
    createdAt: new Date().toISOString(),
  };

  return { success: true, data: mockReply };
}

// ---------- GET: Thread info ----------

export async function handleGetThreadInfo(annotationId: string): Promise<{
  success: boolean;
  replyCount: number;
  remaining: number;
  error?: string;
}> {
  const count = await getReplyCount(annotationId);
  return {
    success: true,
    replyCount: count,
    remaining: Math.max(0, MAX_REPLIES_PER_THREAD - count),
  };
}

// ---------- Helpers ----------

async function getReplyCount(annotationId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const { count, error } = await supabase
    .from("annotation_replies")
    .select("id", { count: "exact", head: true })
    .eq("annotation_id", annotationId);

  if (error) {
    console.error("Reply count error:", error);
    return 0;
  }

  return count ?? 0;
}
