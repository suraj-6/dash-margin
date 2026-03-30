import { create } from "zustand";
import { useEffect, useCallback } from "react";
import type { Annotation, AnnotationType } from "@/lib/types";
import { 
  handleGetAnnotations, 
  handleCreateAnnotation 
} from "@/api/annotations";
import { handleCreateReply } from "@/api/replies";

const SAMPLE_ARTICLE_ID = "sample-article";

const MOCK_ANNOTATIONS: Annotation[] = [
  {
    id: "ann-1",
    articleId: SAMPLE_ARTICLE_ID,
    paragraphId: "p-2",
    paragraphIndex: 1,
    userId: "user-2",
    userName: "Stephen H.",
    userInstitution: "Cambridge",
    userDepthLevel: 4,
    type: "insight",
    highlightedText:
      "first successful statistical counting of black-hole entropy in string theory was performed for a five-dimensional black hole",
    body: "String theory providing a microscopic counting matching the Bekenstein-Hawking entropy formula was a monumental breakthrough in quantum gravity.",
    createdAt: "2024-12-01T10:30:00Z",
    replyCount: 2,
    replies: [
      {
        id: "reply-1",
        userId: "user-4",
        userName: "Juan M.",
        body: "Indeed. It paved the way for AdS/CFT as well.",
        createdAt: "2024-12-01T14:20:00Z",
      },
      {
        id: "reply-2",
        userId: "user-5",
        userName: "Andrew S.",
        body: "And it specifically required those 5 dimensions to work out the D-brane configuration properly.",
        createdAt: "2024-12-02T09:15:00Z",
      }
    ],
  },
  {
    id: "ann-2",
    articleId: SAMPLE_ARTICLE_ID,
    paragraphId: "p-6",
    paragraphIndex: 5,
    userId: "user-3",
    userName: "Roger P.",
    userInstitution: "Oxford",
    userDepthLevel: 4,
    type: "question",
    highlightedText:
      "uniqueness, spherical topology, dynamical stability",
    body: "Will we ever find a physical mechanism that restricts higher-dimensional black holes strictly to spherical topologies without invoking additional ad-hoc symmetry constraints?",
    createdAt: "2024-12-01T11:00:00Z",
    replyCount: 1,
    replies: [
      {
        id: "reply-3",
        userId: "user-6",
        userName: "Roberto E.",
        body: "Given the discovery of black rings, it's clear that spherical topology isn't a strict requirement in d > 4.",
        createdAt: "2024-12-01T16:45:00Z",
      }
    ],
  },
];

interface AnnotationsState {
  // Core state
  currentArticleId: string;
  scrollDepth: number;
  selectedParagraphIndex: number | null;
  highlightedText: string;
  highlightRange: { x: number; y: number; paragraphId: string; paragraphIndex: number } | null;
  annotationsByArticle: Record<string, Annotation[]>;
  isAnnotationModalOpen: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  lastCreatedAnnotationId: string | null;
  
  // Actions
  setArticle: (articleId: string) => void;
  setScrollDepth: (depth: number) => void;
  setSelectedParagraphIndex: (index: number | null) => void;
  setHighlightedSelection: (payload: {
    text: string;
    x: number;
    y: number;
    paragraphId: string;
    paragraphIndex: number;
  } | null) => void;
  openAnnotationModal: () => void;
  closeAnnotationModal: () => void;
  
  // Data fetching
  fetchAnnotations: (articleId: string) => Promise<void>;
  createAnnotation: (data: {
    type: AnnotationType;
    body: string;
  }) => Promise<Annotation | null>;
  addReply: (annotationId: string, text: string) => Promise<void>;
  
  // Getters
  getAnnotationsForParagraph: (paragraphIndex: number) => Annotation[];
  getAnnotationsForCurrentArticle: () => Annotation[];
  getHeatForParagraph: (paragraphIndex: number) => number;
}

export const useAnnotations = create<AnnotationsState>((set, get) => ({
  // Initial state
  currentArticleId: SAMPLE_ARTICLE_ID,
  scrollDepth: 0,
  selectedParagraphIndex: null,
  highlightedText: "",
  highlightRange: null,
  annotationsByArticle: {
    [SAMPLE_ARTICLE_ID]: MOCK_ANNOTATIONS,
  },
  isAnnotationModalOpen: false,
  isSubmitting: false,
  isLoading: false,
  error: null,
  lastCreatedAnnotationId: null,

  // Basic setters
  setArticle: (articleId) => {
    set({ currentArticleId: articleId });
    // Fetch annotations for new article
    get().fetchAnnotations(articleId);
  },
  
  setScrollDepth: (depth) => set({ scrollDepth: depth }),
  setSelectedParagraphIndex: (index) => set({ selectedParagraphIndex: index }),

  setHighlightedSelection: (payload) => {
    if (!payload) {
      set({ highlightedText: "", highlightRange: null });
      return;
    }

    set({
      highlightedText: payload.text,
      highlightRange: {
        x: payload.x,
        y: payload.y,
        paragraphId: payload.paragraphId,
        paragraphIndex: payload.paragraphIndex,
      },
      selectedParagraphIndex: payload.paragraphIndex,
    });
  },

  openAnnotationModal: () => set({ isAnnotationModalOpen: true }),
  closeAnnotationModal: () =>
    set({
      isAnnotationModalOpen: false,
      highlightedText: "",
      highlightRange: null,
    }),

  // Fetch annotations for an article
  fetchAnnotations: async (articleId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await handleGetAnnotations(articleId);
      
      if (response.success && response.data) {
        set((state) => ({
          annotationsByArticle: {
            ...state.annotationsByArticle,
            [articleId]: response.data,
          },
          isLoading: false,
        }));
      } else {
        set({ 
          isLoading: false, 
          error: response.error || "Failed to fetch annotations" 
        });
      }
    } catch (error) {
      console.error("Error fetching annotations:", error);
      set({ 
        isLoading: false, 
        error: "Failed to fetch annotations" 
      });
    }
  },

  // Create new annotation with optimistic update
  createAnnotation: async ({ type, body }) => {
    const state = get();
    if (!state.highlightRange || !state.highlightedText.trim() || !body.trim()) {
      return null;
    }

    set({ isSubmitting: true, error: null });

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticAnnotation: Annotation = {
      id: tempId,
      articleId: state.currentArticleId,
      paragraphId: state.highlightRange.paragraphId,
      paragraphIndex: state.highlightRange.paragraphIndex,
      userId: "current-user",
      userName: "You",
      userInstitution: "",
      userDepthLevel: 3,
      type,
      highlightedText: state.highlightedText,
      body,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      replies: [],
    };

    // Add optimistically
    set((state) => ({
      annotationsByArticle: {
        ...state.annotationsByArticle,
        [state.currentArticleId]: [
          ...(state.annotationsByArticle[state.currentArticleId] || []),
          optimisticAnnotation,
        ],
      },
    }));

    try {
      const response = await handleCreateAnnotation({
        articleId: state.currentArticleId,
        paragraphIndex: state.highlightRange.paragraphIndex,
        highlightedText: state.highlightedText,
        annotationText: body,
        annotationType: type,
      });

      if (response.success && response.data) {
        // Replace optimistic annotation with real one
        const finalAnnotation = response.data;
        set((state) => ({
          annotationsByArticle: {
            ...state.annotationsByArticle,
            [state.currentArticleId]: state.annotationsByArticle[state.currentArticleId]
              .map((ann) => (ann.id === tempId ? finalAnnotation : ann)),
          },
          isSubmitting: false,
          isAnnotationModalOpen: false,
          highlightedText: "",
          highlightRange: null,
          lastCreatedAnnotationId: finalAnnotation.id,
        }));

        return finalAnnotation;
      } else {
        // Revert optimistic update
        set((state) => ({
          annotationsByArticle: {
            ...state.annotationsByArticle,
            [state.currentArticleId]: state.annotationsByArticle[state.currentArticleId]
              .filter((ann) => ann.id !== tempId),
          },
          isSubmitting: false,
          error: response.error || "Failed to create annotation",
        }));
        return null;
      }
    } catch (error) {
      // Revert optimistic update
      set((state) => ({
        annotationsByArticle: {
          ...state.annotationsByArticle,
          [state.currentArticleId]: state.annotationsByArticle[state.currentArticleId]
            .filter((ann) => ann.id !== tempId),
        },
        isSubmitting: false,
        error: "Failed to create annotation",
      }));
      console.error("Error creating annotation:", error);
      return null;
    }
  },

  // Add reply to annotation
  addReply: async (annotationId: string, text: string) => {
    if (!text.trim()) return;

    try {
      const response = await handleCreateReply({
        annotationId,
        replyText: text,
      });
      
      if (response.success && response.data) {
        const newReply = response.data;
        // Update annotation with new reply
        set((state) => {
          const articleId = state.currentArticleId;
          const annotations = state.annotationsByArticle[articleId] || [];
          
          return {
            annotationsByArticle: {
              ...state.annotationsByArticle,
              [articleId]: annotations.map((ann) => {
                if (ann.id === annotationId) {
                  return {
                    ...ann,
                    replyCount: ann.replyCount + 1,
                    replies: [...(ann.replies || []), newReply],
                  };
                }
                return ann;
              }),
            },
          };
        });
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      set({ error: "Failed to add reply" });
    }
  },

  // Getters
  getAnnotationsForParagraph: (paragraphIndex: number) => {
    const state = get();
    const annotations = state.annotationsByArticle[state.currentArticleId] || [];
    return annotations.filter((ann) => ann.paragraphIndex === paragraphIndex);
  },

  getAnnotationsForCurrentArticle: () => {
    const state = get();
    return state.annotationsByArticle[state.currentArticleId] || [];
  },

  getHeatForParagraph: (paragraphIndex: number) => {
    const state = get();
    const annotations = state.annotationsByArticle[state.currentArticleId] || [];
    return annotations.filter((ann) => ann.paragraphIndex === paragraphIndex).length;
  },
}));

// Hook wrapper for using annotations with auto-fetch
export function useAnnotationsForArticle(articleId: string) {
  const store = useAnnotations();
  
  useEffect(() => {
    if (articleId && articleId !== store.currentArticleId) {
      store.setArticle(articleId);
    }
  }, [articleId, store]);

  const annotations = store.getAnnotationsForCurrentArticle();
  const createAnnotation = useCallback(
    (data: { type: AnnotationType; body: string }) => 
      store.createAnnotation(data),
    [store]
  );
  const addReply = useCallback(
    (annotationId: string, text: string) => 
      store.addReply(annotationId, text),
    [store]
  );
  const getAnnotationsForParagraph = useCallback(
    (index: number) => store.getAnnotationsForParagraph(index),
    [store]
  );

  return {
    annotations,
    isLoading: store.isLoading,
    error: store.error,
    createAnnotation,
    addReply,
    getAnnotationsForParagraph,
  };
}