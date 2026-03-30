import { useMemo } from "react";
import { useAuth } from "./useAuth";

interface DepthLevelInfo {
  level: number;
  levelName: string;
  levelTitle: string;
  icon: string;
  canAnnotate: boolean;
  canReply: boolean;
  canCreatePaths: boolean;
  canInvite: boolean;
  annotationLimit: number | null;
  nextLevelProgress: {
    current: number;
    required: number;
    description: string;
    percentage: number;
  } | null;
}

const DEPTH_LEVELS = [
  {
    level: 0,
    name: "Reader",
    title: "Level 0: Reader",
    icon: "👁️",
    abilities: {
      canAnnotate: false,
      canReply: false,
      canCreatePaths: false,
      canInvite: false,
      annotationLimit: 0,
    },
    nextRequirement: {
      required: 3,
      metric: "articles",
      description: "Read 3 articles deeply (85%+ scroll)",
    },
  },
  {
    level: 1,
    name: "Highlighter",
    title: "Level 1: Highlighter",
    icon: "✨",
    abilities: {
      canAnnotate: false,
      canReply: false,
      canCreatePaths: false,
      canInvite: false,
      annotationLimit: 0,
    },
    nextRequirement: {
      required: 5,
      metric: "highlights",
      description: "Make 5 meaningful highlights + read 2 more articles",
    },
  },
  {
    level: 2,
    name: "Annotator",
    title: "Level 2: Annotator",
    icon: "✍️",
    abilities: {
      canAnnotate: true,
      canReply: true,
      canCreatePaths: false,
      canInvite: false,
      annotationLimit: 3, // Per article
    },
    nextRequirement: {
      required: 10,
      metric: "annotations",
      description: "Contribute annotations that spark conversations",
    },
  },
  {
    level: 3,
    name: "Voice",
    title: "Level 3: Voice",
    icon: "🎙️",
    abilities: {
      canAnnotate: true,
      canReply: true,
      canCreatePaths: false,
      canInvite: false,
      annotationLimit: null, // Unlimited
    },
    nextRequirement: {
      required: 20,
      metric: "quality",
      description: "Sustained quality contributions over time",
    },
  },
  {
    level: 4,
    name: "Contributor",
    title: "Level 4: Contributor",
    icon: "🌟",
    abilities: {
      canAnnotate: true,
      canReply: true,
      canCreatePaths: true,
      canInvite: true,
      annotationLimit: null,
    },
    nextRequirement: null, // Max level
  },
];

export function useDepthLevel(): DepthLevelInfo {
  const { user } = useAuth();
  const currentLevel = user?.depthLevel ?? 0;

  return useMemo(() => {
    const levelData = DEPTH_LEVELS[Math.min(currentLevel, DEPTH_LEVELS.length - 1)];

    // Calculate progress to next level
    let nextLevelProgress = null;
    if (levelData.nextRequirement && user) {
      let current = 0;
      const { required, metric, description } = levelData.nextRequirement;

      // Calculate current progress based on metric
      switch (metric) {
        case "articles":
          current = user.stats?.articlesRead || 0;
          break;
        case "highlights":
          // This would come from a highlights count
          current = 0; // TODO: Add highlights tracking
          break;
        case "annotations":
          current = user.stats?.marginNotes || 0;
          break;
        case "quality":
          // This is based on quality scores, conversations sparked, etc.
          current = user.stats?.conversationsSparked || 0;
          break;
      }

      const percentage = Math.min((current / required) * 100, 100);

      nextLevelProgress = {
        current,
        required,
        description,
        percentage,
      };
    }

    return {
      level: currentLevel,
      levelName: levelData.name,
      levelTitle: levelData.title,
      icon: levelData.icon,
      ...levelData.abilities,
      nextLevelProgress,
    };
  }, [currentLevel, user]);
}

// Helper functions for common checks
export function useCanAnnotate(): boolean {
  const { canAnnotate } = useDepthLevel();
  return canAnnotate;
}

export function useCanReply(): boolean {
  const { canReply } = useDepthLevel();
  return canReply;
}

export function useAnnotationLimit(): number | null {
  const { annotationLimit } = useDepthLevel();
  return annotationLimit;
}

// Get user's remaining annotations for an article
export function useRemainingAnnotations(articleAnnotationCount: number): number | null {
  const { annotationLimit } = useDepthLevel();
  
  if (annotationLimit === null) {
    return null; // Unlimited
  }
  
  return Math.max(0, annotationLimit - articleAnnotationCount);
}