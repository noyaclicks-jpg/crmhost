-- Migration 018: Create dns_health table for tracking DNS configuration history
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS dns_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Health status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'error')),
  issues TEXT[] DEFAULT '{}',
  
  -- Netlify DNS status
  netlify_zone_exists BOOLEAN DEFAULT false,
  netlify_nameservers TEXT[] DEFAULT '{}',
  
  -- ForwardEmail status
  forwardemail_verified BOOLEAN DEFAULT false,
  forwardemail_has_mx BOOLEAN DEFAULT false,
  forwardemail_has_txt BOOLEAN DEFAULT false,
  
  -- Timestamps
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_dns_health_domain_id ON dns_health(domain_id);
CREATE INDEX idx_dns_health_organization_id ON dns_health(organization_id);
CREATE INDEX idx_dns_health_status ON dns_health(status);
CREATE INDEX idx_dns_health_checked_at ON dns_health(checked_at DESC);

-- Enable RLS
ALTER TABLE dns_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's DNS health"
  ON dns_health FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert DNS health records"
  ON dns_health FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE dns_health IS 'Historical DNS health check results for domains';
