import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Vapi webhook handler for real-time voice interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, call, transcript, message, functionCall } = body

    console.log('Vapi webhook received:', { event, callId: call?.id })

    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-vapi-signature')
    if (signature && process.env.VAPI_WEBHOOK_SECRET) {
      // Add signature verification logic here
      // This ensures the webhook is actually from Vapi
    }

    switch (event) {
      case 'call-started':
        await handleCallStarted(call)
        break

      case 'call-ended':
        await handleCallEnded(call)
        break

      case 'transcript':
        await handleTranscript(call, transcript)
        break

      case 'function-call':
        await handleFunctionCall(call, functionCall)
        break

      case 'speech-update':
        await handleSpeechUpdate(call, message)
        break

      case 'hang':
        await handleHang(call)
        break

      default:
        console.log('Unhandled Vapi event:', event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCallStarted(call: any) {
  console.log('Call started:', call.id)
  
  // You can save call information to your database here
  // For example, create a new conversation record
  try {
    const { user } = await getUser()
    if (user) {
      const supabase = createClient()
      
      await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: `Voice Call - ${new Date().toLocaleString()}`,
          mode: 'voice',
          provider: 'vapi',
          metadata: {
            callId: call.id,
            assistantId: call.assistantId,
            startedAt: new Date().toISOString()
          }
        })
    }
  } catch (error) {
    console.error('Error saving call start:', error)
  }
}

async function handleCallEnded(call: any) {
  console.log('Call ended:', call.id)
  
  // Update conversation with call end information
  try {
    const { user } = await getUser()
    if (user) {
      const supabase = createClient()
      
      await supabase
        .from('conversations')
        .update({
          metadata: {
            callId: call.id,
            endedAt: new Date().toISOString(),
            duration: call.duration,
            status: 'completed'
          }
        })
        .eq('metadata->callId', call.id)
        .eq('user_id', user.id)
    }
  } catch (error) {
    console.error('Error updating call end:', error)
  }
}

async function handleTranscript(call: any, transcript: any) {
  console.log('Transcript received:', transcript)
  
  // Save transcript to conversation messages
  try {
    const { user } = await getUser()
    if (user) {
      const supabase = createClient()
      
      // Find the conversation by call ID
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('metadata->callId', call.id)
        .eq('user_id', user.id)
        .single()

      if (conversation) {
        await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversation.id,
            role: transcript.participant === 'customer' ? 'user' : 'bot',
            content: transcript.text,
            metadata: {
              transcriptId: transcript.id,
              confidence: transcript.confidence,
              timestamp: transcript.timestamp
            }
          })
      }
    }
  } catch (error) {
    console.error('Error saving transcript:', error)
  }
}

async function handleFunctionCall(call: any, functionCall: any) {
  console.log('Function call received:', functionCall)
  
  // Handle custom function calls from the AI assistant
  // This allows the AI to perform actions like:
  // - Looking up information
  // - Making API calls
  // - Updating databases
  // - Sending notifications
  
  try {
    switch (functionCall.name) {
      case 'lookup_user_info':
        // Example: Look up user information
        const userInfo = await lookupUserInfo(functionCall.parameters)
        return {
          success: true,
          result: userInfo
        }

      case 'send_notification':
        // Example: Send a notification
        await sendNotification(functionCall.parameters)
        return {
          success: true,
          result: 'Notification sent'
        }

      case 'update_database':
        // Example: Update database record
        await updateDatabase(functionCall.parameters)
        return {
          success: true,
          result: 'Database updated'
        }

      default:
        console.log('Unknown function call:', functionCall.name)
        return {
          success: false,
          error: 'Unknown function'
        }
    }
  } catch (error: unknown) {
    console.error('Error handling function call:', error)
    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: message
    }
  }
}

async function handleSpeechUpdate(call: any, message: any) {
  console.log('Speech update:', message)
  
  // Handle real-time speech updates
  // This could be used for:
  // - Live transcription display
  // - Sentiment analysis
  // - Real-time response generation
}

async function handleHang(call: any) {
  console.log('Call hung up:', call.id)
  
  // Handle call hang up
  // Clean up any resources or send notifications
}

// Helper functions for function calls
async function lookupUserInfo(parameters: any) {
  // Implement user lookup logic
  return {
    name: 'John Doe',
    email: 'john@example.com',
    preferences: ['voice', 'email']
  }
}

async function sendNotification(parameters: any) {
  // Implement notification sending logic
  console.log('Sending notification:', parameters)
}

async function updateDatabase(parameters: any) {
  // Implement database update logic
  console.log('Updating database:', parameters)
}


