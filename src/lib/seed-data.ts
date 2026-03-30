import type { SupabaseClient } from "@supabase/supabase-js";

const sampleArticle = {
  title: "The Network Effects of Knowledge Platforms",
  subtitle: "Depth over virality, context over noise",
  author_name: "Margins Team",
  content: `Knowledge platforms aren’t social networks with a new coat of paint. They are carefully curated spaces where the act of reading itself becomes a shared ritual, guided by margins filled with intelligence and restraint. Here, the conversation happens beside the text, not above it.

Engagement-optimized platforms teach people to chase distraction. The incentive is always to grab the eye, a swipe, a tap. The problem is the fidelity of those interactions — most of them barely survive being remembered. Depth, in contrast, is about slow, attentive consumption that resists the urge to monetize every impression.

When you center depth, the network effects shift. Virality rewards the loudest voices; knowledge platforms reward the most thoughtful ones. Each annotation, each marginal note, becomes a signal, a breadcrumb, that draws others back to the same paragraph without needing a headline.

Context is the quiet guardian of meaning. A quote without context is a meme. A note in the margin is a conversation starter that says: I read this slowly, and I’m willing to explain why. That context becomes the connective tissue between readers, authors, and idea graphs that remember nuance.

Earning voice changes participation dynamics in the best way. Voice isn’t automatic; it is reserved for those who have demonstrated the humility to listen, the discipline to highlight, and the generosity to respond with clarity. It turns borderless platforms into societies with a sense of responsibility.

We build for understanding, not attention. The future of knowledge platforms is about attracting readers who stay, annotate, and amplify the parts that matter. That is the network effect we’re after.
`,
  read_time_minutes: 7,
};

const sampleAnnotations = [
  {
    id: "ann-sample-1",
    paragraph_index: 0,
    highlighted_text:
      "This reminds me of how academic journals work — the value isn't in reach, it's in the quality of peer engagement. Same principle, different medium.",
    annotation_text:
      "This reminds me of how academic journals work — the value isn't in reach, it's in the quality of peer engagement. Same principle, different medium.",
    annotation_type: "insight",
    quality_score: 86,
  },
  {
    id: "ann-sample-2",
    paragraph_index: 0,
    highlighted_text:
      "How do you measure 'depth' without it becoming just another metric to game? The moment you quantify it, people optimize for the metric.",
    annotation_text:
      "How do you measure 'depth' without it becoming just another metric to game? The moment you quantify it, people optimize for the metric.",
    annotation_type: "question",
    quality_score: 78,
  },
  {
    id: "ann-sample-3",
    paragraph_index: 1,
    highlighted_text:
      "I'd push back slightly here — engagement optimization isn't inherently bad. The problem is engagement without context. Twitter threads can actually be quite deep when they work.",
    annotation_text:
      "I'd push back slightly here — engagement optimization isn't inherently bad. The problem is engagement without context. Twitter threads can actually be quite deep when they work.",
    annotation_type: "challenge",
    quality_score: 82,
  },
  {
    id: "ann-sample-4",
    paragraph_index: 2,
    highlighted_text:
      "This connects to Simon Sinek's idea of finite vs infinite games. Engagement platforms play finite games (maximize clicks). Knowledge platforms should play infinite games (maximize understanding over time).",
    annotation_text:
      "This connects to Simon Sinek's idea of finite vs infinite games. Engagement platforms play finite games (maximize clicks). Knowledge platforms should play infinite games (maximize understanding over time).",
    annotation_type: "connection",
    quality_score: 88,
  },
  {
    id: "ann-sample-5",
    paragraph_index: 3,
    highlighted_text:
      "The key insight here is that knowledge compounds when every annotation remembers the context that birthed it, creating a lineage of insight rather than viral fragments.",
    annotation_text:
      "The key insight here is that knowledge compounds when every annotation remembers the context that birthed it, creating a lineage of insight rather than viral fragments.",
    annotation_type: "insight",
    quality_score: 90,
  },
  {
    id: "ann-sample-6",
    paragraph_index: 3,
    highlighted_text:
      "How do you prevent echo chambers in a depth-focused platform? If voice is earned, how do you ensure it isn’t hoarded by the same few people?",
    annotation_text:
      "How do you prevent echo chambers in a depth-focused platform? If voice is earned, how do you ensure it isn’t hoarded by the same few people?",
    annotation_type: "question",
    quality_score: 72,
  },
  {
    id: "ann-sample-7",
    paragraph_index: 4,
    highlighted_text:
      "This is why academic peer review works. It’s not because reviewers are loud, it’s because they stay with a passage and explain what they saw and why.",
    annotation_text:
      "This is why academic peer review works. It’s not because reviewers are loud, it’s because they stay with a passage and explain what they saw and why.",
    annotation_type: "insight",
    quality_score: 89,
  },
  {
    id: "ann-sample-8",
    paragraph_index: 4,
    highlighted_text:
      "I wonder if this creates a new kind of gatekeeping — only those who know the secret handshake can contribute. How do you keep the margins open?",
    annotation_text:
      "I wonder if this creates a new kind of gatekeeping — only those who know the secret handshake can contribute. How do you keep the margins open?",
    annotation_type: "challenge",
    quality_score: 73,
  },
  {
    id: "ann-sample-9",
    paragraph_index: 5,
    highlighted_text:
      "Beautifully said. The future belongs to platforms that prove they are built for understanding, not attention.",
    annotation_text:
      "Beautifully said. The future belongs to platforms that prove they are built for understanding, not attention.",
    annotation_type: "insight",
    quality_score: 92,
  },
  {
    id: "ann-sample-10",
    paragraph_index: 5,
    highlighted_text:
      "This reminds me of the slow food movement — quality takes time, but it is transformative when you honor that pace.",
    annotation_text:
      "This reminds me of the slow food movement — quality takes time, but it is transformative when you honor that pace.",
    annotation_type: "connection",
    quality_score: 80,
  },
];

const sampleUsers = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "priya@margins.app",
    full_name: "Priya Sharma",
    avatar_url: "https://i.pravatar.cc/80?img=1",
    institution: "IIM-A",
    depth_level: 3,
    bio: "Strategy consultant exploring the knowledge economy.",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "arjun@margins.app",
    full_name: "Arjun Menon",
    avatar_url: "https://i.pravatar.cc/80?img=2",
    institution: "McKinsey",
    depth_level: 3,
    bio: "Digital strategist focused on platform depth.",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "sarah@margins.app",
    full_name: "Sarah Kaur",
    avatar_url: "https://i.pravatar.cc/80?img=3",
    institution: "LSE",
    depth_level: 3,
    bio: "Professor of media and communication studies.",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "vikram@margins.app",
    full_name: "Vikram Ramesh",
    avatar_url: "https://i.pravatar.cc/80?img=4",
    institution: "Google",
    depth_level: 2,
    bio: "Product leader building internal knowledge platforms.",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    email: "rahul@margins.app",
    full_name: "Rahul Verma",
    avatar_url: "https://i.pravatar.cc/80?img=5",
    institution: "McKinsey",
    depth_level: 2,
    bio: "Associate with a passion for rigorous conversations.",
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    email: "ananya@margins.app",
    full_name: "Ananya Singh",
    avatar_url: "https://i.pravatar.cc/80?img=6",
    institution: "XLRI",
    depth_level: 1,
    bio: "MBA candidate studying platform policy.",
  },
];

export async function seedDatabase(supabase: SupabaseClient) {
  if (!supabase) {
    throw new Error("Supabase client is required to seed the database.");
  }

  await supabase.from("profiles").upsert(sampleUsers);

  const { data: existingArticle } = await supabase
    .from("articles")
    .select("id")
    .eq("title", sampleArticle.title)
    .maybeSingle();

  let articleId = existingArticle?.id;

  if (!articleId) {
    const { data: inserted } = await supabase
      .from("articles")
      .insert(sampleArticle)
      .select("id")
      .single();
    articleId = inserted?.id;
  }

  if (!articleId) {
    throw new Error("Unable to seed the sample article.");
  }

  const annotationsToInsert = sampleAnnotations.map((annotation, index) => ({
    ...annotation,
    article_id: articleId,
    user_id: sampleUsers[index % sampleUsers.length].id,
  }));

  await supabase
    .from("annotations")
    .upsert(annotationsToInsert, { onConflict: "id" });
  return { articleId, articleTitle: sampleArticle.title };
}
