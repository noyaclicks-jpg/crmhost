# Role-Based Permission System

## Overview

This CRM uses a three-tier role system with **invite-only access** to control who can use the system:

- **Owner** - Full administrative control
- **Admin** - Full access same as owner (except role changes)
- **Member** - Can add domains and emails, but cannot see API credentials or settings

## Authentication System

### Invite-Only Access
- **No public signup**: Users cannot create accounts without an invitation
- **Admin creates invites**: Only owners and admins can invite new users
- **Invite links expire**: All invites expire after 7 days for security

### Authentication Methods
- **Google OAuth** (recommended): Sign in with Google account
- **Email/Password**: Traditional username and password authentication

## Detailed Permissions by Role

### Owner Role

**Full Access:**
- ✅ View and manage API credentials (Netlify, ForwardEmail)
- ✅ Access organization settings
- ✅ View team members
- ✅ Invite new team members
- ✅ Remove team members (including admins and other members)
- ✅ Change team member roles (promote/demote)
- ✅ View, add, delete, and verify domains
- ✅ View, add, edit, and delete email aliases
- ✅ View audit logs

**Exclusive Permissions:**
- 🔒 Change user roles (only owners can promote/demote)

---

### Admin Role

**Access (Same as Owner):**
- ✅ View and manage API credentials
- ✅ Access organization settings
- ✅ View team members
- ✅ Invite new team members
- ✅ Remove members (but cannot change roles)
- ✅ View, add, delete, and verify domains
- ✅ View, add, edit, and delete email aliases
- ✅ View audit logs

**Restricted:**
- ❌ Cannot change team member roles (owner only)

---

### Member Role (Employee)

**Access:**
- ✅ View domains and their status
- ✅ **Add new domains** (for day-to-day operations)
- ✅ View email aliases and forwarding rules
- ✅ **Create new email aliases** (for day-to-day operations)
- ✅ **Edit email aliases** (modify forwarding rules)
- ✅ View audit logs
- ✅ See organization overview

**Restricted:**
- ❌ Cannot view or manage API credentials
- ❌ Cannot access Settings page
- ❌ Cannot view Team page
- ❌ Cannot delete domains
- ❌ Cannot delete email aliases
- ❌ Cannot invite or manage team members

---

## Use Cases

### Owner
Use this role for:
- Organization founders
- Technical administrators who need to configure API integrations
- Users who need full control over the account

### Admin
Use this role for:
- Senior operations managers
- Team leads who manage day-to-day operations
- Users who need full operational control including API access
- Technical staff who configure integrations

### Member (Employee)
Use this role for:
- Customer support staff who add domains/emails for clients
- Junior team members who handle routine tasks
- Operations staff who create resources but shouldn't delete them
- Anyone who needs operational access without seeing sensitive API keys

---

## Security Notes

1. **Invite-only system** - No one can create an account without an invitation from an admin
2. **API Credentials are ONLY visible to owners and admins** - Members cannot see sensitive API keys
3. **Settings page requires owner or admin role** - Members cannot access configuration
4. **Members can CREATE but not DELETE** - They can add domains/emails but can't remove them
5. **Admins have full operational access** - They can manage everything except role changes
6. **Role changes require owner permission** - Prevents privilege escalation

---

## Adding Team Members

**As Owner or Admin:**
1. Go to **Team** page in the dashboard
2. Click **Invite User**
3. Enter their email address
4. Select the appropriate role:
   - **Admin** if they need full access including API credentials
   - **Member** if they need to add domains/emails but shouldn't see API keys
5. Click **Create Invite**
6. Share the generated signup link with the user

**User Signup Flow:**
1. User receives the invite link
2. Clicks the link to access the signup page
3. Can choose to:
   - Sign up with Google (one click)
   - Sign up with email and password
4. After authentication, automatically joins your organization
5. Assigned the role specified in the invite

**Note:** Only owners can change team member roles. This prevents admins from giving themselves owner privileges.
