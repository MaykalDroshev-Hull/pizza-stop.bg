import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '../../../utils/emailService'

export async function POST(request: NextRequest) {
  try {
    const testEmail = 'mariyanaasenovadrosheva@gmail.com'
    const testName = 'Марияна Дрошева'

    console.log('🚀 Sending test emails...')

    // Test 1: Welcome Email
    console.log('📧 Sending welcome email...')
    await emailService.sendWelcomeEmail({
      to: testEmail,
      name: testName
    })
    console.log('✅ Welcome email sent')

    // Test 2: Password Reset Email
    console.log('📧 Sending password reset email...')
    const resetToken = 'test-token-12345'
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pizza-stop.bg'}/reset-password?token=${resetToken}`
    
    await emailService.sendPasswordResetEmail({
      to: testEmail,
      name: testName,
      resetToken: resetToken,
      resetUrl: resetUrl
    })
    console.log('✅ Password reset email sent')

    // Test 3: Order Confirmation Email
    console.log('📧 Sending order confirmation email...')
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
      estimatedTime: '30-45 минути'
    }

    await emailService.sendOrderConfirmationEmail({
      to: testEmail,
      name: testName,
      orderId: '12345',
      orderDetails: orderDetails
    })
    console.log('✅ Order confirmation email sent')

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
