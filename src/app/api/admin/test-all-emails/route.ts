import { NextRequest, NextResponse } from 'next/server'

const orderDetails = {
  items: [
    {
      name: 'Маргарита',
      size: 'Голяма',
      quantity: 1,
      price: 18.50,
      addons: [{ name: 'Допълнително сирене', price: 2.00 }],
      comment: 'Без лук, моля'
    },
    {
      name: 'Пепперони',
      size: 'Средна',
      quantity: 2,
      price: 15.00,
      addons: [],
      comment: ''
    }
  ],
  totalAmount: 50.50,
  orderTime: 'Веднага',
  orderType: 'Доставка',
  paymentMethod: 'С карта на адрес',
  location: 'ул. Главна №15, Ловеч'
}

async function callEmailAPI(endpoint: string, data: any, request: NextRequest) {
  // Get the base URL from the request to use the correct port
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`
  
  const response = await fetch(`${baseUrl}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  return {
    status: response.status,
    data: await response.json().catch(() => null)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}))
    
    // Get emails and name from request or use defaults
    const emailsInput = body.emails || 'hm.websiteprovisioning@gmail.com'
    const recipientName = body.name || 'Pizza Stop Test User'
    const selectedTypes = body.selectedTypes || {
      registration: true,
      orderConfirmation: true,
      orderReadyTime: true
    }
    
    // Parse comma-separated emails and clean them
    const emailList = emailsInput
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0)
    
    if (emailList.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid email addresses provided',
        message: 'Please provide at least one email address'
      }, { status: 400 })
    }

    // Send emails to all recipients
    const allResults = []
    
    for (const emailAddress of emailList) {
      const results = []

      // Test 1: Registration Email (only if selected)
      if (selectedTypes.registration) {
        const test1 = await callEmailAPI('test-email', { to: emailAddress }, request)
        results.push({
          type: 'Registration Email',
          status: test1.status === 200 ? 'success' : 'failed',
          statusCode: test1.status,
          email: emailAddress
        })
      }

      // Test 2: Order Confirmation & Password Reset (only if selected)
      if (selectedTypes.orderConfirmation) {
        const test2 = await callEmailAPI('test-emails', {
          to: emailAddress,
          name: recipientName,
          orderDetails,
          orderId: 'TEST-' + Date.now()
        }, request)
        results.push({
          type: 'Order Confirmation & Password Reset',
          status: test2.status === 200 ? 'success' : 'failed',
          statusCode: test2.status,
          email: emailAddress
        })
      }

      // Test 3: Order Ready Time (only if selected)
      if (selectedTypes.orderReadyTime) {
        const test3 = await callEmailAPI('send-ready-time-email', {
          to: emailAddress,
          name: recipientName,
          orderId: 'TEST-' + Date.now(),
          readyTimeMinutes: 25,
          orderDetails
        }, request)
        results.push({
          type: 'Order Ready Time',
          status: test3.status === 200 ? 'success' : 'failed',
          statusCode: test3.status,
          email: emailAddress
        })
      }

      allResults.push(...results)
    }

    const allSuccess = allResults.every(r => r.status === 'success')
    const emailsStr = emailList.length === 1 ? emailList[0] : `${emailList.length} addresses`

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess 
        ? `All test emails sent successfully to ${emailsStr}` 
        : 'Some emails failed to send',
      results: allResults,
      emailsSentTo: emailList,
      recipientName
    })
  } catch (error: any) {
    console.error('Error testing emails:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to send test emails'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Simple GET endpoint that shows info
  return NextResponse.json({
    message: 'Email Testing Endpoint',
    instructions: 'Send a POST request with { emails: "email@test.com", name: "Name" } to trigger test emails',
    defaultEmail: 'hm.websiteprovisioning@gmail.com',
    multipleEmails: 'Separate multiple emails with commas',
    availableTests: [
      'Registration Email',
      'Order Confirmation & Password Reset',
      'Order Ready Time Email'
    ]
  })
}

