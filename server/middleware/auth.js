// ============================================================
// Auth Middleware — Verify Supabase JWT + Admin Guard
// ============================================================
const supabase = require('../lib/supabase');

/**
 * Extracts Bearer token, verifies it with Supabase,
 * fetches the profile, and attaches req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ success: false, message: 'User profile not found or deleted', code: 'PROFILE_NOT_FOUND' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      is_admin: profile.is_admin || false,
      profile,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Authentication error', code: 'AUTH_ERROR' });
  }
}

/**
 * Admin guard — must be used AFTER authenticate.
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ success: false, message: 'Admin access required', code: 'FORBIDDEN' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
