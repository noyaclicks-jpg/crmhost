-- Fix the foreign key relationship for audit_logs to enable joins with profiles
-- The audit_logs.user_id currently references auth.users(id)
-- But we want to be able to join with profiles table
-- Since profiles.id also references auth.users(id), we need to add this explicit relationship

-- Drop the existing constraint
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Add foreign key to profiles instead of auth.users
-- This allows Supabase to understand the relationship for joins
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
