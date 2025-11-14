# API Credentials Access Control

## Overview
API credentials in the Hosting CRM are stored at the **organization level** and shared across all members, but with different access levels based on user role.

## Access Levels

### Owners & Admins
- **View**: Can see credentials in Settings (masked display)
- **Add/Update**: Can save new credentials or update existing ones
- **Delete**: Can remove credentials
- **Test**: Can test API connections

### Members
- **Use**: Can automatically use organization credentials for domain/email operations
- **Cannot View**: Cannot see credentials in Settings
- **Cannot Modify**: Cannot add, update, or delete credentials

## How It Works

### For Owners/Admins
1. Go to Settings → API Credentials
2. Add Netlify and ForwardEmail API tokens
3. Credentials are saved to the organization and available for all members

### For Members
1. Members don't see or manage API credentials
2. When adding domains or email aliases, the system automatically uses organization credentials
3. If credentials aren't configured, members see: "Please contact your organization owner to add credentials in Settings"

## Database Implementation

### RLS Policies
- **SELECT**: All organization members can read credentials (to use them)
- **INSERT/UPDATE/DELETE**: Only owners and admins can modify credentials

### Storage
- Credentials stored in `api_credentials` table
- One row per service per organization
- Fields: `organization_id`, `service`, `api_token`

## Security Notes
- API tokens are never exposed to the frontend
- All API calls use server actions
- Members can use features but never see actual token values
- Credentials persist across sessions and user logins
</parameter>
