-- Fix RLS policies for api_credentials to allow all organization members to use them
-- while only allowing owners and admins to manage them

-- Drop existing policies
DROP POLICY IF EXISTS "Only organization owners can view API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Only organization owners can manage API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Organization owners and admins can view API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Organization owners and admins can manage API credentials" ON public.api_credentials;

-- Allow ALL organization members to READ credentials so they can use them
-- This lets members use domains/email features without needing direct access to credentials
CREATE POLICY "All organization members can view API credentials"
  ON public.api_credentials FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Only owners and admins can INSERT credentials
CREATE POLICY "Only organization owners and admins can insert API credentials"
  ON public.api_credentials FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can UPDATE credentials
CREATE POLICY "Only organization owners and admins can update API credentials"
  ON public.api_credentials FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners and admins can DELETE credentials
CREATE POLICY "Only organization owners and admins can delete API credentials"
  ON public.api_credentials FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
