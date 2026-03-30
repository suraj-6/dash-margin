// ============================================================
// Margins — Core Type Definitions
// ============================================================

// ---------- User / Auth ----------
export type DepthLevel = 0 | 1 | 2 | 3 | 4;

export const DEPTH_LEVEL_META: Record<
  DepthLevel,
  { name: string; icon: string; label: string }
> = {
  0: { name: "Reader", icon: "👁️", label: "Level 0: Reader" },
  1: { name: "Highlighter", icon: "✨", label: "Level 1: Highlighter" },
  2: { name: "Annotator", icon: "✍️", label: "Level 2: Annotator" },
  3: { name: "Voice", icon: "🎙️", label: "Level 3: Voice" },
  4: { name: "Contributor", icon: "🌟", label: "Level 4: Contributor" },
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  depthLevel: DepthLevel;
  institution?: string;
  createdAt: string;
  stats: UserStats;
  readingInterests: string[];
}

export interface UserStats {
  articlesRead: number;
  marginNotes: number;
  conversationsSparked: number;
}

// ---------- Articles ----------
export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author: ArticleAuthor;
  content: ArticleParagraph[];
  publishedAt: string;
  readingTime: number; // minutes
  tags: string[];
  heatMap: Record<string, number>; // paragraphId → annotation count
}

export interface ArticleAuthor {
  name: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ArticleParagraph {
  id: string;
  content: string;
  type: "paragraph" | "heading" | "subheading" | "quote" | "image";
}

// ---------- Annotations ----------
export type AnnotationType = "insight" | "question" | "challenge" | "connection";

export const ANNOTATION_TYPE_META: Record<
  AnnotationType,
  { icon: string; label: string; color: string }
> = {
  insight: { icon: "💡", label: "Insight", color: "#E07A5F" },
  question: { icon: "❓", label: "Question", color: "#457B9D" },
  challenge: { icon: "⚔️", label: "Challenge", color: "#E07A5F" },
  connection: { icon: "🔗", label: "Connection", color: "#457B9D" },
};

export interface Annotation {
  id: string;
  articleId: string;
  paragraphId: string;
  paragraphIndex: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  userInstitution?: string;
  userDepthLevel: DepthLevel;
  type: AnnotationType;
  highlightedText: string;
  body: string;
  createdAt: string;
  replyCount: number;
  replies: AnnotationReply[];
}

export interface AnnotationReply {
  id: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

// ---------- Reading Path ----------
export interface ReadingPath {
  id: string;
  title: string;
  description: string;
  curatorId: string;
  curatorName: string;
  articles: { articleId: string; title: string; order: number }[];
}

// ---------- Quality Score ----------
export interface QualityScore {
  userId: string;
  score: number; // 0-100
  breakdown: {
    depth: number;
    originality: number;
    engagement: number;
    consistency: number;
  };
}
