-- PromptPolish Database Setup
-- Run this in your Supabase SQL Editor

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_results_user_id ON enhancement_results(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_results_folder_id ON enhancement_results(folder_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_results_created_at ON enhancement_results(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enhancement_results_updated_at ON enhancement_results;
CREATE TRIGGER update_enhancement_results_updated_at BEFORE UPDATE ON enhancement_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database setup completed successfully!' as message;



