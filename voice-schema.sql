-- Voice Assistants Table
CREATE TABLE IF NOT EXISTS voice_assistants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vapi_assistant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  personality TEXT NOT NULL DEFAULT 'assistant',
  model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
  custom_prompt TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Calls Table
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES voice_assistants(id) ON DELETE CASCADE,
  vapi_call_id TEXT NOT NULL,
  phone_number TEXT,
  call_type TEXT NOT NULL DEFAULT 'phone', -- 'phone' or 'web'
  status TEXT NOT NULL DEFAULT 'started', -- 'started', 'ended', 'failed'
  duration INTEGER, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Voice Call Messages Table (for transcripts)
CREATE TABLE IF NOT EXISTS voice_call_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES voice_calls(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  transcript_id TEXT,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE voice_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for voice_assistants
CREATE POLICY "Users can view their own voice assistants" ON voice_assistants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice assistants" ON voice_assistants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice assistants" ON voice_assistants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice assistants" ON voice_assistants
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for voice_calls
CREATE POLICY "Users can view their own voice calls" ON voice_calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice calls" ON voice_calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice calls" ON voice_calls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice calls" ON voice_calls
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for voice_call_messages
CREATE POLICY "Users can view messages from their voice calls" ON voice_call_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voice_calls 
      WHERE voice_calls.id = voice_call_messages.call_id 
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their voice calls" ON voice_call_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_calls 
      WHERE voice_calls.id = voice_call_messages.call_id 
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their voice calls" ON voice_call_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM voice_calls 
      WHERE voice_calls.id = voice_call_messages.call_id 
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their voice calls" ON voice_call_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM voice_calls 
      WHERE voice_calls.id = voice_call_messages.call_id 
      AND voice_calls.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_assistants_user_id ON voice_assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_assistants_vapi_id ON voice_assistants(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_user_id ON voice_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_assistant_id ON voice_calls(assistant_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_vapi_id ON voice_calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_messages_call_id ON voice_call_messages(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_messages_timestamp ON voice_call_messages(timestamp);


