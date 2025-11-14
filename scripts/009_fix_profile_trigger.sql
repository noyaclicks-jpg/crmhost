-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Updated function to handle both new org creation and adding to existing org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_org_id UUID;
  user_role TEXT;
BEGIN
  -- Check if organization_id is provided in metadata (for invites/team members)
  user_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');

  -- If no organization provided, create a new one
  IF user_org_id IS NULL THEN
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'))
    RETURNING id INTO new_org_id;
    
    user_org_id := new_org_id;
    user_role := 'owner';
  END IF;

  -- Create the user profile
  INSERT INTO public.profiles (id, email, full_name, organization_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    user_org_id,
    user_role
  );

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
