# Google Authentication Setup Guide

## Error Fix: redirect_uri_mismatch

If you see "Error 400: redirect_uri_mismatch", follow these steps:

### Step 1: Find Your Supabase Project URL

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Find your **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (or create one for Web application)
5. **IMPORTANT**: In **Authorized redirect URIs**, add:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR-PROJECT-REF` with your actual Supabase project reference.

### Step 3: Configure Supabase

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Enter your **Google Client ID** and **Google Client Secret**
4. Click **Save**

### Step 4: Verify Site URL

1. Go to **Authentication** → **URL Configuration**
2. **Site URL** should be set to your app's URL:
   - Production: `https://your-domain.com`
   - Local testing: `http://localhost:3001` or `http://localhost:3000`
3. **Redirect URLs** should include:
   - `http://localhost:3001/**` (for local testing)
   - `https://your-domain.com/**` (for production)

### Step 5: Test

1. Restart your dev server
2. Try signing in with Google again
3. Should redirect properly now!

## Common Issues

**Issue**: "redirect_uri_mismatch"
- **Fix**: Ensure the redirect URI in Google Cloud Console is exactly: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

**Issue**: "Invalid client"
- **Fix**: Verify Client ID and Client Secret in Supabase match Google Cloud Console

**Issue**: Redirect goes to wrong URL
- **Fix**: Check Site URL in Supabase → Authentication → URL Configuration

## Quick Checklist

- [ ] Google OAuth Client ID created in Google Cloud Console
- [ ] Redirect URI added: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret entered in Supabase
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs include your app URLs

