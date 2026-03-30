// ============================================================
// API Route: /api/reading-progress
// ============================================================
// POST — Upsert reading progress for the current user + article
//
// Handles:
//   - Scroll depth tracking
//   - Time spent tracking
//   - Article completion detection (85% scroll + 120s minimum)
//   - User stats update (articles_read increment)
//   - Level-up checks after completion
//
// In Next.js: /app/api/reading-progress/route.ts

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { requireAuth } from "./middleware";
import type { DepthLevel } from "@/lib/types";

// ---------- Payloads & Responses ----------

export interface ReadingProgressPayload {
  articleId: string;
  scrollDepth: number; // 0-100
  timeSpentSeconds: number;
}

export interface ReadingProgressResponse {
  success: boolean;
  completed: boolean;
  leveledUp: boolean;
  newLevel?: DepthLevel;
  error?: string;
  status?: number;
}

// Thresholds
const COMPLETION_SCROLL_THRESHOLD = 85; // percent
const COMPLETION_TIME_THRESHOLD = 120; // seconds

// ---------- POST: Upsert reading progress ----------

export async function handleUpdateReadingProgress(
  payload: ReadingProgressPayload,
): Promise<ReadingProgressResponse> {
  // 1. Validate input
  if (!payload.articleId?.trim()) {
    return {
      success: false,
      completed: false,
      leveledUp: false,
      error: "Article ID is required.",
      status: 400,
    };
  }
  if (
    typeof payload.scrollDepth !== "number" ||
    payload.scrollDepth < 0 ||
    payload.scrollDepth > 100
  ) {
    return {
      success: false,
      completed: false,
      leveledUp: false,
      error: "Scroll depth must be between 0 and 100.",
      status: 400,
    };
  }
  if (
    typeof payload.timeSpentSeconds !== "number" ||
    payload.timeSpentSeconds < 0
  ) {
    return {
      success: false,
      completed: false,
      leveledUp: false,
      error: "Time spent must be a non-negative number.",
      status: 400,
    };
  }

  // 2. Auth check
  const auth = await requireAuth();
  if (!auth.authorized || !auth.user) {
    return {
      success: false,
      completed: false,
      leveledUp: false,
      error: auth.error ?? "Authentication required.",
      status: auth.status ?? 401,
    };
  }

  const userId = auth.user.id;
  const isCompleted =
    payload.scrollDepth >= COMPLETION_SCROLL_THRESHOLD &&
    payload.timeSpentSeconds >= COMPLETION_TIME_THRESHOLD;

  // --- Supabase path ---
  if (isSupabaseConfigured()) {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("article_id", payload.articleId)
        .single();

      const wasAlreadyCompleted = existing?.completed === true;

      if (existing) {
        // Update existing record (only increase, never decrease)
        const updateData: Record<string, unknown> = {
          scroll_depth: Math.max(
            existing.scroll_depth ?? 0,
            payload.scrollDepth,
          ),
          time_spent_seconds: Math.max(
            existing.time_spent_seconds ?? 0,
            payload.timeSpentSeconds,
          ),
          updated_at: new Date().toISOString(),
        };

        // Only mark as completed, never un-complete
        if (isCompleted && !wasAlreadyCompleted) {
          updateData.completed = true;
        }

        const { error: updateError } = await supabase
          .from("reading_progress")
          .update(updateData)
          .eq("id", existing.id);

        if (updateError) {
          console.error("Update reading progress error:", updateError);
          return {
            success: false,
            completed: false,
            leveledUp: false,
            error: updateError.message,
            status: 500,
          };
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("reading_progress")
          .insert({
            user_id: userId,
            article_id: payload.articleId,
            scroll_depth: payload.scrollDepth,
            time_spent_seconds: payload.timeSpentSeconds,
            completed: isCompleted,
          });

        if (insertError) {
          console.error("Insert reading progress error:", insertError);
          return {
            success: false,
            completed: false,
            leveledUp: false,
            error: insertError.message,
            status: 500,
          };
        }
      }

      // If article was just completed (wasn't before), update user stats + check level
      let leveledUp = false;
      let newLevel: DepthLevel | undefined;

      if (isCompleted && !wasAlreadyCompleted) {
        const levelResult = await handleArticleCompletion(userId);
        leveledUp = levelResult.leveledUp;
        newLevel = levelResult.newLevel;
      }

      return {
        success: true,
        completed: isCompleted || wasAlreadyCompleted,
        leveledUp,
        newLevel,
      };
    } catch (err) {
      console.error("Reading progress error:", err);
      return {
        success: false,
        completed: false,
        leveledUp: false,
        error: "Failed to update reading progress.",
        status: 500,
      };
    }
  }

  // --- Mock path ---
  console.log(
    `[ReadingProgress] User ${userId} | Article ${payload.articleId} | Scroll: ${payload.scrollDepth}% | Time: ${payload.timeSpentSeconds}s | Completed: ${isCompleted}`,
  );

  return {
    success: true,
    completed: isCompleted,
    leveledUp: false,
  };
}

// ---------- GET: Get user's reading progress for an article ----------

export async function handleGetReadingProgress(
  articleId: string,
): Promise<{
  success: boolean;
  data?: {
    scrollDepth: number;
    timeSpentSeconds: number;
    completed: boolean;
  };
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.authorized || !auth.user) {
    return { success: false, error: "Authentication required." };
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("scroll_depth, time_spent_seconds, completed")
      .eq("user_id", auth.user.id)
      .eq("article_id", articleId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data
        ? {
            scrollDepth: data.scroll_depth ?? 0,
            timeSpentSeconds: data.time_spent_seconds ?? 0,
            completed: data.completed ?? false,
          }
        : { scrollDepth: 0, timeSpentSeconds: 0, completed: false },
    };
  }

  // Mock
  return {
    success: true,
    data: { scrollDepth: 0, timeSpentSeconds: 0, completed: false },
  };
}

// ---------- GET: User's reading stats ----------

export async function handleGetReadingStats(userId: string): Promise<{
  success: boolean;
  data?: {
    totalArticlesRead: number;
    totalTimeMinutes: number;
    averageDepth: number;
    completionRate: number;
  };
  error?: string;
}> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("scroll_depth, time_spent_seconds, completed")
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    const records = data ?? [];
    const completed = records.filter(
      (r: { completed: boolean }) => r.completed,
    );
    const totalTime = records.reduce(
      (sum: number, r: { time_spent_seconds: number }) =>
        sum + (r.time_spent_seconds ?? 0),
      0,
    );
    const avgDepth =
      records.length > 0
        ? records.reduce(
            (sum: number, r: { scroll_depth: number }) =>
              sum + (r.scroll_depth ?? 0),
            0,
          ) / records.length
        : 0;

    return {
      success: true,
      data: {
        totalArticlesRead: completed.length,
        totalTimeMinutes: Math.round(totalTime / 60),
        averageDepth: Math.round(avgDepth),
        completionRate:
          records.length > 0
            ? Math.round((completed.length / records.length) * 100)
            : 0,
      },
    };
  }

  // Mock
  return {
    success: true,
    data: {
      totalArticlesRead: 142,
      totalTimeMinutes: 4260,
      averageDepth: 78,
      completionRate: 85,
    },
  };
}

// ---------- Internal: Handle article completion ----------

async function handleArticleCompletion(userId: string): Promise<{
  leveledUp: boolean;
  newLevel?: DepthLevel;
}> {
  try {
    // Increment articles_read count
    const { data: profile } = await supabase
      .from("profiles")
      .select("articles_read, depth_level, annotations_count")
      .eq("id", userId)
      .single();

    if (!profile) return { leveledUp: false };

    const newArticlesRead = (profile.articles_read ?? 0) + 1;
    const currentLevel = (profile.depth_level ?? 0) as DepthLevel;

    // Update articles_read
    await supabase
      .from("profiles")
      .update({
        articles_read: newArticlesRead,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Check for level-up
    let newLevel = currentLevel;
    const annotationCount = profile.annotations_count ?? 0;

    // Level 0 → 1: Read 3 articles deeply
    if (currentLevel === 0 && newArticlesRead >= 3) {
      newLevel = 1;
    }
    // Level 1 → 2: 5 highlights + 5 articles
    else if (currentLevel === 1 && newArticlesRead >= 5 && annotationCount >= 5) {
      newLevel = 2;
    }

    if (newLevel > currentLevel) {
      await supabase
        .from("profiles")
        .update({ depth_level: newLevel })
        .eq("id", userId);

      console.log(
        `[LevelUp] User ${userId}: Level ${currentLevel} → ${newLevel} (articles: ${newArticlesRead})`,
      );

      return { leveledUp: true, newLevel: newLevel as DepthLevel };
    }

    return { leveledUp: false };
  } catch (err) {
    console.error("Article completion handler error:", err);
    return { leveledUp: false };
  }
}
