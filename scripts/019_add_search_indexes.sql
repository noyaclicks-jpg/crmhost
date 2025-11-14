-- Migration 019: Add indexes for search performance
-- Run this in Supabase Dashboard > SQL Editor

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for full-text search on emails
CREATE INDEX IF NOT EXISTS idx_emails_subject_search ON emails USING gin(to_tsvector('english', subject));
CREATE INDEX IF NOT EXISTS idx_emails_body_text_search ON emails USING gin(to_tsvector('english', body_text));
CREATE INDEX IF NOT EXISTS idx_emails_sender_search ON emails USING gin(to_tsvector('english', sender));

-- Add indexes for partial matching on domains and aliases
CREATE INDEX IF NOT EXISTS idx_domains_name_trgm ON domains USING gin(domain_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_email_aliases_name_trgm ON email_aliases USING gin(alias_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_email_aliases_forward_to_trgm ON email_aliases USING gin(forward_to gin_trgm_ops);

-- Add comments
COMMENT ON INDEX idx_emails_subject_search IS 'Full-text search index for email subjects';
COMMENT ON INDEX idx_emails_body_text_search IS 'Full-text search index for email body text';
COMMENT ON INDEX idx_emails_sender_search IS 'Full-text search index for email senders';
COMMENT ON INDEX idx_domains_name_trgm IS 'Trigram index for partial domain name matching';
COMMENT ON INDEX idx_email_aliases_name_trgm IS 'Trigram index for partial alias name matching';
