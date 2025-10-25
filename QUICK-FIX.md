# 🚀 Quick Setup Guide - Fix Authentication Errors

## **Step 1: Set up Supabase Database**

1. **Go to your Supabase project** → SQL Editor
2. **Copy and paste** the entire contents of `setup-database.sql`
3. **Click "Run"** to create the tables and policies

## **Step 2: Verify Environment Variables**

Make sure your `.env.local` has:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# At least one AI provider (REQUIRED)
GROQ_API_KEY=your_groq_api_key
```

## **Step 3: Restart the Server**

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## **Step 4: Test the App**

1. **Sign up** with a new account
2. **Create a folder** (e.g., "Health")
3. **Enter a prompt** like "health cancer"
4. **Click "Enhance Prompt"** - should now work!

## **🔧 What I Fixed:**

✅ **Authentication Session Handling** - Fixed API routes to properly get user sessions  
✅ **Database Schema** - Created proper tables with RLS policies  
✅ **Middleware** - Added Supabase auth middleware  
✅ **Error Handling** - Fixed variable naming issues  

## **🎯 Expected Behavior:**

- ✅ No more 401 Unauthorized errors
- ✅ No more 404 database errors  
- ✅ Questions generate properly
- ✅ Folders save correctly
- ✅ History persists per user

The app should now work perfectly with user authentication and folder organization!
