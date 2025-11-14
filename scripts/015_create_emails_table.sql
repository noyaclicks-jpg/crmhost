-- Create emails table for storing inbox messages
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL UNIQUE,
  subject TEXT,
  sender TEXT NOT NULL,
  recipient_alias TEXT,
  from_domain TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  raw_headers TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_organization_id ON public.emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON public.emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender ON public.emails(sender);
CREATE INDEX IF NOT EXISTS idx_emails_from_domain ON public.emails(from_domain);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON public.emails(is_read);

-- Full-text search index for subject and body
CREATE INDEX IF NOT EXISTS idx_emails_search ON public.emails 
USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '')));

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view emails in their organization"
  ON public.emails FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert emails"
  ON public.emails FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update emails in their organization"
  ON public.emails FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE public.emails IS 'Stores emails synced from Zoho inbox via IMAP';
