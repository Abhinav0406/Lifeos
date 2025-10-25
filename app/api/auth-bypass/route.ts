import { NextRequest, NextResponse } from 'next/server'

// Temporary auth bypass for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Auth bypass active - app should work without authentication',
    timestamp: new Date().toISOString()
  })
}
