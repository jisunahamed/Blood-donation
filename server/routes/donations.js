// ============================================================
// Donation Routes — Confirm Donation
// ============================================================
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');

const router = Router();

// ── POST /api/donations/confirm ─────────────────────────────
router.post('/confirm', [
  body('donor_id').isUUID().withMessage('Valid donor ID is required'),
  body('notes').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join(', '), code: 'VALIDATION_ERROR' });
  }

  try {
    const { donor_id, notes } = req.body;
    const recipientId = req.user.id;

    if (donor_id === recipientId) {
      return res.status(400).json({ success: false, message: 'Cannot confirm donation to yourself', code: 'SELF_DONATION' });
    }

    // Verify network_history pair exists (user must have copied contact first)
    const { data: networkRecord, error: netErr } = await supabase
      .from('network_history')
      .select('id')
      .eq('user_id', recipientId)
      .eq('contact_id', donor_id)
      .single();

    if (netErr || !networkRecord) {
      return res.status(400).json({
        success: false,
        message: 'You must copy the donor\'s contact first before confirming a donation',
        code: 'NO_PRIOR_CONTACT',
      });
    }

    // Verify donor is available
    const { data: donor, error: donorErr } = await supabase
      .from('profiles')
      .select('id, name, is_available')
      .eq('id', donor_id)
      .single();

    if (donorErr || !donor) {
      return res.status(404).json({ success: false, message: 'Donor not found', code: 'DONOR_NOT_FOUND' });
    }

    if (!donor.is_available) {
      return res.status(400).json({ success: false, message: 'Donor is currently unavailable', code: 'DONOR_UNAVAILABLE' });
    }

    // Insert donation (trigger fires automatically)
    const { data: donation, error: donErr } = await supabase
      .from('donations')
      .insert({
        donor_id,
        recipient_id: recipientId,
        donation_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (donErr) throw donErr;

    // Insert interaction record
    await supabase.from('interactions').insert({
      actor_id: recipientId,
      target_id: donor_id,
      action_type: 'donation_confirmed',
    });

    // Activity log for both parties
    await supabase.from('activity_log').insert([
      {
        user_id: donor_id,
        activity_type: 'donated_blood',
        reference_id: donation.id,
        reference_type: 'donation',
        meta: { recipient_id: recipientId },
      },
      {
        user_id: recipientId,
        activity_type: 'received_blood',
        reference_id: donation.id,
        reference_type: 'donation',
        meta: { donor_id },
      },
    ]);

    // Fetch updated donor profile
    const { data: updatedDonor } = await supabase
      .from('profiles')
      .select('id, name, blood_group, is_available, last_donation_date')
      .eq('id', donor_id)
      .single();

    res.json({ success: true, data: { donation, donor: updatedDonor } });
  } catch (err) {
    console.error('Donation confirm error:', err);
    res.status(500).json({ success: false, message: err.message, code: 'DONATION_ERROR' });
  }
});

module.exports = router;
