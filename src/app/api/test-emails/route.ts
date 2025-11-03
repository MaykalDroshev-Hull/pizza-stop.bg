import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '../../../utils/emailService'

export async function POST(request: NextRequest) {
  try {
    const testEmail = 'hm.websiteprovisioning@gmail.com'
    const testName = 'Pizza Stop Test User'


    // Test 1: Welcome Email
    await emailService.sendWelcomeEmail({
      to: testEmail,
      name: testName
    })

    // Test 2: Password Reset Email
    const resetToken = 'test-token-12345'
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pizza-stop.bg'}/reset-password?token=${resetToken}`
    
    await emailService.sendPasswordResetEmail({
      to: testEmail,
      name: testName,
      resetToken: resetToken,
      resetUrl: resetUrl
    })

    // Test 3: Order Confirmation Email
    const orderDetails = {
      items: [
        {
          name: 'Маргарита',
          size: 'Голяма',
          quantity: 1,
          price: 18.50,
          addons: [
            { name: 'Допълнително сирене', price: 2.00 },
            { name: 'Рукола', price: 1.50 }
          ],
          comment: 'Без лук, моля'
        },
        {
          name: 'Кока кола',
          size: '330мл',
          quantity: 2,
          price: 2.30,
          addons: []
        },
        {
          name: 'Чизбургер',
          size: 'Среден',
          quantity: 1,
          price: 12.90,
          addons: [
            { name: 'Допълнителна месо', price: 3.00 },
            { name: 'Бекон', price: 2.50 }
          ]
        }
      ],
      totalAmount: 45.50,
      orderTime: 'Веднага',
      orderType: 'Доставка',
      paymentMethod: 'С карта на адрес',
      location: 'ул. "Главна" №15, ет. 3, ап. 8, Ловеч',
      estimatedTime: '30-45 минути',
      addressInstructions: 'Влезте от главния вход, звъннете на звънеца на апартамент 8',
      specialInstructions: 'Моля, доставете до 19:30 часа'
    }

    await emailService.sendOrderConfirmationEmail({
      to: testEmail,
      name: testName,
      orderId: '12345',
      orderDetails: orderDetails
    })

    return NextResponse.json({
      success: true,
      message: 'All test emails sent successfully!',
      details: {
        recipient: testEmail,
        emailsSent: [
          'Welcome Email',
          'Password Reset Email', 
          'Order Confirmation Email'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error sending test emails:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test emails',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
