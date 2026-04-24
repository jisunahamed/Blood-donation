// ============================================================
// Interaction Routes — Log contact copy
// ============================================================
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');

const router = Router();

// ── POST /api/interactions/copy ─────────────────────────────
router.post('/copy', [
  body('target_id').isUUID().withMessage('Valid target ID is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(', '), code: 'VALIDATION_ERROR' });
  }

  try {
    const { target_id } = req.body;
    const actorId = req.user.id;

    if (target_id === actorId) {
      return res.status(400).json({ success: false, message: 'Cannot copy your own contact', code: 'SELF_COPY' });
    }

    // 1. Insert into interactions
    const { error: intErr } = await supabase.from('interactions').insert({
      actor_id: actorId,
      target_id,
      action_type: 'contact_copied',
    });
    if (intErr) throw intErr;

    // 2. Upsert network_history (increment count if pair exists)
    const { data: existing } = await supabase
      .from('network_history')
      .select('id, contact_count')
      .eq('user_id', actorId)
      .eq('contact_id', target_id)
      .single();

    if (existing) {
      await supabase
        .from('network_history')
        .update({
          contact_count: existing.contact_count + 1,
          last_contact_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('network_history').insert({
        user_id: actorId,
        contact_id: target_id,
      });
    }

    // 3. Log activity
    await supabase.from('activity_log').insert({
      user_id: actorId,
      activity_type: 'contact_copied',
      reference_id: target_id,
      reference_type: 'profile',
      meta: { target_id },
    });

    // 4. Fetch target contact number
    const { data: target, error: targetErr } = await supabase
      .from('profiles')
      .select('contact_number')
      .eq('id', target_id)
      .single();

    if (targetErr || !target) {
      return res.status(404).json({ success: false, message: 'Target user not found', code: 'USER_NOT_FOUND' });
    }

    res.json({
      success: true,
      data: {
        contact_number: target.contact_number,
      },
    });
  } catch (err) {
    console.error('Copy contact error:', err);
    res.status(500).json({ success: false, message: err.message, code: 'INTERACTION_ERROR' });
  }
});

module.exports = router;
