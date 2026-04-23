// ============================================================
// Supabase Anon Client — safe for frontend
// ============================================================
const SUPABASE_URL = 'https://zbrksmpygnifnzjboiso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicmtzbXB5Z25pZm56amJvaXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzA5ODIsImV4cCI6MjA5MjU0Njk4Mn0.zuM7A4waeyyEzsEKLzxgJPggIsaVc1IGAfrRZzGczGw';

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
