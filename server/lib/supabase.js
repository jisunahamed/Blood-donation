// ============================================================
// Supabase Admin Client (service_role key — server only)
// ============================================================
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('SUPA')));
}

let supabase;
try {
  supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} catch (err) {
  console.error('Failed to create Supabase client:', err.message);
  // Create a dummy to prevent crash, routes will fail gracefully
  supabase = null;
}

module.exports = supabase;
