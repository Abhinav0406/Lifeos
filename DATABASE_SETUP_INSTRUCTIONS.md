-- Instructions to set up conversation tables in Supabase:

-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste the contents of conversation-schema.sql
-- 4. Run the SQL script

-- This will create:
-- - conversations table (stores conversation metadata)
-- - conversation_messages table (stores individual messages)
-- - Proper RLS policies for security
-- - Indexes for performance

-- After running the schema, your app will have:
-- ✅ Full conversation history saving
-- ✅ Conversation continuation
-- ✅ Delete individual conversations
-- ✅ Incognito mode (no history saving)
-- ✅ Folder-based organization



