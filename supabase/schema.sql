-- ============================================================
-- Blood Donation Platform — Supabase Schema
-- Run this in your Supabase SQL Editor FIRST
-- ============================================================

-- 1. LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  zone       TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (one row per auth.users entry)
CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  blood_group        TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  location_id        UUID REFERENCES locations(id),
  contact_number     TEXT NOT NULL,
  department         TEXT,
  is_available       BOOLEAN DEFAULT true,
  last_donation_date DATE,
  last_received_date DATE,
  is_admin           BOOLEAN DEFAULT false,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DONATIONS
CREATE TABLE IF NOT EXISTS donations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id      UUID NOT NULL REFERENCES profiles(id),
  recipient_id  UUID NOT NULL REFERENCES profiles(id),
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INTERACTIONS
CREATE TABLE IF NOT EXISTS interactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID NOT NULL REFERENCES profiles(id),
  target_id    UUID NOT NULL REFERENCES profiles(id),
  action_type  TEXT NOT NULL CHECK (action_type IN ('contact_copied','donation_confirmed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NETWORK HISTORY
CREATE TABLE IF NOT EXISTS network_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id),
  contact_id       UUID NOT NULL REFERENCES profiles(id),
  first_contact_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at  TIMESTAMPTZ DEFAULT NOW(),
  contact_count    INT DEFAULT 1,
  UNIQUE(user_id, contact_id)
);

-- 6. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  activity_type  TEXT NOT NULL,
  reference_id   UUID,
  reference_type TEXT,
  meta           JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles(blood_group, location_id, is_available);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_recipient ON donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_interactions_actor ON interactions(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);

-- ============================================================
-- TRIGGER 1 — After INSERT on donations
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_donation() RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
    SET last_donation_date = NEW.donation_date,
        is_available       = false,
        updated_at         = NOW()
    WHERE id = NEW.donor_id;

  UPDATE profiles
    SET last_received_date = NEW.donation_date,
        updated_at         = NOW()
    WHERE id = NEW.recipient_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_donation_insert ON donations;
CREATE TRIGGER on_donation_insert
  AFTER INSERT ON donations
  FOR EACH ROW EXECUTE FUNCTION handle_new_donation();

-- ============================================================
-- TRIGGER 2 — Auto-update updated_at on profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORED PROCEDURE — Reset donor availability after 5 months
-- ============================================================
CREATE OR REPLACE FUNCTION reset_donor_availability() RETURNS void AS $$
BEGIN
  UPDATE profiles
    SET is_available = true
    WHERE is_available = false
      AND last_donation_date < NOW() - INTERVAL '5 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can read profiles" ON profiles;
CREATE POLICY "anyone can read profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "user updates own profile" ON profiles;
CREATE POLICY "user updates own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "service inserts profiles" ON profiles;
CREATE POLICY "service inserts profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read active locations" ON locations;
CREATE POLICY "read active locations" ON locations FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "service manages locations" ON locations;
CREATE POLICY "service manages locations" ON locations FOR ALL USING (true);

-- Donations
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users see own donations" ON donations;
CREATE POLICY "users see own donations" ON donations FOR SELECT USING (donor_id = auth.uid() OR recipient_id = auth.uid());
DROP POLICY IF EXISTS "service inserts donations" ON donations;
CREATE POLICY "service inserts donations" ON donations FOR INSERT WITH CHECK (true);

-- Activity Log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users see own activity" ON activity_log;
CREATE POLICY "users see own activity" ON activity_log FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "service inserts activity" ON activity_log;
CREATE POLICY "service inserts activity" ON activity_log FOR INSERT WITH CHECK (true);

-- Interactions
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service manages interactions" ON interactions;
CREATE POLICY "service manages interactions" ON interactions FOR ALL USING (true);

-- Network History
ALTER TABLE network_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service manages network_history" ON network_history;
CREATE POLICY "service manages network_history" ON network_history FOR ALL USING (true);
