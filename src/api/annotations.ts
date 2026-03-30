// ============================================================
// API Route: /api/annotations
// ============================================================
// GET  — Fetch all annotations for an article
// POST — Create a new annotation (requires Level 2+)
//
// In Next.js, this would be /app/api/annotations/route.ts
// Here it's implemented as handler functions callable from the frontend.

import type { Annotation, AnnotationType } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { requireDepthLevel, checkRateLimit } from "./middleware";
import { handleScoreAnnotation } from "./score";

// ---------- Payloads & Responses ----------

export interface CreateAnnotationPayload {
  articleId: string;
  highlightedText: string;
  paragraphIndex: number;
  annotationText: string;
  annotationType: AnnotationType;
}

export interface AnnotationResponse {
  success: boolean;
  data?: Annotation;
  error?: string;
  status?: number;
}

export interface AnnotationsListResponse {
  success: boolean;
  data: Annotation[];
  error?: string;
}

// ---------- GET: Fetch annotations for an article ----------

export async function handleGetAnnotations(
  articleId: string,
): Promise<AnnotationsListResponse> {
  if (!articleId) {
    return { success: false, data: [], error: "articleId is required" };
  }

  // --- Supabase path ---
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("annotations")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            institution,
            depth_level
          ),
          annotation_replies (
            id,
            user_id,
            reply_text,
            created_at,
            profiles:user_id (
              full_name
            )
          )
        `,
        )
        .eq("article_id", articleId)
        .order("paragraph_index", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase fetch annotations error:", error);
        return { success: false, data: [], error: error.message };
      }

      // Transform Supabase rows into our Annotation type
      const annotations: Annotation[] = (data ?? []).map((row: Record<string, unknown>) => {
        const profile = row.profiles as Record<string, unknown> | null;
        const replies = (row.annotation_replies as Record<string, unknown>[]) ?? [];
        return {
          id: row.id as string,
          articleId: row.article_id as string,
          paragraphId: `p-${row.paragraph_index}`,
          paragraphIndex: row.paragraph_index as number,
          userId: row.user_id as string,
          userName: (profile?.full_name as string) ?? "Anonymous",
          userAvatar: (profile?.avatar_url as string) ?? undefined,
          userInstitution: (profile?.institution as string) ?? undefined,
          userDepthLevel: ((profile?.depth_level as number) ?? 0) as 0 | 1 | 2 | 3 | 4,
          type: row.annotation_type as AnnotationType,
          highlightedText: row.highlighted_text as string,
          body: row.annotation_text as string,
          createdAt: row.created_at as string,
          replyCount: replies.length,
          replies: replies.map((r: Record<string, unknown>) => {
            const replyProfile = r.profiles as Record<string, unknown> | null;
            return {
              id: r.id as string,
              userId: r.user_id as string,
              userName: (replyProfile?.full_name as string) ?? "Anonymous",
              body: r.reply_text as string,
              createdAt: r.created_at as string,
            };
          }),
        };
      });

      return { success: true, data: annotations };
    } catch (err) {
      console.error("Fetch annotations error:", err);
      return { success: false, data: [], error: "Failed to fetch annotations" };
    }
  }

  // --- Mock path (demo mode) ---
  return { success: true, data: getMockAnnotations(articleId) };
}

// ---------- POST: Create annotation ----------

export async function handleCreateAnnotation(
  payload: CreateAnnotationPayload,
): Promise<AnnotationResponse> {
  // 1. Validate input
  const validationError = validateAnnotationPayload(payload);
  if (validationError) {
    return { success: false, error: validationError, status: 400 };
  }

  // 2. Check auth + depth level (must be Level 2: Annotator)
  const auth = await requireDepthLevel(2);
  if (!auth.authorized || !auth.user) {
    return {
      success: false,
      error: auth.error ?? "Not authorized",
      status: auth.status ?? 403,
    };
  }

  // 3. Rate limit check
  const rateCheck = checkRateLimit(auth.user.id, 10, 60_000);
  if (!rateCheck.allowed) {
    return { success: false, error: rateCheck.error, status: 429 };
  }

  // 4. Check annotation limit for Level 2 users (max 3 per article)
  if (auth.user.depthLevel === 2) {
    const existingCount = await getUserAnnotationCount(
      auth.user.id,
      payload.articleId,
    );
    if (existingCount >= 3) {
      return {
        success: false,
        error:
          "Level 2 users can add up to 3 annotations per article. Reach Level 3 for unlimited annotations.",
        status: 403,
      };
    }
  }

  // --- Supabase path ---
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("annotations")
        .insert({
          article_id: payload.articleId,
          user_id: auth.user.id,
          highlighted_text: payload.highlightedText,
          paragraph_index: payload.paragraphIndex,
          annotation_text: payload.annotationText,
          annotation_type: payload.annotationType,
          quality_score: 0,
        })
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            institution,
            depth_level
          )
        `,
        )
        .single();

      if (error) {
        console.error("Supabase create annotation error:", error);
        return { success: false, error: error.message, status: 500 };
      }

      const profile = (data as Record<string, unknown>).profiles as Record<string, unknown> | null;

      const annotation: Annotation = {
        id: data.id,
        articleId: data.article_id,
        paragraphId: `p-${data.paragraph_index}`,
        paragraphIndex: data.paragraph_index,
        userId: data.user_id,
        userName: (profile?.full_name as string) ?? "Anonymous",
        userAvatar: (profile?.avatar_url as string) ?? undefined,
        userInstitution: (profile?.institution as string) ?? undefined,
        userDepthLevel: ((profile?.depth_level as number) ?? 0) as 0 | 1 | 2 | 3 | 4,
        type: data.annotation_type,
        highlightedText: data.highlighted_text,
        body: data.annotation_text,
        createdAt: data.created_at,
        replyCount: 0,
        replies: [],
      };

      // 5. Trigger quality scoring asynchronously
      triggerScoring(annotation.id, payload.annotationText, payload.highlightedText);

      // 6. Update user annotation count
      updateUserAnnotationCount(auth.user.id);

      return { success: true, data: annotation };
    } catch (err) {
      console.error("Create annotation error:", err);
      return { success: false, error: "Failed to create annotation", status: 500 };
    }
  }

  // --- Mock path ---
  const mockAnnotation: Annotation = {
    id: `ann-${Date.now()}`,
    articleId: payload.articleId,
    paragraphId: `p-${payload.paragraphIndex}`,
    paragraphIndex: payload.paragraphIndex,
    userId: auth.user.id,
    userName: auth.user.profile?.name ?? "You",
    userAvatar: undefined,
    userInstitution: auth.user.profile?.institution ?? undefined,
    userDepthLevel: auth.user.depthLevel,
    type: payload.annotationType,
    highlightedText: payload.highlightedText,
    body: payload.annotationText,
    createdAt: new Date().toISOString(),
    replyCount: 0,
    replies: [],
  };

  // Async mock scoring
  triggerScoring(mockAnnotation.id, payload.annotationText, payload.highlightedText);

  return { success: true, data: mockAnnotation };
}

// ---------- Validation ----------

function validateAnnotationPayload(
  payload: CreateAnnotationPayload,
): string | null {
  if (!payload.articleId?.trim()) {
    return "Article ID is required.";
  }
  if (!payload.highlightedText?.trim()) {
    return "Highlighted text is required.";
  }
  if (typeof payload.paragraphIndex !== "number" || payload.paragraphIndex < 0) {
    return "Valid paragraph index is required.";
  }
  if (!payload.annotationText?.trim()) {
    return "Annotation text is required.";
  }
  if (payload.annotationText.trim().length < 20) {
    return "Annotation must be at least 20 characters. Share a deeper thought.";
  }
  if (payload.annotationText.length > 280) {
    return "Annotation must be 280 characters or fewer.";
  }
  const validTypes: AnnotationType[] = [
    "insight",
    "question",
    "challenge",
    "connection",
  ];
  if (!validTypes.includes(payload.annotationType)) {
    return "Invalid annotation type. Must be insight, question, challenge, or connection.";
  }
  return null;
}

// ---------- Helpers ----------

async function getUserAnnotationCount(
  userId: string,
  articleId: string,
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { count } = await supabase
    .from("annotations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("article_id", articleId);
  return count ?? 0;
}

function triggerScoring(
  annotationId: string,
  annotationText: string,
  highlightedText: string,
) {
  // Fire and forget — async scoring doesn't block the response
  handleScoreAnnotation({
    annotationId,
    annotationText,
    highlightedText,
  })
    .then((result) => {
      if (result.success && result.score !== undefined) {
        console.log(
          `[Score] Annotation ${annotationId}: ${result.score}/100`,
        );
        // In production, the score handler already updates the DB
      }
    })
    .catch((err) => {
      console.error(`[Score] Failed for annotation ${annotationId}:`, err);
    });
}

async function updateUserAnnotationCount(userId: string) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.rpc("increment_annotations_count", { user_id_param: userId });
  } catch {
    // Fallback: direct update
    const { data } = await supabase
      .from("profiles")
      .select("annotations_count")
      .eq("id", userId)
      .single();
    if (data) {
      await supabase
        .from("profiles")
        .update({ annotations_count: (data.annotations_count ?? 0) + 1 })
        .eq("id", userId);
    }
  }
}

// ---------- Mock Data ----------

function getMockAnnotations(articleId: string): Annotation[] {
  return [
    {
      id: "ann-mock-1",
      articleId,
      paragraphId: "p-1",
      paragraphIndex: 1,
      userId: "user-2",
      userName: "Priya Sharma",
      userInstitution: "IIM-A",
      userDepthLevel: 3,
      type: "insight",
      highlightedText:
        "Knowledge networks operate on fundamentally different principles than social networks",
      body: "This mirrors what we saw at McKinsey — the most valuable networks were never the largest ones, but the ones where each node added genuine expertise. Quality over quantity, always.",
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      replyCount: 3,
      replies: [
        {
          id: "reply-1",
          userId: "user-3",
          userName: "Arun K.",
          body: "Completely agree. The INSEAD alumni network works the same way — small but deeply connected.",
          createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        },
        {
          id: "reply-2",
          userId: "user-4",
          userName: "Sarah L.",
          body: "But doesn't this conflict with Metcalfe's law? Or does knowledge follow a different curve entirely?",
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        },
        {
          id: "reply-3",
          userId: "user-2",
          userName: "Priya Sharma",
          body: "Great question Sarah — I think knowledge follows an S-curve where quality filters actually increase total network value.",
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        },
      ],
    },
    {
      id: "ann-mock-2",
      articleId,
      paragraphId: "p-2",
      paragraphIndex: 2,
      userId: "user-5",
      userName: "James Chen",
      userInstitution: "Google",
      userDepthLevel: 4,
      type: "question",
      highlightedText:
        "The density of connections matters more than the breadth",
      body: "How do we measure 'density' in practice? Is it frequency of interaction, depth of exchange, or something else entirely? Seems hard to quantify.",
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      replyCount: 1,
      replies: [
        {
          id: "reply-4",
          userId: "user-6",
          userName: "Maya R.",
          body: "I think it's about reciprocity — how often both parties learn something new from each exchange.",
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
      ],
    },
    {
      id: "ann-mock-3",
      articleId,
      paragraphId: "p-3",
      paragraphIndex: 3,
      userId: "user-7",
      userName: "Vikram S.",
      userInstitution: "LSE",
      userDepthLevel: 2,
      type: "challenge",
      highlightedText: "curation becomes the most valuable skill",
      body: "I'd push back on this — isn't synthesis more valuable than curation? Anyone can collect; few can integrate disparate ideas into new frameworks.",
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      replyCount: 2,
      replies: [
        {
          id: "reply-5",
          userId: "user-8",
          userName: "Elena M.",
          body: "Fair point, but curation IS a form of synthesis. Choosing what to include requires deep understanding.",
          createdAt: new Date(Date.now() - 7 * 3600000).toISOString(),
        },
        {
          id: "reply-6",
          userId: "user-7",
          userName: "Vikram S.",
          body: "Hmm, I think there's a meaningful distinction. Curation preserves originals; synthesis creates something new.",
          createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        },
      ],
    },
    {
      id: "ann-mock-4",
      articleId,
      paragraphId: "p-4",
      paragraphIndex: 4,
      userId: "user-9",
      userName: "Ananya P.",
      userInstitution: "XLRI",
      userDepthLevel: 3,
      type: "connection",
      highlightedText: "trust architecture",
      body: "This concept connects beautifully with Fukuyama's work on trust and social capital. High-trust societies build better knowledge networks because the friction of verification is lower.",
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      replyCount: 0,
      replies: [],
    },
  ];
}
