import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1) Paste your Supabase Project URL here.
// Supabase dashboard: Project Settings → API → Project URL
export const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_PROJECT_URL_HERE';

// 2) Paste your Supabase anon/public key here.
// Supabase dashboard: Project Settings → API → Project API keys → anon public
export const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';

// 3) This is the fallback/redirect URL used after email confirmation.
// In Supabase dashboard add the same URL in Authentication → URL Configuration → Redirect URLs.
// Local example: http://127.0.0.1:5500/login.html
// Vercel example: https://your-domain.vercel.app/login.html
export const AUTH_REDIRECT_URL = `${window.location.origin}/login.html`;

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
