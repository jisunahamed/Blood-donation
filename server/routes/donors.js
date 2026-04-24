// ============================================================
// Donor Search Routes
// ============================================================
const { Router } = require('express');
const supabase = require('../lib/supabase');

const router = Router();

// ── GET /api/donors/search ──────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { blood_group, location_id } = req.query;

    let query = supabase
      .from('profiles')
      .select('id, blood_group, is_available, locations(name, zone), department')
      .eq('is_available', true)
      .is('deleted_at', null)
      .neq('id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (blood_group) {
      query = query.eq('blood_group', blood_group);
    }

    if (location_id) {
      query = query.eq('location_id', location_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map to include location_name for convenience
    const donors = (data || []).map(d => ({
      id: d.id,
      blood_group: d.blood_group,
      department: d.department,
      is_available: d.is_available,
      location_name: d.locations ? d.locations.name : 'Unknown',
      location_zone: d.locations ? d.locations.zone : 'Unknown',
    }));

    res.json({ success: true, data: donors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 'DONOR_SEARCH_ERROR' });
  }
});

module.exports = router;
