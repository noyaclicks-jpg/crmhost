-- Remove Netlify site columns since we're only using DNS zones now
ALTER TABLE domains DROP COLUMN IF EXISTS netlify_site_id;
ALTER TABLE domains DROP COLUMN IF EXISTS netlify_site_name;

-- Add comment explaining DNS-only setup
COMMENT ON TABLE domains IS 'Domains managed for email forwarding using Netlify DNS (no site deployment)';
