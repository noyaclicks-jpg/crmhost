# Test Account Setup Guide

## Quick Start: Use the Sign-Up Page

The easiest way to create a test account is through the application itself:

1. Navigate to `/auth/sign-up`
2. Fill in the form:
   \`\`\`
   Email: test@example.com
   Password: Test123!@#
   Full Name: Test User
   Organization Name: Test Organization
   \`\`\`
3. Click "Sign up"
4. Check your email for confirmation (or wait for auto-confirmation if enabled)
5. Sign in at `/auth/login` with the same credentials

## Login Credentials

After signing up, use these credentials to log in:

\`\`\`
Email: test@example.com
Password: Test123!@#
\`\`\`

## What Gets Created Automatically

When you sign up through the UI, the system automatically:

1. Creates a user account in Supabase Auth
2. Creates a new organization with the name you provide
3. Creates a profile for you with the "owner" role
4. Sends a confirmation email (if email confirmation is enabled)

## Testing Different User Roles

To test different roles (admin, member), you can:

1. Sign in as the owner (test@example.com)
2. Go to `/dashboard/team`
3. Invite additional users with different roles
4. Or manually create additional accounts and change their roles

## Database Access

If you need to directly access the database:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run queries to view or modify data

Example queries:
\`\`\`sql
-- View all users
SELECT * FROM auth.users;

-- View all profiles
SELECT * FROM public.profiles;

-- View all organizations
SELECT * FROM public.organizations;
\`\`\`

## Resetting Test Data

To reset your test data:

1. Go to Supabase Dashboard > SQL Editor
2. Run the cleanup script:
\`\`\`sql
-- Delete all data (careful!)
DELETE FROM public.audit_logs;
DELETE FROM public.email_aliases;
DELETE FROM public.domains;
DELETE FROM public.api_credentials;
DELETE FROM public.profiles;
DELETE FROM public.organizations;
-- Note: auth.users must be deleted from Authentication section in Supabase Dashboard
\`\`\`

## Environment Variables Required

Make sure these are set (already configured in your project):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (for development)
