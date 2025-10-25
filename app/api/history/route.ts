import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Get user's enhancement history
export async function GET(request: NextRequest) {
  try {
    // Get user from session
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
      .from('enhancement_results')
      .select(`
        *,
        folders (
          id,
          name,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by folder if specified
    if (folderId === 'null' || folderId === '') {
      query = query.is('folder_id', null)
    } else if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    const { data: results, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete enhancement result
export async function DELETE(request: NextRequest) {
  try {
    // Get user from session
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
        { error: 'Result ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('enhancement_results')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete result' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Clear all user history
export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    const { action } = await request.json()

    if (action === 'clear_all') {
      const { error } = await supabase
        .from('enhancement_results')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to clear history' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error clearing history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
