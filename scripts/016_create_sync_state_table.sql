-- Create sync_state table for tracking IMAP sync progress
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'zoho', 'gmail', etc.
  email_address TEXT NOT NULL,
  last_uid INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'syncing', 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT sync_state_org_provider_email_key UNIQUE (organization_id, provider, email_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_state_org ON sync_state(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_state_status ON sync_state(sync_status);

-- Enable RLS
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's sync state"
  ON sync_state FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org's sync state"
  ON sync_state FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's sync state"
  ON sync_state FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
