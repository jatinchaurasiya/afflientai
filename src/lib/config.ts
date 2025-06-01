import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Picaos API configuration
export const PICAOS_CONFIG = {
  apiKey: import.meta.env.PICAOS_API_KEY,
  baseUrl: 'https://api.picaos.com/v1',
};

// Function to securely store API key in Supabase
export async function storePicaosApiKey(userId: string, apiKey: string) {
  try {
    const { error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: userId,
        service: 'picaos',
        api_key: apiKey,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
}

// Function to retrieve API key from Supabase
export async function getPicaosApiKey(userId: string) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('service', 'picaos')
      .single();

    if (error) throw error;
    return data?.api_key;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
}