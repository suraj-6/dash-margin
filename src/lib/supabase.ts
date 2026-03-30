// ============================================================
// Supabase Client Configuration
// ============================================================
// In production, these come from environment variables.
// For the demo build, we use placeholder values and mock data.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- Helper: check if Supabase is configured ----------
export const isSupabaseConfigured = (): boolean =>
  supabaseUrl !== "https://placeholder.supabase.co";

// ---------- Auth helpers ----------
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ---------- Articles ----------
export async function fetchArticles() {
  return supabase.from("articles").select("*").order("created_at", { ascending: false });
}

export async function fetchArticleById(id: string) {
  return supabase.from("articles").select("*").eq("id", id).single();
}

// ---------- Annotations ----------
export async function fetchAnnotationsForArticle(articleId: string) {
  return supabase
    .from("annotations")
    .select("*, annotation_replies(*)")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });
}

export async function createAnnotation(payload: {
  article_id: string;
  user_id: string;
  paragraph_index: number;
  highlighted_text: string;
  annotation_text: string;
  annotation_type: "insight" | "question" | "challenge" | "connection";
}) {
  return supabase.from("annotations").insert(payload).select().single();
}

// ---------- User profile ----------
export async function fetchUserProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

// ---------- Quality scoring ----------
export async function fetchQualityScore(userId: string) {
  return supabase.from("quality_scores").select("*").eq("user_id", userId).single();
}
