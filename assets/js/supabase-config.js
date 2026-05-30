import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1) Paste your Supabase Project URL here.
// Supabase dashboard: Project Settings → API → Project URL
export const SUPABASE_URL = 'https://aovikqmgarbvrssoxpqh.supabase.co';

// 2) Paste your Supabase anon/public key here.
// Supabase dashboard: Project Settings → API → Project API keys → anon public
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdmlrcW1nYXJidnJzc294cHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTQ4NDEsImV4cCI6MjA5NTczMDg0MX0.A2dwDwUpwk2db9wVkG2YiUoriLAmFX1y3oU-hOhfcgI';

// 3) This is the fallback/redirect URL used after email confirmation.
// In Supabase dashboard add the same URL in Authentication → URL Configuration → Redirect URLs.
// Local example: http://127.0.0.1:5500/login.html
// Vercel example: https://your-domain.vercel.app/login.html
export const AUTH_REDIRECT_URL = `${window.location.origin}/login.html`;

// 4) Password reset redirect URL. Add this URL in Supabase Authentication → URL Configuration → Redirect URLs.
// Local example: http://127.0.0.1:5500/reset-password.html
// Vercel example: https://your-domain.vercel.app/reset-password.html
export const PASSWORD_RESET_REDIRECT_URL = `${window.location.origin}/reset-password.html`;

const missingConfig =
  SUPABASE_URL.includes('PASTE_') ||
  SUPABASE_ANON_KEY.includes('PASTE_');

if (missingConfig) {
  console.warn('Supabase is not configured yet. Open assets/js/supabase-config.js and add your Project URL + anon key.');
}

export const supabase = createClient(
  missingConfig ? 'https://example.supabase.co' : SUPABASE_URL,
  missingConfig ? 'anon-key-not-configured' : SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);
