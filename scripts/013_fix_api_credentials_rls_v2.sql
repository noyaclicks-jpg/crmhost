-- Drop existing problematic policies
DROP POLICY IF EXISTS "Owners and admins can view API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Owners and admins can manage API credentials" ON public.api_credentials;

-- Recreate policies using the SECURITY DEFINER functions to avoid recursion/conflicts
CREATE POLICY "Owners and admins can view API credentials"
  ON public.api_credentials FOR SELECT
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can insert API credentials"
  ON public.api_credentials FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can update API credentials"
  ON public.api_credentials FOR UPDATE
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can delete API credentials"
  ON public.api_credentials FOR DELETE
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );
