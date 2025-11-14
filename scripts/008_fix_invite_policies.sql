-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invites in their organization" ON invites;
DROP POLICY IF EXISTS "Owners and admins can create invites" ON invites;
DROP POLICY IF EXISTS "Owners and admins can delete invites" ON invites;

-- Recreate policies with proper permissions

-- Allow anyone to view an invite by token (needed for accepting invites)
CREATE POLICY "Anyone can view invite by token"
  ON invites FOR SELECT
  USING (true);

-- Allow authenticated users to view invites in their organization
CREATE POLICY "Users can view org invites"
  ON invites FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Owners and admins can create invites
CREATE POLICY "Owners and admins can create invites"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Allow anyone to update invite when accepting (mark as accepted)
CREATE POLICY "Anyone can accept invite by token"
  ON invites FOR UPDATE
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);

-- Owners and admins can delete invites
CREATE POLICY "Owners and admins can delete invites"
  ON invites FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
