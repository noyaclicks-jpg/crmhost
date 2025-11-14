# Google OAuth Setup Guide

This guide will help you enable Google OAuth authentication in your Hosting CRM.

## Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle it to **Enabled**

## Step 2: Configure Google OAuth

You have two options:

### Option A: Use Supabase's Google OAuth (Easiest)

1. In the Google provider settings, Supabase provides pre-configured credentials
2. Simply enable the provider and click **Save**
3. This uses Supabase's Google OAuth app (good for testing)

### Option B: Create Your Own Google OAuth App (Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - Development: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - Production: `https://your-domain.com/auth/callback`
7. Copy the **Client ID** and **Client Secret**
8. Paste them in Supabase's Google provider settings
9. Click **Save**

## Step 3: Test the Integration

1. Go to your app's login page
2. Click "Sign in with Google"
3. You should be redirected to Google's login page
4. After successful login, you'll be redirected back to the dashboard

## How It Works

- **Login**: Users can click "Sign in with Google" on the login page
- **Invite-Only Signup**: New users must have an invite link to create an account
  - When they click the invite link, they're taken to the signup page
  - They can choose to sign up with Google or email/password
  - After authentication, they're automatically added to your organization with the assigned role

## Security Features

- Public signup is disabled - users need an invite link
- Google OAuth provides secure authentication without password management
- All users are automatically assigned to the correct organization via invite tokens
- Invite links expire after 7 days

## Troubleshooting

**Error: "Invalid redirect URI"**
- Make sure the redirect URI in Google Console matches Supabase exactly
- Check for trailing slashes or https vs http

**Error: "User already exists"**
- The email is already registered in your organization
- Check the Team page to see existing members

**Google button doesn't work**
- Verify Google provider is enabled in Supabase
- Check browser console for errors
- Ensure environment variables are set correctly
