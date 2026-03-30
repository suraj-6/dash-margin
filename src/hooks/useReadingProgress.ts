import { useEffect, useRef, useCallback } from "react";
import { useAnnotations } from "@/hooks/useAnnotations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface ReadingProgressState {
  scrollDepth: number;
  timeSpent: number;
  isCompleted: boolean;
  hasUnlockedAnnotations: boolean;
}

export function useReadingProgress(articleId: string = "sample-article"): ReadingProgressState {
  const { user } = useAuth();
  const scrollDepth = useAnnotations((state) => state.scrollDepth);
  const setScrollDepth = useAnnotations((state) => state.setScrollDepth);
  
  const startTimeRef = useRef(Date.now());
  const lastSyncRef = useRef(Date.now());
  const timeSpentRef = useRef(0);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setScrollDepth(Number(percentage.toFixed(1)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrollDepth]);

  // Update time spent
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
      timeSpentRef.current = elapsedSeconds;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Save progress to database (debounced every 10 seconds)
  const saveProgress = useCallback(async () => {
    if (!user?.id || !supabase) return;

    const now = Date.now();
    const timeSpentSeconds = Math.floor((now - startTimeRef.current) / 1000);
    const isCompleted = scrollDepth >= 85 && timeSpentSeconds >= 30;

    try {
      const { error } = await supabase
        .from("reading_progress")
        .upsert({
          user_id: user.id,
          article_id: articleId,
          scroll_depth: scrollDepth,
          time_spent_seconds: timeSpentSeconds,
          completed: isCompleted,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,article_id",
        });

      if (error) {
        console.error("Failed to save reading progress:", error);
      } else {
        lastSyncRef.current = now;
        console.info("Reading progress saved", {
          articleId,
          scrollDepth,
          timeSpentSeconds,
          isCompleted,
        });
      }

      // Update user stats if article is completed
      if (isCompleted) {
        await supabase
          .from("profiles")
          .update({
            articles_read: user.stats?.articlesRead ? user.stats.articlesRead + 1 : 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error saving reading progress:", error);
    }
  }, [articleId, scrollDepth, user]);

  // Save progress every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 10000);

    return () => clearInterval(interval);
  }, [saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
  const isCompleted = scrollDepth >= 85 && timeSpent >= 30;
  const hasUnlockedAnnotations = isCompleted;

  return {
    scrollDepth,
    timeSpent,
    isCompleted,
    hasUnlockedAnnotations,
  };
}
