-- Drop existing policies
DROP POLICY IF EXISTS "Only organization owners can view API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Only organization owners can manage API credentials" ON public.api_credentials;

-- Allow both owners and admins to view and manage API credentials
CREATE POLICY "Owners and admins can view API credentials"
  ON public.api_credentials FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can manage API credentials"
  ON public.api_credentials FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
