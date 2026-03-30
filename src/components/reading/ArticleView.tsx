import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronUp,
  Eye,
  Lock,
  MessageSquareQuote,
  Timer,
  X,
} from "lucide-react";
import { HighlightPopup } from "@/components/reading/HighlightPopup";
import { MarginAnnotation } from "@/components/reading/MarginAnnotation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAnnotations } from "@/hooks/useAnnotations";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useAuth } from "@/hooks/useAuth";
import type { AnnotationType, ArticleParagraph } from "@/lib/types";
import { ANNOTATION_TYPE_META } from "@/lib/types";
import { fetchArticleById, isSupabaseConfigured } from "@/lib/supabase";

const SAMPLE_ARTICLE_ID = "sample-article";

const SAMPLE_ARTICLE = {
  id: SAMPLE_ARTICLE_ID,
  title: "Higher-Dimensional Black Holes",
  subtitle:
    "We review black-hole solutions of higher-dimensional vacuum gravity and higher-dimensional supergravity theories.",
  author: "Physics Research",
  readTimeMinutes: 10,
  content: [
    "Classical general relativity in more than four spacetime dimensions has been the subject of increasing attention in recent years. Among the reasons it should be interesting to study this extension of Einstein’s theory, and in particular its black-hole solutions, we may mention that",
    "String theory contains gravity and requires more than four dimensions. In fact, the first successful statistical counting of black-hole entropy in string theory was performed for a five-dimensional black hole [229]. This example provides the best laboratory for the microscopic string theory of black holes.",
    "The AdS/CFT correspondence relates the dynamics of a d-dimensional black hole with those of a quantum field theory in d − 1 dimensions [187] (for a review see [1]).",
    "The production of higher-dimensional black holes in future colliders becomes a conceivable possibility in scenarios involving large extra dimensions and TeV-scale gravity [30, 155].",
    "As mathematical objects, black-hole spacetimes are among the most important Lorentzian Ricci-flat manifolds in any dimension.",
    "These, however, refer to applications of the subject — important though they are — but we believe that higher-dimensional gravity is also of intrinsic interest. Just as the study of quantum field theories, with a field content very different than any conceivable extension of the Standard Model, has been a very useful endeavor, throwing light on general features of quantum fields, we believe that endowing general relativity with a tunable parameter — namely the spacetime dimensionality d — should also lead to valuable insights into the nature of the theory, in particular into its most basic objects: black holes. For instance, four-dimensional black holes are known to have a number of remarkable features, such as uniqueness, spherical topology, dynamical stability, and to satisfy a set of simple laws — the laws of black hole mechanics. One would like to know which of these are peculiar to four-dimensions, and which hold more generally. At the very least, this study will lead to a deeper understanding of classical black holes and of what spacetime can do at its most extreme.",
    "There is a growing awareness that the physics of higher-dimensional black holes can be markedly different, and much richer, than in four dimensions. Arguably, two advances are largely responsible for this perception: the discovery of dynamical instabilities in extended black-hole horizons [118] and the discovery of black-hole solutions with horizons of nonspherical topology that are not fully characterized by their conserved charges [83]."
  ],
};

function useParagraphVisibility(paragraphCount: number, containerRef: React.RefObject<HTMLDivElement | null>) {
  const [visibleParagraphs, setVisibleParagraphs] = useState<number[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleParagraphs((current) => {
          const next = new Set(current);
          entries.forEach((entry) => {
            const index = Number((entry.target as HTMLElement).dataset.paragraphIndex);
            if (Number.isNaN(index)) return;
            if (entry.isIntersecting) next.add(index);
            else next.delete(index);
          });
          return Array.from(next).sort((a, b) => a - b);
        });
      },
      {
        root: null,
        threshold: 0.45,
      },
    );

    const nodes = root.querySelectorAll("[data-observed-paragraph='true']");
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [paragraphCount, containerRef]);

  return visibleParagraphs;
}


function MarginColumn() {
  const {
    selectedParagraphIndex,
    getAnnotationsForParagraph,
  } = useAnnotations();
  const { hasUnlockedAnnotations, timeSpent } = useReadingProgress();

  const isUnlocked = hasUnlockedAnnotations;
  const activeAnnotations = selectedParagraphIndex !== null
    ? getAnnotationsForParagraph(selectedParagraphIndex)
    : [];

  return (
    <aside className="relative h-full min-h-[40vh] border-l border-[#E8E6E1] bg-[#F5F5F0]">
      <div className="sticky top-[4.1rem] h-[calc(100vh-4.1rem)] overflow-y-auto px-5 py-6 md:px-6 lg:px-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A877F]">In the margins</p>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              {isUnlocked
                ? selectedParagraphIndex !== null
                  ? `Paragraph ${selectedParagraphIndex + 1}`
                  : "Choose a paragraph to open its conversation"
                : "Depth unlocks the conversation"}
            </p>
          </div>
          <div className="rounded-full border border-[#E1DBCF] bg-white/70 px-3 py-1 text-xs text-[#8A877F]">
            {isUnlocked ? "Unlocked" : `${Math.max(0, 30 - timeSpent)}s left`}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mt-10"
            >
              <Card className="rounded-[24px] border-[#E6DED1] bg-white/85 p-0 shadow-[0_20px_50px_rgba(26,26,26,0.05)] overflow-hidden">
                <div className="relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,250,248,0.35),rgba(245,245,240,0.85))] backdrop-blur-sm" />
                  <div className="space-y-4 p-6 opacity-55 blur-[1.5px]">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-2xl border border-[#ECE5D9] bg-[#FAFAF8] p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="h-6 w-6 rounded-full bg-[#E07A5F]/20" />
                          <div className="h-2.5 w-28 rounded-full bg-[#E7DFD3]" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2.5 rounded-full bg-[#EAE2D7]" />
                          <div className="h-2.5 w-11/12 rounded-full bg-[#EAE2D7]" />
                          <div className="h-2.5 w-7/12 rounded-full bg-[#EAE2D7]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative -mt-10 px-6 pb-6">
                  <div className="rounded-[22px] border border-[#E6DED1] bg-white px-5 py-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3 text-[#1a1a1a]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E07A5F]/10 text-[#E07A5F]">
                        <Lock size={18} />
                      </div>
                      <div>
                        <p className="font-serif text-xl">Keep reading to see what others think</p>
                        <p className="mt-1 text-sm text-[#6B6B6B]">
                          Annotations appear once you&apos;ve read for 30 seconds.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EFE9DE]">
                      <motion.div
                        className="h-full bg-[#E07A5F]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((timeSpent / 30) * 100, 100)}%` }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-[#8A877F]">
                      Reading first keeps the conversation earned, not merely accessed.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={`annotations-${selectedParagraphIndex ?? 'none'}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {selectedParagraphIndex === null ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E07A5F] shadow-sm">
                    <MessageSquareQuote size={22} />
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1a1a]">The conversation lives beside the text</h3>
                  <p className="mt-3 max-w-xs text-sm leading-7 text-[#6B6B6B]">
                    Hover a passage to notice its warmth. Click a paragraph to see the annotations it has attracted.
                  </p>
                </div>
              ) : activeAnnotations.length > 0 ? (
                activeAnnotations.map((annotation) => (
                  <MarginAnnotation
                    key={annotation.id}
                    annotation={annotation}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#DBD1C1] bg-white/70 px-6 py-10 text-center">
                  <p className="font-serif text-2xl text-[#1a1a1a]">A quiet margin</p>
                  <p className="mt-3 text-sm leading-7 text-[#6B6B6B]">
                    No notes here yet. Highlight a phrase and become the first reader to extend this paragraph.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function AnnotationModal() {
  const {
    isAnnotationModalOpen,
    highlightedText,
    createAnnotation,
    closeAnnotationModal,
    isSubmitting,
  } = useAnnotations();

  const [annotationType, setAnnotationType] = useState<AnnotationType>("insight");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (isAnnotationModalOpen) {
      setAnnotationType("insight");
      setBody("");
    }
  }, [isAnnotationModalOpen]);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    const created = await createAnnotation({
      type: annotationType,
      body,
    });

    if (created) {
      setBody("");
      setAnnotationType("insight");
    }
  };

  return (
    <AnimatePresence>
      {isAnnotationModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/15 backdrop-blur-[2px]"
            onClick={closeAnnotationModal}
          />

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="fixed right-6 top-24 z-[100] hidden w-[min(32rem,calc(100vw-3rem))] md:block"
          >
            <Card className="rounded-[28px] border-[#E8E0D3] bg-white p-0 shadow-[0_30px_80px_rgba(26,26,26,0.12)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EEE7DB] px-6 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A877F]">New annotation</p>
                  <p className="mt-1 font-serif text-2xl text-[#1a1a1a]">Add to Margins</p>
                </div>
                <button
                  onClick={closeAnnotationModal}
                  className="rounded-full p-2 text-[#8A877F] transition-colors hover:bg-[#F5F5F0] hover:text-[#1a1a1a]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="rounded-2xl border border-[#EEE7DB] bg-[#FAFAF8] px-4 py-4">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#8A877F]">Highlighted text</p>
                  <p className="font-serif text-[15px] leading-7 text-[#6B675E] italic">
                    &ldquo;{highlightedText}&rdquo;
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs text-[#8A877F]">Choose a note type</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(ANNOTATION_TYPE_META) as [AnnotationType, (typeof ANNOTATION_TYPE_META)[AnnotationType]][]).map(
                      ([key, meta]) => (
                        <button
                          key={key}
                          onClick={() => setAnnotationType(key)}
                          className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                            annotationType === key
                              ? "border-[#E07A5F] bg-[#E07A5F] text-white"
                              : "border-[#E4DCCD] bg-white text-[#6B6B6B] hover:border-[#E07A5F]/40"
                          }`}
                        >
                          {meta.icon} {meta.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value.slice(0, 280))}
                    placeholder="What did this make you think?"
                    className="h-32 w-full resize-none border-0 border-b border-[#E5DED2] bg-transparent px-0 py-3 text-sm leading-7 text-[#1a1a1a] outline-none placeholder:text-[#AAA39A] focus:border-[#E07A5F]"
                  />
                  <div className="mt-2 text-right text-xs text-[#8A877F]">{body.length}/280</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#EEE7DB] px-6 py-4">
                <button
                  onClick={closeAnnotationModal}
                  className="text-sm text-[#7D7972] transition-colors hover:text-[#1a1a1a]"
                >
                  Cancel
                </button>
                <Button variant="accent" size="md" isLoading={isSubmitting} disabled={!body.trim()} onClick={handleSubmit}>
                  Add to Margins
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 bottom-0 z-[100] md:hidden"
          >
            <Card className="rounded-t-[28px] border-[#E8E0D3] bg-white p-0 shadow-[0_-20px_60px_rgba(26,26,26,0.14)] overflow-hidden">
              <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-[#DED5C8]" />
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-serif text-2xl text-[#1a1a1a]">Add to Margins</p>
                <button onClick={closeAnnotationModal} className="rounded-full p-2 text-[#8A877F] hover:bg-[#F5F5F0]">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
                <div className="rounded-2xl border border-[#EEE7DB] bg-[#FAFAF8] px-4 py-4">
                  <p className="font-serif text-[15px] leading-7 text-[#6B675E] italic">&ldquo;{highlightedText}&rdquo;</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(Object.entries(ANNOTATION_TYPE_META) as [AnnotationType, (typeof ANNOTATION_TYPE_META)[AnnotationType]][]).map(
                    ([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => setAnnotationType(key)}
                        className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                          annotationType === key
                            ? "border-[#E07A5F] bg-[#E07A5F] text-white"
                            : "border-[#E4DCCD] bg-white text-[#6B6B6B]"
                        }`}
                      >
                        {meta.icon} {meta.label}
                      </button>
                    ),
                  )}
                </div>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value.slice(0, 280))}
                  placeholder="What did this make you think?"
                  className="mt-4 h-28 w-full resize-none border-0 border-b border-[#E5DED2] bg-transparent px-0 py-3 text-sm leading-7 text-[#1a1a1a] outline-none placeholder:text-[#AAA39A] focus:border-[#E07A5F]"
                />
                <div className="mt-2 text-right text-xs text-[#8A877F]">{body.length}/280</div>
                <div className="mt-5 flex items-center justify-between">
                  <button onClick={closeAnnotationModal} className="text-sm text-[#7D7972]">Cancel</button>
                  <Button variant="accent" size="md" isLoading={isSubmitting} disabled={!body.trim()} onClick={handleSubmit}>
                    Add to Margins
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ArticleView() {
  const { user } = useAuth();
  const articleId = SAMPLE_ARTICLE_ID;
  const article = SAMPLE_ARTICLE;
  const articleColumnRef = useRef<HTMLDivElement>(null);
  const [hoveredParagraphIndex, setHoveredParagraphIndex] = useState<number | null>(null);
  const [mobileMarginsOpen, setMobileMarginsOpen] = useState(false);
  const [loadedFromSupabase, setLoadedFromSupabase] = useState(false);

  const {
    selectedParagraphIndex,
    highlightRange,
    setArticle,
    setSelectedParagraphIndex,
    setHighlightedSelection,
    openAnnotationModal,
    getHeatForParagraph,
    scrollDepth,
    isAnnotationModalOpen,
  } = useAnnotations();

  const { hasUnlockedAnnotations, timeSpent } = useReadingProgress(articleId);

  const visibleParagraphs = useParagraphVisibility(article.content.length, articleColumnRef);
  const focusedParagraphIndex = useMemo(() => {
    if (selectedParagraphIndex !== null) return selectedParagraphIndex;
    if (hoveredParagraphIndex !== null) return hoveredParagraphIndex;
    return visibleParagraphs[0] ?? 0;
  }, [hoveredParagraphIndex, selectedParagraphIndex, visibleParagraphs]);

  useEffect(() => {
    setArticle(articleId);
  }, [articleId, setArticle]);

  useEffect(() => {
    let ignore = false;

    async function tryFetchArticle() {
      if (!isSupabaseConfigured() || articleId === SAMPLE_ARTICLE_ID) return;
      const { data } = await fetchArticleById(articleId);
      if (!ignore && data) setLoadedFromSupabase(true);
    }

    tryFetchArticle();
    return () => {
      ignore = true;
    };
  }, [articleId]);

  useEffect(() => {
    const clearSelectionOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHighlightedSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    window.addEventListener("keydown", clearSelectionOnEscape);
    return () => window.removeEventListener("keydown", clearSelectionOnEscape);
  }, [setHighlightedSelection]);

  const handleMouseUp = useCallback(() => {
    if (isAnnotationModalOpen) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setHighlightedSelection(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 4) {
      setHighlightedSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const element = range.commonAncestorContainer instanceof HTMLElement
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    const paragraphElement = element?.closest("[data-paragraph-id]") as HTMLElement | null;

    if (!paragraphElement) {
      setHighlightedSelection(null);
      return;
    }

    const paragraphId = paragraphElement.dataset.paragraphId ?? "";
    const paragraphIndex = Number(paragraphElement.dataset.paragraphIndex ?? -1);
    const rect = range.getBoundingClientRect();

    setHighlightedSelection({
      text,
      x: rect.left + rect.width / 2 - 78,
      y: rect.top + window.scrollY - 48,
      paragraphId,
      paragraphIndex,
    });
  }, [setHighlightedSelection, isAnnotationModalOpen]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    if (selectedParagraphIndex !== null) {
      setMobileMarginsOpen(true);
    }
  }, [selectedParagraphIndex]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1a1a1a]">

      <div className="fixed left-0 right-0 top-16 z-40 h-[2px] bg-[#ECE7DD]">
        <motion.div
          className="h-full bg-[#E07A5F]"
          animate={{ width: `${scrollDepth}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 border-b border-[#E8E2D7] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A877F]">Reading view</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.03em] md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 max-w-2xl font-serif text-lg leading-8 text-[#68645D] italic">
              {article.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#7A766F]">
              <span className="rounded-full bg-[#E07A5F]/10 px-3 py-1 text-[#E07A5F]">{article.author}</span>
              <span>•</span>
              <span>{article.readTimeMinutes} min read</span>
              <span>•</span>
              <span>{loadedFromSupabase ? "Loaded from Supabase" : "Sample article"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#6B6B6B]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E3DDD0] bg-white px-3 py-2">
              <Eye size={15} />
              {Math.round(scrollDepth)}% read
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E3DDD0] bg-white px-3 py-2">
              <Timer size={15} />
              Gate unlocks after 30s
            </div>
          </div>
        </div>

        <div className="grid items-start gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
          <section ref={articleColumnRef} className="relative px-1 pr-0 lg:pr-12">
            <div className="space-y-10">
              {article.content.map((content, index) => {
                const paragraph: ArticleParagraph = {
                  id: `p-${index + 1}`,
                  type: "paragraph",
                  content,
                };
                const heat = getHeatForParagraph(index);
                const isFocused = focusedParagraphIndex === index;

                return (
                  <div
                    key={paragraph.id}
                    data-observed-paragraph="true"
                    data-paragraph-id={paragraph.id}
                    data-paragraph-index={index}
                    className="group relative"
                    onMouseEnter={() => setHoveredParagraphIndex(index)}
                    onMouseLeave={() => setHoveredParagraphIndex((current) => (current === index ? null : current))}
                  >
                    <button
                      aria-label={`Open annotations for paragraph ${index + 1}`}
                      onClick={() => setSelectedParagraphIndex(index)}
                      className={`absolute -right-4 top-2 hidden h-4 w-4 rounded-full transition-all lg:block ${
                        heat > 0 ? "opacity-100" : "opacity-30"
                      } ${isFocused ? "scale-125" : "group-hover:scale-110"}`}
                      style={{
                        backgroundColor:
                          heat >= 3 ? "#E07A5F" : heat === 2 ? "rgba(224,122,95,0.65)" : heat === 1 ? "rgba(224,122,95,0.35)" : "rgba(224,122,95,0.18)",
                        boxShadow: isFocused ? "0 0 0 8px rgba(224,122,95,0.08)" : "none",
                      }}
                    />

                    <p
                      onClick={() => setSelectedParagraphIndex(index)}
                      className={`cursor-text rounded-2xl px-0 py-1 font-serif text-[18px] leading-[1.9] text-[#1F1D1A] transition-all duration-200 md:text-[20px] ${
                        isFocused ? "bg-[#E07A5F]/[0.045] lg:-mx-5 lg:px-5" : ""
                      }`}
                    >
                      {paragraph.content}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 border-t border-[#E8E2D7] pt-8 text-sm text-[#8A877F]">
              <p className="font-serif italic">The best conversations happen after a careful first reading.</p>
            </div>
          </section>

          <div className="hidden lg:block">
            <MarginColumn />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E8E2D7] bg-[#FAFAF8]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileMarginsOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-[#E4DCCF] bg-white px-4 py-3 text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E07A5F]/10 text-[#E07A5F]">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">Margins</p>
              <p className="text-xs text-[#7A766F]">
                {hasUnlockedAnnotations
                  ? selectedParagraphIndex !== null
                    ? `Paragraph ${selectedParagraphIndex + 1} conversation`
                    : "Open annotations"
                  : `${Math.max(0, 30 - timeSpent)}s of reading left`}
              </p>
            </div>
          </div>
          <ChevronUp size={18} className="text-[#7A766F]" />
        </button>
      </div>

      <AnimatePresence>
        {mobileMarginsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/10 lg:hidden"
              onClick={() => setMobileMarginsOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-hidden rounded-t-[28px] border-t border-[#E6DED1] bg-[#F5F5F0] lg:hidden"
            >
              <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-[#D9D0C3]" />
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-serif text-2xl text-[#1a1a1a]">In the margins</p>
                <button
                  onClick={() => setMobileMarginsOpen(false)}
                  className="rounded-full p-2 text-[#7A766F] hover:bg-white/70"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[72vh] overflow-y-auto">
                <MarginColumn />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <HighlightPopup
        visible={!!highlightRange}
        x={highlightRange?.x ?? 0}
        y={highlightRange?.y ?? 0}
        onAddToMargins={() => openAnnotationModal()}
      />

        <AnnotationModal />

      {!user && (
        <div className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#1a1a1a] px-4 py-2 text-sm text-white shadow-lg">
          Sign in to add notes in the margins.
        </div>
      )}
    </div>
  );
}
