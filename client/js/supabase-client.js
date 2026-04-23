// ============================================================
// Supabase Anon Client — safe for frontend
// ============================================================
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getSession() {
  return supabaseClient.auth.getSession();
}

function getAccessToken() {
  return getSession().then(({ data }) => data?.session?.access_token || null);
}

function onAuthStateChange(cb) {
  supabaseClient.auth.onAuthStateChange(cb);
}
