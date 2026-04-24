// ============================================================
// Auth Routes — Register, Login, Logout
// ============================================================
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../lib/supabase');

const router = Router();

// Rate limit: 10 requests per minute on auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later', code: 'RATE_LIMIT' },
});

router.use(authLimiter);

// ── Validation helpers ──────────────────────────────────────
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood group is required'),
  body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
  body('location_id').isUUID().withMessage('Valid location is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join(', '),
      code: 'VALIDATION_ERROR',
    });
  }
  next();
}

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, name, blood_group, location_id, contact_number, department } = req.body;

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, is_admin: false },
    });

    if (authError) {
      const status = authError.message.includes('already') ? 409 : 400;
      return res.status(status).json({ success: false, message: authError.message, code: 'AUTH_SIGNUP_ERROR' });
    }

    const userId = authData.user.id;

    // 2. Insert profile row
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name,
        blood_group,
        location_id,
        contact_number,
        department: department || null,
        is_admin: false,
      })
      .select()
      .single();

    if (profileError) {
      // Roll back: delete the auth user
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // 3. Sign in to get a session for the newly created user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return res.status(201).json({
        success: true,
        data: { profile, session: null, message: 'Account created. Please log in.' },
      });
    }

    // 4. Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      activity_type: 'account_created',
      reference_id: userId,
      reference_type: 'profile',
      meta: { email },
    });

    res.status(201).json({
      success: true,
      data: { session: signInData.session, profile },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed', code: 'REGISTER_ERROR' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', code: 'LOGIN_ERROR' });
    }

    // 2. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, locations(name, zone)')
      .eq('id', authData.user.id)
      .is('deleted_at', null)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, message: 'Profile not found or account deleted', code: 'PROFILE_NOT_FOUND' });
    }

    res.json({
      success: true,
      data: { session: authData.session, profile },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed', code: 'LOGIN_ERROR' });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    // Client-side handles session clearing; this is optional server acknowledgement
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed', code: 'LOGOUT_ERROR' });
  }
});

// ── POST /api/auth/complete-profile ─────────────────────────
router.post('/complete-profile', [
  body('blood_group').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood group is required'),
  body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
  body('location_id').isUUID().withMessage('Valid location is required'),
  body('department').optional(),
], handleValidationErrors, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing token', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token', code: 'UNAUTHORIZED' });
    }

    const { blood_group, contact_number, location_id, department } = req.body;

    // Check if profile already exists
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Profile already exists', code: 'PROFILE_EXISTS' });
    }

    const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown User';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: name,
        blood_group,
        location_id,
        contact_number,
        department: department || null,
        is_admin: false,
      })
      .select('*, locations(name, zone)')
      .single();

    if (profileError) throw profileError;

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: 'account_created',
      reference_id: user.id,
      reference_type: 'profile',
      meta: { email: user.email, provider: 'oauth' },
    });

    res.json({ success: true, data: { profile } });
  } catch (err) {
    console.error('Complete profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete profile', code: 'COMPLETE_PROFILE_ERROR' });
  }
});

module.exports = router;
