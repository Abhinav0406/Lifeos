import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('conversations')
      .select(`
        *,
        folders (
          id,
          name,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by folder if specified
    if (folderId === 'null' || folderId === '') {
      query = query.is('folder_id', null)
    } else if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data: conversations, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { title, folderId, mode, provider } = await request.json()

    if (!title || !mode || !provider) {
      return NextResponse.json(
        { error: 'Title, mode, and provider are required' },
        { status: 400 }
      )
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        folder_id: folderId || null,
        mode,
        provider
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a conversation (e.g., change folder)
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { conversationId, folderId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({
        folder_id: folderId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
