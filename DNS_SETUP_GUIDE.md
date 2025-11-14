# DNS Setup Guide

## Overview

This CRM uses **Netlify DNS** for managing domain nameservers and DNS records for email forwarding. **No websites are deployed** - we only use Netlify for DNS management.

## How It Works

### 1. Add a Domain

When you add a domain in the CRM:
- A DNS zone is created in Netlify (no site is created)
- Netlify provides nameservers for your domain
- The domain is registered with ForwardEmail for email forwarding

### 2. Configure DNS

You have **two options** to configure DNS:

#### Option 1: Use Netlify Nameservers (Recommended)

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find the nameserver settings
3. Replace existing nameservers with Netlify's nameservers (shown in the DNS dialog)
4. Save changes

**Benefits:**
- Netlify automatically manages all DNS records
- Email forwarding works automatically
- Easier to manage

#### Option 2: Manual DNS Records

If you want to keep your current nameservers:
1. Add the DNS records shown in the dialog manually
2. Include both Netlify A/CNAME records and ForwardEmail MX/TXT records

### 3. Verify Setup

After configuring DNS (allow 24-48 hours for propagation):
- Click "Verify DNS" in the domains page
- The system checks if DNS is properly configured
- Status changes to "Active" when verified

## DNS Records Explained

### Netlify Records (For DNS Management)
- **A Record** (`@` → `75.2.60.5`): Points root domain to Netlify DNS
- **CNAME Record** (`www` → `your-site.netlify.app`): Points www subdomain

### ForwardEmail Records (For Email Forwarding)
- **MX Records**: Tell email servers where to deliver mail
  - `mx1.forwardemail.net` (priority 10)
  - `mx2.forwardemail.net` (priority 20)
- **TXT Record**: Verifies domain ownership with ForwardEmail

## Important Notes

- **No websites are hosted** - We only use Netlify for DNS management
- DNS propagation takes 24-48 hours
- Nameservers option is simpler and recommended
- Email aliases only work after DNS is properly configured

## Troubleshooting

### Domain not verifying?
- Wait 24-48 hours for DNS propagation
- Check nameservers are correctly set at your registrar
- Ensure all MX and TXT records are added if using manual option

### Email not forwarding?
- Verify domain status is "Active"
- Check ForwardEmail MX records are correct
- Ensure TXT record with `forward-email=yourdomain.com` exists

## API Requirements

To use domain management, you need:
1. **Netlify API Token** - For DNS zone management
2. **ForwardEmail API Token** - For email forwarding setup

Both are configured in Settings → API Credentials.
