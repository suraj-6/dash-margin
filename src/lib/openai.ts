// ============================================================
// OpenAI Client — used for ML-powered features
// ============================================================
// Features:
//   1. Annotation quality scoring
//   2. Smart summarisation of margin threads
//   3. Reading path recommendations

import OpenAI from "openai";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // Demo only — in production, call via API routes
});

// ---------- Score an annotation for quality ----------
export async function scoreAnnotation(
  articleExcerpt: string,
  annotationText: string,
): Promise<{ score: number; feedback: string }> {
  if (!apiKey) {
    // Return mock score when API key is not configured
    return { score: 78, feedback: "Thoughtful annotation with good contextual awareness." };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an annotation quality scorer for an intellectual discourse platform called Margins. Score annotations on depth, originality, and relevance. Return JSON: {"score": 0-100, "feedback": "brief explanation"}`,
      },
      {
        role: "user",
        content: `Article excerpt: "${articleExcerpt}"\n\nAnnotation: "${annotationText}"`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 150,
  });

  const content = response.choices[0]?.message?.content ?? '{"score":50,"feedback":"Unable to score."}';
  return JSON.parse(content);
}

// ---------- Summarise a thread of annotations ----------
export async function summariseThread(
  annotations: string[],
): Promise<string> {
  if (!apiKey) {
    return "A rich conversation exploring multiple perspectives on this passage.";
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Summarise the following margin annotations into a concise 1-2 sentence summary capturing the key themes discussed.",
      },
      {
        role: "user",
        content: annotations.join("\n---\n"),
      },
    ],
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content ?? "Thread summary unavailable.";
}

// ---------- Recommend reading ----------
export async function recommendArticles(
  interests: string[],
  recentReads: string[],
): Promise<string[]> {
  if (!apiKey) {
    return ["Why Networks Win", "The Paradox of Choice in Markets", "Second-Order Thinking"];
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          'Suggest 3 article titles that would interest this reader. Return JSON: {"titles": ["...", "...", "..."]}',
      },
      {
        role: "user",
        content: `Interests: ${interests.join(", ")}\nRecent reads: ${recentReads.join(", ")}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 100,
  });

  const content = response.choices[0]?.message?.content ?? '{"titles":[]}';
  return JSON.parse(content).titles ?? [];
}
