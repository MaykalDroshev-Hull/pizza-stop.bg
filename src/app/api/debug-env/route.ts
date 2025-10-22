import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check if environment variables are loaded
  const config = {
    EMAIL: {
      exists: !!process.env.EMAIL,
      value: process.env.EMAIL ? `${process.env.EMAIL.substring(0, 3)}***@${process.env.EMAIL.split('@')[1]}` : 'NOT SET',
      length: process.env.EMAIL?.length || 0
    },
    EMAIL_USER: {
      exists: !!process.env.EMAIL_USER,
      value: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***@${process.env.EMAIL_USER.split('@')[1]}` : 'NOT SET',
      length: process.env.EMAIL_USER?.length || 0
    },
    EMAIL_PASS: {
      exists: !!process.env.EMAIL_PASS,
      value: process.env.EMAIL_PASS ? '*'.repeat(process.env.EMAIL_PASS.length) : 'NOT SET',
      length: process.env.EMAIL_PASS?.length || 0
    },
    matches: {
      emailEqualsUser: process.env.EMAIL === process.env.EMAIL_USER,
      passLength16: process.env.EMAIL_PASS?.length === 16,
      allSet: !!process.env.EMAIL && !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
    },
    nodeEnv: process.env.NODE_ENV,
    envFileChecks: {
      hasEnvLocal: 'checking via presence of variables',
      expectedBehavior: 'Next.js loads .env.local automatically in development'
    }
  }

  const isConfigured = config.matches.allSet

  return NextResponse.json({
    configured: isConfigured,
    status: isConfigured ? '✅ All environment variables are set' : '❌ Missing environment variables',
    config,
    issues: !isConfigured ? [
      !process.env.EMAIL && 'EMAIL is not set',
      !process.env.EMAIL_USER && 'EMAIL_USER is not set',
      !process.env.EMAIL_PASS && 'EMAIL_PASS is not set',
    ].filter(Boolean) : [],
    recommendations: !isConfigured ? [
      'Make sure .env.local exists in project root',
      'Restart your dev server after creating/editing .env.local',
      'Check for typos in variable names (EMAIL, EMAIL_USER, EMAIL_PASS)',
      'Make sure no extra spaces or quotes around values'
    ] : []
  })
}

