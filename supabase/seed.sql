-- ============================================================
-- Blood Donation Platform — Seed Data
-- Run AFTER schema.sql
-- ============================================================
-- NOTE:
--   Users must be created via Supabase Auth (signUp).
--   This file seeds only the locations table.
--   After creating users through the app or Supabase dashboard,
--   insert their profiles manually or via the registration flow.
--
--   For the admin user:
--     1. Register admin@blooddonation.com / Admin@1234 via the app
--     2. Then run the admin promotion queries below
-- ============================================================

-- Seed 3 locations
INSERT INTO locations (name, zone) VALUES
  ('Inside Dhaka',  'Dhaka'),
  ('Mirpur',        'Dhaka'),
  ('Chittagong',    'Outside Dhaka')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- AFTER registering users through the app, you can promote
-- the admin user with:
--
--   UPDATE profiles SET is_admin = true
--     WHERE id = (SELECT id FROM profiles WHERE name = 'Admin User');
--
-- And via Supabase service role in Node.js:
--   supabaseAdmin.auth.admin.updateUserById(userId, {
--     user_metadata: { is_admin: true }
--   })
-- ============================================================

-- Sample users to register through the app UI:
-- 1. Admin User    | admin@blooddonation.com    | Admin@1234 | O+  | Inside Dhaka | 01700000001
-- 2. Rafiq Ahmed   | rafiq@example.com          | User@1234  | A+  | Inside Dhaka | 01700000002
-- 3. Fatema Noor   | fatema@example.com         | User@1234  | B+  | Mirpur       | 01700000003
-- 4. Karim Hasan   | karim@example.com          | User@1234  | AB- | Chittagong   | 01700000004
-- 5. Sumaiya Islam | sumaiya@example.com        | User@1234  | O-  | Inside Dhaka | 01700000005
