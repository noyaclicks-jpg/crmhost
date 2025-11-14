-- Create email_domain_links table for mapping emails to domains/aliases
CREATE TABLE IF NOT EXISTS email_domain_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  alias_id UUID REFERENCES domain_aliases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT email_domain_links_unique UNIQUE (email_id, domain_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_domain_links_email ON email_domain_links(email_id);
CREATE INDEX IF NOT EXISTS idx_email_domain_links_domain ON email_domain_links(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_domain_links_alias ON email_domain_links(alias_id);

-- Enable RLS
ALTER TABLE email_domain_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's email domain links"
  ON email_domain_links FOR SELECT
  USING (
    domain_id IN (
      SELECT d.id FROM domains d
      INNER JOIN profiles p ON d.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org's email domain links"
  ON email_domain_links FOR INSERT
  WITH CHECK (
    domain_id IN (
      SELECT d.id FROM domains d
      INNER JOIN profiles p ON d.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );
