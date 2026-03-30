// ============================================================
// API Route: /api/score
// ============================================================
// Quality scoring endpoint powered by OpenAI.
// Scores annotations on: Relevance (0-25), Specificity (0-25),
// Originality (0-25), Quality of Reasoning (0-25). Total: 0-100.
//
// In Next.js, this would be /app/api/score/route.ts

import type { QualityScore } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { scoreAnnotation as openaiScore } from "@/lib/openai";
import { requireAuth } from "./middleware";

// ---------- Payloads & Responses ----------

export interface ScorePayload {
  annotationId: string;
  annotationText: string;
  highlightedText: string;
}

export interface ScoreBreakdown {
  relevance: number; // 0-25
  specificity: number; // 0-25
  originality: number; // 0-25
  reasoning: number; // 0-25
}

export interface ScoreResponse {
  success: boolean;
  score?: number; // 0-100
  breakdown?: ScoreBreakdown;
  feedback?: string;
  error?: string;
  status?: number;
}

// ---------- POST: Score an annotation ----------

export async function handleScoreAnnotation(
  payload: ScorePayload,
): Promise<ScoreResponse> {
  // Validate input
  if (!payload.annotationId?.trim()) {
    return { success: false, error: "Annotation ID is required.", status: 400 };
  }
  if (!payload.annotationText?.trim()) {
    return {
      success: false,
      error: "Annotation text is required.",
      status: 400,
    };
  }
  if (!payload.highlightedText?.trim()) {
    return {
      success: false,
      error: "Highlighted text is required.",
      status: 400,
    };
  }

  try {
    // Call OpenAI for scoring (or use mock if no API key)
    const aiResult = await openaiScore(
      payload.highlightedText,
      payload.annotationText,
    );

    // Parse the AI score into a breakdown (mock breakdown for now)
    const totalScore = Math.min(100, Math.max(0, aiResult.score));
    const breakdown: ScoreBreakdown = distributeScore(totalScore);

    // Persist the score to the database
    if (isSupabaseConfigured()) {
      const { error: updateError } = await supabase
        .from("annotations")
        .update({ quality_score: totalScore })
        .eq("id", payload.annotationId);

      if (updateError) {
        console.error("Failed to update annotation score:", updateError);
        // Non-fatal — we still return the score
      }

      // Check if user should level up based on annotation quality
      await checkLevelUpFromScore(payload.annotationId, totalScore);
    }

    return {
      success: true,
      score: totalScore,
      breakdown,
      feedback: aiResult.feedback,
    };
  } catch (err) {
    console.error("Scoring error:", err);
    // Fallback to mock scoring
    const mockScore = Math.floor(Math.random() * 30) + 60;
    return {
      success: true,
      score: mockScore,
      breakdown: distributeScore(mockScore),
      feedback:
        mockScore > 75
          ? "Thoughtful annotation with good contextual awareness."
          : "Consider adding more depth or a unique perspective.",
    };
  }
}

// ---------- GET: User's overall quality score ----------

export async function handleGetUserScore(
  userId: string,
): Promise<{ success: boolean; data?: QualityScore; error?: string }> {
  if (!userId?.trim()) {
    return { success: false, error: "User ID is required." };
  }

  if (isSupabaseConfigured()) {
    try {
      // Calculate average quality score from user's annotations
      const { data, error } = await supabase
        .from("annotations")
        .select("quality_score")
        .eq("user_id", userId);

      if (error) {
        return { success: false, error: error.message };
      }

      const scores = (data ?? [])
        .map((r: { quality_score: number }) => r.quality_score)
        .filter((s: number) => s > 0);

      const avgScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
            )
          : 0;

      return {
        success: true,
        data: {
          userId,
          score: avgScore,
          breakdown: {
            depth: Math.round(avgScore * 1.05),
            originality: Math.round(avgScore * 0.95),
            engagement: Math.round(avgScore * 0.98),
            consistency: Math.round(avgScore * 1.02),
          },
        },
      };
    } catch (err) {
      console.error("Get user score error:", err);
      return { success: false, error: "Failed to fetch user score." };
    }
  }

  // Mock response
  return {
    success: true,
    data: {
      userId,
      score: 82,
      breakdown: {
        depth: 85,
        originality: 78,
        engagement: 80,
        consistency: 84,
      },
    },
  };
}

// ---------- POST: Batch re-score (admin) ----------

export async function handleBatchRescore(): Promise<{
  success: boolean;
  processed: number;
  error?: string;
}> {
  const auth = await requireAuth();
  if (!auth.authorized || !auth.user || auth.user.depthLevel < 4) {
    return {
      success: false,
      processed: 0,
      error: "Only Contributors (Level 4) can trigger batch rescoring.",
    };
  }

  // In production, this would queue a background job
  console.log("[Score] Batch rescore triggered by:", auth.user.id);
  return { success: true, processed: 0 };
}

// ---------- Helpers ----------

function distributeScore(total: number): ScoreBreakdown {
  // Distribute the total score across 4 categories with slight variation
  const base = total / 4;
  const variance = () => Math.round(base + (Math.random() - 0.5) * 6);
  const relevance = Math.min(25, Math.max(0, variance()));
  const specificity = Math.min(25, Math.max(0, variance()));
  const originality = Math.min(25, Math.max(0, variance()));
  const reasoning = Math.min(
    25,
    Math.max(0, total - relevance - specificity - originality),
  );
  return { relevance, specificity, originality, reasoning };
}

async function checkLevelUpFromScore(
  annotationId: string,
  _score: number,
) {
  if (!isSupabaseConfigured()) return;
  try {
    // Get the annotation's user
    const { data: annotation } = await supabase
      .from("annotations")
      .select("user_id")
      .eq("id", annotationId)
      .single();

    if (!annotation) return;

    // Get user's average quality and annotation count
    const { data: allAnnotations } = await supabase
      .from("annotations")
      .select("quality_score")
      .eq("user_id", annotation.user_id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("depth_level, annotations_count, articles_read")
      .eq("id", annotation.user_id)
      .single();

    if (!profile || !allAnnotations) return;

    const scores = allAnnotations
      .map((a: { quality_score: number }) => a.quality_score)
      .filter((s: number) => s > 0);
    const avgQuality =
      scores.length > 0
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
        : 0;

    const currentLevel = profile.depth_level ?? 0;
    let newLevel = currentLevel;

    // Level-up logic (flexible, not rigidly gamified)
    if (currentLevel === 0 && (profile.articles_read ?? 0) >= 3) {
      newLevel = 1;
    } else if (
      currentLevel === 1 &&
      (profile.annotations_count ?? 0) >= 5 &&
      (profile.articles_read ?? 0) >= 5
    ) {
      newLevel = 2;
    } else if (
      currentLevel === 2 &&
      avgQuality >= 65 &&
      (profile.annotations_count ?? 0) >= 15
    ) {
      newLevel = 3;
    } else if (
      currentLevel === 3 &&
      avgQuality >= 75 &&
      (profile.annotations_count ?? 0) >= 40
    ) {
      newLevel = 4;
    }

    if (newLevel > currentLevel) {
      await supabase
        .from("profiles")
        .update({ depth_level: newLevel })
        .eq("id", annotation.user_id);
      console.log(
        `[LevelUp] User ${annotation.user_id}: Level ${currentLevel} → ${newLevel}`,
      );
    }
  } catch (err) {
    console.error("Level-up check error:", err);
  }
}
