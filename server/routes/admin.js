// ============================================================
// Admin Routes — Full admin panel API
// ============================================================
const { Router } = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/auth');
const supabase = require('../lib/supabase');

const router = Router();

// All admin routes require admin privileges
router.use(requireAdmin);

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(', '), code: 'VALIDATION_ERROR' });
  }
  next();
}

// ── GET /api/admin/stats ────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    // Total users
    const { count: total_users } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Active donors
    const { count: active_donors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
      .is('deleted_at', null);

    // Total donations
    const { count: total_donations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true });

    // Donations this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: donations_this_month } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .gte('donation_date', startOfMonth.toISOString().split('T')[0]);

    res.json({
      success: true,
      data: {
        total_users: total_users || 0,
        active_donors: active_donors || 0,
        total_donations: total_donations || 0,
        donations_this_month: donations_this_month || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'STATS_ERROR' });
  }
});

// ── GET /api/admin/users ────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('profiles')
      .select('*, locations(name, zone)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: {
        users: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'USERS_FETCH_ERROR' });
  }
});

// ── GET /api/admin/users/:id ────────────────────────────────
router.get('/users/:id', [
  param('id').isUUID(),
], handleValidation, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*, locations(name, zone)')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Fetch activity log
    const { data: activities } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ success: true, data: { user, activities: activities || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'USER_DETAIL_ERROR' });
  }
});

// ── PUT /api/admin/users/:id/make-admin ─────────────────────
router.put('/users/:id/make-admin', [
  param('id').isUUID(),
  body('is_admin').isBoolean().withMessage('is_admin must be a boolean'),
], handleValidation, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { is_admin } = req.body;

    // Cannot modify self
    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own admin status', code: 'SELF_MODIFY' });
    }

    // Update profiles table
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ is_admin })
      .eq('id', targetId);
    if (profileErr) throw profileErr;

    // Update auth user_metadata
    const { error: authErr } = await supabase.auth.admin.updateUserById(targetId, {
      user_metadata: { is_admin },
    });
    if (authErr) throw authErr;

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      activity_type: is_admin ? 'granted_admin' : 'revoked_admin',
      reference_id: targetId,
      reference_type: 'profile',
      meta: { target_id: targetId, is_admin },
    });

    res.json({ success: true, data: { message: `Admin status ${is_admin ? 'granted' : 'revoked'} successfully` } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'ADMIN_UPDATE_ERROR' });
  }
});

// ── DELETE /api/admin/users/:id ─────────────────────────────
router.delete('/users/:id', [
  param('id').isUUID(),
], handleValidation, async (req, res) => {
  try {
    const targetId = req.params.id;

    // Cannot delete self
    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account', code: 'SELF_DELETE' });
    }

    // Soft delete — set deleted_at
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', targetId);

    if (error) throw error;

    // Log
    await supabase.from('activity_log').insert({
      user_id: req.user.id,
      activity_type: 'user_deleted',
      reference_id: targetId,
      reference_type: 'profile',
      meta: { target_id: targetId },
    });

    res.json({ success: true, data: { message: 'User deleted successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'DELETE_ERROR' });
  }
});

// ── GET /api/admin/donations ────────────────────────────────
router.get('/donations', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('donations')
      .select('*, donor:donor_id(name, blood_group), recipient:recipient_id(name, blood_group)', { count: 'exact' })
      .order('donation_date', { ascending: false })
      .range(from, to);

    if (req.query.from) {
      query = query.gte('donation_date', req.query.from);
    }
    if (req.query.to) {
      query = query.lte('donation_date', req.query.to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: {
        donations: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'DONATIONS_FETCH_ERROR' });
  }
});

// ── GET /api/admin/interactions ──────────────────────────────
router.get('/interactions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('interactions')
      .select('*, actor:actor_id(name), target:target_id(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        interactions: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'INTERACTIONS_FETCH_ERROR' });
  }
});

// ── GET /api/admin/activity ─────────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('activity_log')
      .select('*, user:user_id(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        activities: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'ACTIVITY_FETCH_ERROR' });
  }
});

// ── GET /api/admin/locations ────────────────────────────────
router.get('/locations', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'LOCATIONS_FETCH_ERROR' });
  }
});

// ── POST /api/admin/locations ───────────────────────────────
router.post('/locations', [
  body('name').trim().notEmpty().withMessage('Location name is required'),
  body('zone').trim().notEmpty().withMessage('Zone is required'),
], handleValidation, async (req, res) => {
  try {
    const { name, zone } = req.body;

    const { data, error } = await supabase
      .from('locations')
      .insert({ name, zone })
      .select()
      .single();

    if (error) {
      if (error.message.includes('duplicate')) {
        return res.status(409).json({ success: false, message: 'Location already exists', code: 'DUPLICATE_LOCATION' });
      }
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'LOCATION_CREATE_ERROR' });
  }
});

// ── PUT /api/admin/locations/:id ────────────────────────────
router.put('/locations/:id', [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('zone').optional().trim().notEmpty(),
  body('is_active').optional().isBoolean(),
], handleValidation, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.zone !== undefined) updates.zone = req.body.zone;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update', code: 'NO_UPDATE_FIELDS' });
    }

    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'LOCATION_UPDATE_ERROR' });
  }
});

// ── DELETE /api/admin/locations/:id ─────────────────────────
router.delete('/locations/:id', [
  param('id').isUUID(),
], handleValidation, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'LOCATION_DELETE_ERROR' });
  }
});

module.exports = router;
