import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Get messages for a specific conversation
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUser()
    
    // If no user, return empty messages
    if (!user) {
      return NextResponse.json({ messages: [] })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // First verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get all messages for this conversation
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add a message to a conversation
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUser()
    
    // If no user, return success but don't save
    if (!user) {
      const mockMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: 'temp-conversation',
        role: 'user',
        content: 'Message saved temporarily',
        is_question: false,
        question_data: null,
        selected_answer: null,
        created_at: new Date().toISOString()
      }
      return NextResponse.json({ message: mockMessage })
    }

    const supabase = createClient()
    const { 
      conversationId, 
      role, 
      content, 
      isQuestion = false, 
      questionData = null, 
      selectedAnswer = null,
      imageUrl = null,
      imageProvider = null,
      imageSize = null,
      isImageGeneration = false
    } = await request.json()

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'Conversation ID, role, and content are required' },
        { status: 400 }
      )
    }

    // First verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Add the message
    const { data: message, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        is_question: isQuestion,
        question_data: questionData,
        selected_answer: selectedAnswer,
        image_url: imageUrl,
        image_provider: imageProvider,
        image_size: imageSize,
        is_image_generation: isImageGeneration
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      )
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error adding message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
