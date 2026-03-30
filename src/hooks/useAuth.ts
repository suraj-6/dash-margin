import { create } from "zustand";
import { useEffect } from "react";
import type { User } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// Mock user for demo when Supabase is not configured
const MOCK_USER: User = {
  id: "user-1",
  name: "Rahul Verma",
  email: "rahul@example.com",
  bio: "Strategy @ McKinsey | Interested in network effects",
  depthLevel: 3,
  institution: "McKinsey",
  createdAt: "2024-09-15T00:00:00Z",
  stats: {
    articlesRead: 142,
    marginNotes: 47,
    conversationsSparked: 23,
  },
  readingInterests: ["Strategy", "Tech", "Psychology", "Economics"],
};

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  institution?: string;
  depth_level: number;
  articles_read: number;
  annotations_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  depthLevel: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: MOCK_USER, // Default to mock for demo
  profile: null,
  depthLevel: 3,
  isAuthenticated: true,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      if (!supabase) {
        // Mock mode
        await new Promise((r) => setTimeout(r, 800));
        set({ 
          user: MOCK_USER, 
          depthLevel: MOCK_USER.depthLevel,
          isAuthenticated: true, 
          isLoading: false 
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }

      if (data.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          const user: User = {
            id: profile.id,
            name: profile.full_name || "Anonymous",
            email: profile.email || email,
            bio: profile.bio || "",
            depthLevel: profile.depth_level,
            institution: profile.institution || "",
            createdAt: profile.created_at,
            stats: {
              articlesRead: profile.articles_read,
              marginNotes: profile.annotations_count,
              conversationsSparked: 0, // Calculate from replies
            },
            readingInterests: [], // Fetch from reading history
          };

          set({
            user,
            profile,
            depthLevel: profile.depth_level,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to sign in",
        isLoading: false 
      });
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true, error: null });

    try {
      if (!supabase) {
        // Mock mode
        await new Promise((r) => setTimeout(r, 800));
        set({ 
          user: MOCK_USER, 
          depthLevel: MOCK_USER.depthLevel,
          isAuthenticated: true, 
          isLoading: false 
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }

      if (data.user) {
        // Create profile
        const { data: profile } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email,
            full_name: fullName || "New User",
            depth_level: 0, // Start as Reader
            articles_read: 0,
            annotations_count: 0,
          })
          .select()
          .single();

        if (profile) {
          const user: User = {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            bio: "",
            depthLevel: 0,
            institution: "",
            createdAt: profile.created_at,
            stats: {
              articlesRead: 0,
              marginNotes: 0,
              conversationsSparked: 0,
            },
            readingInterests: [],
          };

          set({
            user,
            profile,
            depthLevel: 0,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error("Sign up error:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to sign up",
        isLoading: false 
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true });

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      set({
        user: null,
        profile: null,
        depthLevel: 0,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      set({ 
        error: "Failed to sign out",
        isLoading: false 
      });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user || !supabase) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const updatedUser: User = {
          ...user,
          bio: profile.bio || user.bio,
          depthLevel: profile.depth_level,
          institution: profile.institution || user.institution,
          stats: {
            articlesRead: profile.articles_read,
            marginNotes: profile.annotations_count,
            conversationsSparked: user.stats?.conversationsSparked || 0,
          },
        };

        set({
          user: updatedUser,
          profile,
          depthLevel: profile.depth_level,
        });
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  },

  checkSession: async () => {
    if (!supabase) {
      // Keep mock user in demo mode
      return;
    }

    set({ isLoading: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const user: User = {
            id: profile.id,
            name: profile.full_name || "Anonymous",
            email: profile.email || session.user.email || "",
            bio: profile.bio || "",
            depthLevel: profile.depth_level,
            institution: profile.institution || "",
            createdAt: profile.created_at,
            stats: {
              articlesRead: profile.articles_read,
              marginNotes: profile.annotations_count,
              conversationsSparked: 0,
            },
            readingInterests: [],
          };

          set({
            user,
            profile,
            depthLevel: profile.depth_level,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("Session check error:", error);
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));

// Auto-check session on mount
if (typeof window !== "undefined") {
  useAuth.getState().checkSession();
}

// Custom hook wrapper with auto-refresh
export function useAuthWithRefresh() {
  const state = useAuth();

  useEffect(() => {
    // Check session on mount
    state.checkSession();

    // Subscribe to auth changes if Supabase is configured
    if (supabase) {
      const { data: subscription } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session) {
            await state.checkSession();
          } else if (event === "SIGNED_OUT") {
            state.signOut();
          }
        }
      );

      return () => {
        subscription?.subscription.unsubscribe();
      };
    }
  }, []);

  return state;
}