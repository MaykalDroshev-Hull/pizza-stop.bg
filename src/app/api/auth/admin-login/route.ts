import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, password, type } = await request.json()

    // Validate input
    if (!username || !password || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get credentials from server-side environment variables
    let validUsername: string
    let validPassword: string

    switch (type) {
      case 'admin':
        validUsername = process.env.ADMIN_USERNAME || ''
        validPassword = process.env.ADMIN_PASSWORD || ''
        break
      case 'kitchen':
        validUsername = process.env.KITCHEN_USERNAME || ''
        validPassword = process.env.KITCHEN_PASSWORD || ''
        break
      case 'delivery':
        validUsername = process.env.DELIVERY_USERNAME || ''
        validPassword = process.env.DELIVERY_PASSWORD || ''
        break
      case 'printer':
        validUsername = process.env.PRINTER_USERNAME || ''
        validPassword = process.env.PRINTER_PASSWORD || ''
        break
      default:
        return NextResponse.json(
          { error: 'Invalid login type' },
          { status: 400 }
        )
    }
    
    // Reject if credentials not configured
    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { error: 'Authentication not configured for this role' },
        { status: 500 }
      )
    }

    // Verify credentials
    if (username === validUsername && password === validPassword) {
      return NextResponse.json({
        success: true,
        type,
        message: 'Login successful'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

