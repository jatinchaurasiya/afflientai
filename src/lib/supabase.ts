import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced validation for Supabase configuration
if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
  throw new Error('Invalid or missing VITE_SUPABASE_URL. Please set the correct Supabase URL in your .env file.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error('Invalid or missing VITE_SUPABASE_ANON_KEY. Please set the correct Supabase anon key in your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  // Add error handling and retries for network issues
  global: {
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('Supabase fetch error:', err);
        throw new Error('Failed to connect to Supabase. Please check your internet connection and ensure your Supabase project is active.');
      });
    }
  }
});

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      data: null, 
      error: new Error('Unable to connect to authentication service. Please check your Supabase configuration and internet connection.') 
    };
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      },
    });
    return { data, error };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { 
      data: null, 
      error: new Error('Unable to connect to Google authentication. Please try again later.') 
    };
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          email_confirmed: true
        }
      }
    });

    if (!error && data.session) {
      // Set email_confirmed to true immediately after signup
      await supabase.auth.updateUser({
        data: { email_confirmed: true }
      });
    }

    return { data, error };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      data: null, 
      error: new Error('Unable to complete signup. Please check your internet connection and try again.') 
    };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { 
      error: new Error('Unable to sign out. Please try again later.') 
    };
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  } catch (error) {
    console.error('Get current user error:', error);
    return { 
      user: null, 
      error: new Error('Unable to fetch user information. Please try again later.') 
    };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  } catch (error) {
    console.error('Get session error:', error);
    return { 
      session: null, 
      error: new Error('Unable to fetch session information. Please try again later.') 
    };
  }
}