# Quick Fix for Google Auth - redirect_uri_mismatch

## Your Supabase Project
- **Project URL**: `https://viziipnbpqzclkpxuxsx.supabase.co`
- **Project Ref**: `viziipnbpqzclkpxuxsx`

## Step 1: Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. In **Authorized redirect URIs**, add this EXACT URL:
   ```
   https://viziipnbpqzclkpxuxsx.supabase.co/auth/v1/callback
   ```
4. Click **Save**

## Step 2: Supabase Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com/project/viziipnbpqzclkpxuxsx)
2. **Authentication** → **Providers** → **Google**
   - Enable Google
   - Enter your Google Client ID
   - Enter your Google Client Secret
   - Save

3. **Authentication** → **URL Configuration**
   - **Site URL**: 
     - For local dev: `http://localhost:3001`
     - For production: Your deployed URL (e.g., `https://your-app.vercel.app`)
   - **Redirect URLs**: Add:
     ```
     http://localhost:3001/**
     http://localhost:3000/**
     https://your-production-domain.com/**
     ```

## Step 3: Test

1. Restart your dev server: `npm run dev:pwa`
2. Try "Sign in with Google" again
3. Should work now! ✅

## Important Notes

- The redirect URI in Google Console MUST be: `https://viziipnbpqzclkpxuxsx.supabase.co/auth/v1/callback`
- No trailing slashes, no variations
- Must use HTTPS (not HTTP)

