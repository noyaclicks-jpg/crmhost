-- Create a test user account with organization
-- This script creates a test user in Supabase Auth and sets up their profile

-- Note: This requires running in Supabase SQL Editor with service role permissions
-- You can also just use the sign-up page at /auth/sign-up

-- First, create the test user in Supabase Auth (THIS MUST BE DONE IN SUPABASE DASHBOARD)
-- Email: test@example.com
-- Password: Test123!@#

-- Then run this script to set up organization and profile:

-- Insert test organization
INSERT INTO public.organizations (id, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Organization',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test user profile (replace USER_ID with the actual auth.users ID from Supabase)
-- To get the user ID, run: SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- INSERT INTO public.profiles (id, organization_id, email, full_name, role, created_at, updated_at)
-- VALUES (
--   'REPLACE_WITH_ACTUAL_USER_ID',
--   '00000000-0000-0000-0000-000000000001',
--   'test@example.com',
--   'Test User',
--   'owner',
--   NOW(),
--   NOW()
-- );

-- Note: The profile should be auto-created by the trigger when you sign up through the UI
