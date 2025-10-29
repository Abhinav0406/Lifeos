-- Add image support to conversation_messages table
ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_provider TEXT,
ADD COLUMN IF NOT EXISTS image_size TEXT,
ADD COLUMN IF NOT EXISTS is_image_generation BOOLEAN DEFAULT FALSE;

-- Add index for image queries
CREATE INDEX IF NOT EXISTS idx_conversation_messages_image ON conversation_messages(is_image_generation) WHERE is_image_generation = TRUE;
