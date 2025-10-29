import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/app/lib/supabase-server'
import { VapiService, VOICE_PERSONALITIES } from '@/app/lib/vapi-service'

// Initialize Vapi service
const vapiService = new VapiService(process.env.VAPI_API_KEY || '')

// Create a new voice assistant
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { 
      name, 
      personality = 'assistant', 
      model = 'gpt-3.5-turbo',
      customPrompt,
      phoneNumber 
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Assistant name is required' },
        { status: 400 }
      )
    }

    // Get personality configuration
    const personalityConfig = VOICE_PERSONALITIES[personality as keyof typeof VOICE_PERSONALITIES] || VOICE_PERSONALITIES.assistant
    
    // Create assistant with Vapi
    const assistant = await vapiService.createVoiceAssistant({
      name,
      model,
      voice: personalityConfig.voice.voiceId,
      systemPrompt: customPrompt || personalityConfig.systemPrompt,
      firstMessage: personalityConfig.firstMessage
    })

    // Save assistant to database
    const supabase = createClient()
    const { data: savedAssistant, error: saveError } = await supabase
      .from('voice_assistants')
      .insert({
        user_id: user.id,
        vapi_assistant_id: assistant.id,
        name,
        personality,
        model,
        custom_prompt: customPrompt,
        phone_number: phoneNumber,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving assistant:', saveError)
      return NextResponse.json(
        { error: 'Failed to save assistant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      assistant: savedAssistant,
      vapiAssistant: assistant 
    })

  } catch (error) {
    console.error('Error creating voice assistant:', error)
    return NextResponse.json(
      { error: 'Failed to create voice assistant' },
      { status: 500 }
    )
  }
}

// Get user's voice assistants
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
    const { data: assistants, error } = await supabase
      .from('voice_assistants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch assistants' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assistants })

  } catch (error) {
    console.error('Error fetching voice assistants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Start a voice call
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { assistantId, phoneNumber, type = 'phone' } = await request.json()

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      )
    }

    let call
    if (type === 'phone' && phoneNumber) {
      call = await vapiService.startCall(assistantId, phoneNumber)
    } else {
      call = await vapiService.startWebCall(assistantId)
    }

    // Save call information
    const supabase = createClient()
    const { data: savedCall, error: saveError } = await supabase
      .from('voice_calls')
      .insert({
        user_id: user.id,
        assistant_id: assistantId,
        vapi_call_id: call.id,
        phone_number: phoneNumber,
        call_type: type,
        status: 'started',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving call:', saveError)
    }

    return NextResponse.json({ 
      call,
      savedCall 
    })

  } catch (error) {
    console.error('Error starting voice call:', error)
    return NextResponse.json(
      { error: 'Failed to start voice call' },
      { status: 500 }
    )
  }
}

// End a voice call
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    // End the call with Vapi
    const result = await vapiService.endCall(callId)

    // Update call status in database
    const supabase = createClient()
    await supabase
      .from('voice_calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('vapi_call_id', callId)
      .eq('user_id', user.id)

    return NextResponse.json({ 
      success: true,
      result 
    })

  } catch (error) {
    console.error('Error ending voice call:', error)
    return NextResponse.json(
      { error: 'Failed to end voice call' },
      { status: 500 }
    )
  }
}



