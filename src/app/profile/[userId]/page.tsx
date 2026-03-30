import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, MessageSquareText, Sparkles, Pencil } from "lucide-react";
import { supabase, isSupabaseConfigured, fetchUserProfile } from "@/lib/supabase";
import { DEPTH_LEVEL_META, type DepthLevel } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

interface ProfileData {
  id: string;
  fullName: string;
  bio?: string;
  institution?: string;
  avatarUrl?: string;
  depthLevel: DepthLevel;
  stats: {
    articlesRead: number;
    marginNotes: number;
    conversationsSparked: number;
  };
  interests: string[];
}

interface ProfileAnnotation {
  id: string;
  articleTitle: string;
  highlightedText: string;
  annotationText: string;
  replyCount: number;
  qualityScore: number;
}

const MOCK_PROFILE: ProfileData = {
  id: "user-1",
  fullName: "Rahul Verma",
  bio: "Strategy @ McKinsey | Interested in network effects",
  institution: "McKinsey",
  avatarUrl: "",
  depthLevel: 3,
  stats: {
    articlesRead: 142,
    marginNotes: 47,
    conversationsSparked: 23,
  },
  interests: ["Strategy", "Technology", "Psychology", "Economics"],
};

const MOCK_ANNOTATIONS: ProfileAnnotation[] = [
  {
    id: "ann-1",
    articleTitle: "Network Effects in Knowledge Platforms",
    highlightedText: "The feedback loop between learning and contribution creates a quieter kind of scale.",
    annotationText:
      "This is where knowledge platforms diverge from social ones: the loop is slower, but compounding is deeper.",
    replyCount: 12,
    qualityScore: 92,
  },
  {
    id: "ann-2",
    articleTitle: "On the Architecture of Trust",
    highlightedText: "Communities form not from proximity, but from repeated acts of attention.",
    annotationText:
      "Trust here is earned through consistent signal, not volume. That changes how hierarchy should be designed.",
    replyCount: 8,
    qualityScore: 88,
  },
  {
    id: "ann-3",
    articleTitle: "The Quiet Flywheel",
    highlightedText: "Depth scales when the platform privileges interpretation over reaction.",
    annotationText:
      "This could be a design principle: slow the surface, accelerate the margin.",
    replyCount: 5,
    qualityScore: 83,
  },
  {
    id: "ann-4",
    articleTitle: "Ambient Intelligence",
    highlightedText: "The most useful systems are those that become a layer of cognition, not a source of noise.",
    annotationText:
      "Margins can be that layer if the incentive system is shaped around thoughtful curation.",
    replyCount: 4,
    qualityScore: 80,
  },
  {
    id: "ann-5",
    articleTitle: "Institutional Memory",
    highlightedText: "A platform’s long-term value is a function of what it helps its readers remember.",
    annotationText:
      "Annotations should be retrieval cues. That’s the compounding memory asset.",
    replyCount: 3,
    qualityScore: 76,
  },
  {
    id: "ann-6",
    articleTitle: "On the Architecture of Trust",
    highlightedText: "Attention is a scarce resource, but meaning is even scarcer.",
    annotationText:
      "Meaning scales only when readers treat the margin as a second draft of the article.",
    replyCount: 2,
    qualityScore: 72,
  },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [annotations, setAnnotations] = useState<ProfileAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = user?.id === profile?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setNotFound(false);

      if (!isSupabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 400));
        setProfile(MOCK_PROFILE);
        setAnnotations(MOCK_ANNOTATIONS);
        setIsLoading(false);
        return;
      }

      const { data: profileData, error } = await fetchUserProfile(user?.id ?? "");
      if (error || !profileData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data: annotationsData } = await supabase
        .from("annotations")
        .select("id, highlighted_text, annotation_text, quality_score, article_id, articles(title)")
        .eq("user_id", profileData.id)
        .order("quality_score", { ascending: false })
        .limit(12);

      const mappedAnnotations: ProfileAnnotation[] = ((annotationsData ?? []) as any[]).map((item) => {
        const articleTitle = Array.isArray(item.articles)
          ? item.articles[0]?.title
          : item.articles?.title;

        return {
          id: item.id,
          articleTitle: articleTitle ?? "Untitled",
          highlightedText: item.highlighted_text,
          annotationText: item.annotation_text,
          replyCount: Math.floor(Math.random() * 10) + 1,
          qualityScore: item.quality_score ?? 0,
        };
      });

      setProfile({
        id: profileData.id,
        fullName: profileData.full_name ?? "Unnamed",
        bio: profileData.bio ?? "",
        institution: profileData.institution ?? "",
        avatarUrl: profileData.avatar_url ?? "",
        depthLevel: (profileData.depth_level ?? 0) as DepthLevel,
        stats: {
          articlesRead: profileData.articles_read ?? 0,
          marginNotes: profileData.annotations_count ?? 0,
          conversationsSparked: Math.max(1, Math.floor((profileData.annotations_count ?? 0) / 2)),
        },
        interests: ["Strategy", "Technology", "Psychology"],
      });
      setAnnotations(mappedAnnotations);
      setIsLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  const bestAnnotations = useMemo(() => {
    return [...annotations].sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 6);
  }, [annotations]);

  const depthLabel = profile
    ? DEPTH_LEVEL_META[profile.depthLevel as DepthLevel].label
    : "";
  const nextLevel = profile ? (Math.min(4, profile.depthLevel + 1) as DepthLevel) : 0;
  const nextLevelLabel = profile ? DEPTH_LEVEL_META[nextLevel].label : "";

  if (isLoading) {
    return (
      <div className="bg-[#FAFAF8] pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <div className="h-28 rounded-2xl bg-[#F5F5F0] animate-pulse" />
          <div className="h-16 rounded-xl bg-[#F5F5F0] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-44 rounded-2xl bg-[#F5F5F0] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="bg-[#FAFAF8] pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <p className="font-['Playfair_Display'] text-3xl text-[#1a1a1a]">Profile not found</p>
          <p className="text-sm text-[#6B6B6B]">We couldn’t locate this reader’s intellectual fingerprint.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF8] pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex flex-col gap-8">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center gap-6"
          >
            <div className="h-20 w-20 rounded-full bg-[#E6E0D8] flex items-center justify-center text-xl font-semibold text-[#1a1a1a]">
              {profile.fullName
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-['Playfair_Display'] text-3xl text-[#1a1a1a]">
                  {profile.fullName}
                </h1>
                <span className="px-3 py-1 text-xs rounded-full bg-[#F5F5F0] text-[#1a1a1a]">
                  {depthLabel}
                </span>
              </div>
              <p className="text-sm text-[#4B4B4B]">{profile.bio}</p>
              <p className="text-sm text-[#6B6B6B]">{profile.institution}</p>
              {isOwnProfile && (
                <button className="inline-flex items-center gap-2 text-xs text-[#457B9D] hover:text-[#1a1a1a] transition">
                  <Pencil size={14} /> Edit bio
                </button>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[#6B6B6B]"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#E07A5F]" />
              <span>{profile.stats.articlesRead} articles read deeply</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#E07A5F]" />
              <span>{profile.stats.marginNotes} margin notes</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquareText size={16} className="text-[#E07A5F]" />
              <span>{profile.stats.conversationsSparked} conversations sparked</span>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-['Playfair_Display'] text-2xl text-[#1a1a1a]">
                Notable Margin Notes
              </h2>
              <button className="text-sm text-[#457B9D] hover:text-[#1a1a1a] transition">
                See all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bestAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="rounded-2xl border border-[#EFEFE8] bg-white/60 p-5 shadow-sm hover:shadow-md transition"
                >
                  <a
                    href="#"
                    className="text-sm text-[#457B9D] hover:text-[#1a1a1a] transition"
                  >
                    {annotation.articleTitle}
                  </a>
                  <p className="mt-3 text-sm text-[#6B6B6B] italic line-clamp-3">
                    “{annotation.highlightedText}”
                  </p>
                  <p className="mt-3 text-sm text-[#1a1a1a] line-clamp-3">
                    {annotation.annotationText}
                  </p>
                  <p className="mt-4 text-xs text-[#6B6B6B]">
                    {annotation.replyCount} replies
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-4"
          >
            <h2 className="font-['Playfair_Display'] text-2xl text-[#1a1a1a]">
              Reading Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full border border-[#E6E0D8] text-sm text-[#4B4B4B] bg-white/70"
                >
                  {interest}
                </span>
              ))}
            </div>
          </motion.section>

          {isOwnProfile && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-2xl border border-[#EFEFE8] bg-[#F5F5F0] p-5"
            >
              <p className="text-sm text-[#4B4B4B]">
                3 more quality annotations to reach {nextLevelLabel}
              </p>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
