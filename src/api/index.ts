// ============================================================
// API — Central Export
// ============================================================
// Re-exports all API handlers for convenient importing.

// --- Annotations ---
export {
  handleGetAnnotations,
  handleCreateAnnotation,
  type CreateAnnotationPayload,
  type AnnotationResponse,
  type AnnotationsListResponse,
} from "./annotations";

// --- Replies ---
export {
  handleGetReplies,
  handleCreateReply,
  handleGetThreadInfo,
  type CreateReplyPayload,
  type ReplyResponse,
  type RepliesListResponse,
} from "./replies";

// --- Reading Progress ---
export {
  handleUpdateReadingProgress,
  handleGetReadingProgress,
  handleGetReadingStats,
  type ReadingProgressPayload,
  type ReadingProgressResponse,
} from "./reading-progress";

// --- Scoring ---
export {
  handleScoreAnnotation,
  handleGetUserScore,
  handleBatchRescore,
  type ScorePayload,
  type ScoreResponse,
  type ScoreBreakdown,
} from "./score";

// --- Auth ---
export {
  handleSignIn,
  handleSignUp,
  handleSignOut,
  handleAuthCallback,
  handleGetCurrentUser,
  type AuthPayload,
  type AuthResponse,
} from "./auth";

// --- Middleware ---
export {
  requireAuth,
  requireDepthLevel,
  checkRateLimit,
  type AuthenticatedUser,
  type MiddlewareResult,
} from "./middleware";
