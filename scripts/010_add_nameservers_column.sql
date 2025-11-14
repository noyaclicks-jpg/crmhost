-- Add columns for DNS zone and nameservers
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS netlify_dns_zone_id TEXT,
ADD COLUMN IF NOT EXISTS nameservers TEXT[];

-- Add comment
COMMENT ON COLUMN domains.nameservers IS 'Netlify DNS nameservers for the domain';
