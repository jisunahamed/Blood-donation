// ============================================================
// User Routes — Profile CRUD + Dashboard Data
// ============================================================
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');

const router = Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(', '), code: 'VALIDATION_ERROR' });
  }
  next();
}

// ── GET /api/users/me ───────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, locations(id, name, zone)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'PROFILE_FETCH_ERROR' });
  }
});

// ── PUT /api/users/me ───────────────────────────────────────
router.put('/me', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('blood_group').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('contact_number').optional().trim().notEmpty(),
  body('location_id').optional().isUUID(),
  body('department').optional(),
  body('is_available').optional().isBoolean(),
], handleValidation, async (req, res) => {
  try {
    const allowedFields = ['name', 'blood_group', 'contact_number', 'location_id', 'department', 'is_available'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update', code: 'NO_UPDATE_FIELDS' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*, locations(id, name, zone)')
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      activity_type: 'profile_updated',
      reference_id: req.user.id,
      reference_type: 'profile',
      meta: { updated_fields: Object.keys(updates) },
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'PROFILE_UPDATE_ERROR' });
  }
});

// ── GET /api/users/me/dashboard ─────────────────────────────
router.get('/me/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Profile data
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('last_donation_date, last_received_date, is_available, blood_group, name')
      .eq('id', userId)
      .single();
    if (pErr) throw pErr;

    // Calculate days until available
    let days_until_available = 0;
    if (!profile.is_available && profile.last_donation_date) {
      const lastDonation = new Date(profile.last_donation_date);
      const availableDate = new Date(lastDonation);
      availableDate.setMonth(availableDate.getMonth() + 5);
      const diffMs = availableDate - new Date();
      days_until_available = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Network history (last 10)
    const { data: network, error: nErr } = await supabase
      .from('network_history')
      .select('*, contact:contact_id(id, name, blood_group)')
      .eq('user_id', userId)
      .order('last_contact_at', { ascending: false })
      .limit(10);
    if (nErr) throw nErr;

    // Activity log (last 20)
    const { data: activities, error: aErr } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (aErr) throw aErr;

    res.json({
      success: true,
      data: {
        name: profile.name,
        blood_group: profile.blood_group,
        last_donation_date: profile.last_donation_date,
        last_received_date: profile.last_received_date,
        is_available: profile.is_available,
        days_until_available,
        network_history: network || [],
        activity_log: activities || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'DASHBOARD_ERROR' });
  }
});

module.exports = router;
