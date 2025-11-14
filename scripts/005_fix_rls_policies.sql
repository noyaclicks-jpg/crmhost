-- Fix infinite recursion in RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Organization owners and admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view domains in their organization" ON public.domains;
DROP POLICY IF EXISTS "Organization owners and admins can manage domains" ON public.domains;
DROP POLICY IF EXISTS "Users can view email aliases in their organization" ON public.email_aliases;
DROP POLICY IF EXISTS "Organization owners and admins can manage email aliases" ON public.email_aliases;
DROP POLICY IF EXISTS "Only organization owners can view API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Only organization owners can manage API credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON public.audit_logs;

-- Recreate policies without recursion using a security definer function
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (id = get_user_organization_id());

CREATE POLICY "Organization owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (id = get_user_organization_id() AND get_user_role() = 'owner');

-- RLS Policies for profiles (keep the simple ones that don't cause recursion)
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Organization owners and admins can manage profiles"
  ON public.profiles FOR ALL
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );

-- RLS Policies for domains
CREATE POLICY "Users can view domains in their organization"
  ON public.domains FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Organization owners and admins can manage domains"
  ON public.domains FOR ALL
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );

-- RLS Policies for email_aliases
CREATE POLICY "Users can view email aliases in their organization"
  ON public.email_aliases FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Organization owners and admins can manage email aliases"
  ON public.email_aliases FOR ALL
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
  );

-- RLS Policies for api_credentials
CREATE POLICY "Only organization owners can view API credentials"
  ON public.api_credentials FOR SELECT
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() = 'owner'
  );

CREATE POLICY "Only organization owners can manage API credentials"
  ON public.api_credentials FOR ALL
  USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() = 'owner'
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit logs in their organization"
  ON public.audit_logs FOR SELECT
  USING (organization_id = get_user_organization_id());
