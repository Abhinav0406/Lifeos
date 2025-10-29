# 🚨 URGENT FIX - Database Setup Required

## **The Problem:**
- 401 Unauthorized = Authentication not working
- 404 from Supabase = Database tables don't exist

## **Quick Fix Steps:**

### **Step 1: Set up Supabase Database (CRITICAL)**

1. **Go to your Supabase project**: https://supabase.com/dashboard
2. **Click on "SQL Editor"** in the left sidebar
3. **Copy this entire SQL script** and paste it:

```sql
-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhancement_results table
CREATE TABLE IF NOT EXISTS enhancement_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  original_prompt TEXT NOT NULL,
  enhanced_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'general',
  provider TEXT NOT NULL,
  questions_and_answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_results ENABLE ROW LEVEL SECURITY;

-- Create policies for folders
CREATE POLICY "Users can view their own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for enhancement_results
CREATE POLICY "Users can view their own enhancement results" ON enhancement_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhancement results" ON enhancement_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enhancement results" ON enhancement_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enhancement results" ON enhancement_results
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_results_user_id ON enhancement_results(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_results_folder_id ON enhancement_results(folder_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_results_created_at ON enhancement_results(created_at DESC);

-- Success message
SELECT 'Database setup completed!' as message;
```

4. **Click "Run"** button
5. **You should see "Database setup completed!" message**

### **Step 2: Verify Environment Variables**

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://viziipnbpqzclkpxuxsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### **Step 3: Restart Server**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## **After Setup:**
- ✅ No more 404 errors
- ✅ No more 401 errors  
- ✅ Questions will generate
- ✅ Folders will work

**The 404 error means the database tables don't exist yet. Once you run the SQL script above, everything will work!**



