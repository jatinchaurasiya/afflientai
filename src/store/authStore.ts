import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  initialized: false,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      set({ 
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        initialized: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Auth check error:', error);
      set({ 
        session: null,
        user: null,
        isAuthenticated: false,
        initialized: true,
        isLoading: false
      });
    }
  },

  signIn: async (email: string, password: string) => {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    set({ 
      session, 
      user: session?.user ?? null,
      isAuthenticated: !!session
    });
  },

  signUp: async (email: string, password: string) => {
    const { data: { session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { email_confirmed: true }
      }
    });

    if (error) throw error;

    set({ 
      session, 
      user: session?.user ?? null,
      isAuthenticated: !!session
    });
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ 
      session: null, 
      user: null,
      isAuthenticated: false 
    });
  }
}));

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({ 
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isLoading: false
  });
});

export default useAuthStore;