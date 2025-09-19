import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  name: string
}

interface PasswordResetEmailOptions {
  to: string
  name: string
  resetToken: string
  resetUrl: string
}

interface OrderConfirmationEmailOptions {
  to: string
  name: string
  orderId: string
  orderDetails: {
    items: Array<{
      name: string
      size?: string
      quantity: number
      price: number
      addons?: Array<{ name: string; price?: number }>
      comment?: string
    }>
    totalAmount: number
    orderTime: string
    orderType: string
    paymentMethod: string
    location: string
    estimatedTime?: string
  }
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL,
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
      },
    })
  }

  async sendWelcomeEmail({ to, name }: EmailOptions): Promise<void> {
    const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/images/home/logo.png`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Добре дошли в Pizza Stop!</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            max-width: 200px;
            height: auto;
          }
          .welcome-title {
            color: #d32f2f;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
          }
          .welcome-text {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #555;
          }
          .order-button {
            display: inline-block;
            background-color: #d32f2f;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            transition: background-color 0.3s ease;
          }
          .order-button:hover {
            background-color: #b71c1c;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 14px;
          }
          .highlight {
            color: #d32f2f;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo">
            <img src="${logoUrl}" alt="Pizza Stop Logo" />
          </div>
          
          <h1 class="welcome-title">Добре дошли в Pizza Stop! 🍕</h1>
          
          <p class="welcome-text">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Радваме се, че се присъединихте към нашето семейство!<br>
            Сега можете да поръчвате най-вкусните пици и храни от нас.
          </p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/order" class="order-button">
              ПОРЪЧАЙ ОТ ТУК
            </a>
          </div>
          
          <p class="welcome-text">
            Благодарим ви за доверието!<br>
            Екипът на Pizza Stop
          </p>
          
          <div class="footer">
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2024 Pizza Stop. Всички права запазени.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.NEXT_PUBLIC_EMAIL}>`,
      to,
      subject: 'Добре дошли в Pizza Stop! 🍕',
      html: htmlContent,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Welcome email sent successfully to ${to}`)
    } catch (error) {
      console.error('Error sending welcome email:', error)
      throw new Error('Failed to send welcome email')
    }
  }

  async sendPasswordResetEmail({ to, name, resetToken, resetUrl }: PasswordResetEmailOptions): Promise<void> {
    const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/images/home/logo.png`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Възстановяване на парола - Pizza Stop</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            max-width: 200px;
            height: auto;
          }
          .reset-title {
            color: #d32f2f;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
          }
          .reset-text {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #555;
          }
          .reset-button {
            display: inline-block;
            background-color: #d32f2f;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            transition: background-color 0.3s ease;
          }
          .reset-button:hover {
            background-color: #b71c1c;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 14px;
          }
          .highlight {
            color: #d32f2f;
            font-weight: bold;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo">
            <img src="${logoUrl}" alt="Pizza Stop Logo" />
          </div>
          
          <h1 class="reset-title">Възстановяване на парола 🔐</h1>
          
          <p class="reset-text">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Получихме заявка за възстановяване на паролата на вашия акаунт.
          </p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              ВЪЗСТАНОВИ ПАРОЛАТА
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Важно:</strong><br>
            Този линк е валиден само 1 час.<br>
            Ако не сте вие заявили възстановяването, моля игнорирайте този имейл.
          </div>
          
          <p class="reset-text">
            Ако имате проблеми с бутона, копирайте този линк в браузъра:<br>
            <a href="${resetUrl}" style="color: #d32f2f; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div class="footer">
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2024 Pizza Stop. Всички права запазени.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.NEXT_PUBLIC_EMAIL}>`,
      to,
      subject: 'Възстановяване на парола - Pizza Stop 🔐',
      html: htmlContent,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Password reset email sent successfully to ${to}`)
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw new Error('Failed to send password reset email')
    }
  }

  async sendOrderConfirmationEmail({ to, name, orderId, orderDetails }: OrderConfirmationEmailOptions): Promise<void> {
    const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/images/home/logo.png`
    
    // Generate items HTML
    const itemsHtml = orderDetails.items.map(item => `
      <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: bold; color: #333; font-size: 16px;">
              ${item.name}${item.size ? ` (${item.size})` : ''}
            </p>
            ${item.addons && item.addons.length > 0 ? `
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                Добавки: ${item.addons.map(addon => addon.name).join(', ')}
              </p>
            ` : ''}
            ${item.comment ? `
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666; font-style: italic;">
                Бележка: ${item.comment}
              </p>
            ` : ''}
          </div>
          <div style="text-align: right; min-width: 120px;">
            <p style="margin: 0; font-weight: bold; color: #d32f2f; font-size: 16px;">
              ${item.quantity} × ${item.price.toFixed(2)} лв.
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
              Общо: ${(item.quantity * item.price).toFixed(2)} лв.
            </p>
          </div>
        </div>
      </div>
    `).join('')
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Потвърждение за поръчка - Pizza Stop</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            max-width: 200px;
            height: auto;
          }
          .order-title {
            color: #d32f2f;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
          }
          .order-id {
            background-color: #f8f9fa;
            border: 2px solid #d32f2f;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
          }
          .order-id h3 {
            margin: 0;
            color: #d32f2f;
            font-size: 24px;
          }
          .order-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .detail-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #d32f2f;
          }
          .detail-label {
            color: #666;
            font-weight: 500;
          }
          .detail-value {
            color: #333;
            font-weight: 600;
          }
          .items-section {
            margin: 25px 0;
          }
          .items-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #d32f2f;
            padding-bottom: 8px;
          }
          .total-section {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #d32f2f;
            margin: 0;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .order-button {
            display: inline-block;
            background-color: #d32f2f;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px;
            transition: background-color 0.3s ease;
          }
          .order-button:hover {
            background-color: #b71c1c;
          }
          .secondary-button {
            background-color: #6c757d;
          }
          .secondary-button:hover {
            background-color: #545b62;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #888;
            font-size: 14px;
          }
          .highlight {
            color: #d32f2f;
            font-weight: bold;
          }
          .estimated-time {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
          }
          .estimated-time h4 {
            margin: 0 0 5px 0;
            color: #155724;
            font-size: 18px;
          }
          .estimated-time p {
            margin: 0;
            color: #155724;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo">
            <img src="${logoUrl}" alt="Pizza Stop Logo" />
          </div>
          
          <h1 class="order-title">Поръчката е потвърдена! 🍕</h1>
          
          <div class="order-id">
            <h3>Номер на поръчката: #${orderId}</h3>
          </div>
          
          <p style="text-align: center; font-size: 16px; margin-bottom: 30px;">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Благодарим ви за поръчката! Ще започнем да я приготвяме веднага.
          </p>
          
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Време на поръчка:</span>
              <span class="detail-value">${orderDetails.orderTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Начин на получаване:</span>
              <span class="detail-value">${orderDetails.orderType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Адрес:</span>
              <span class="detail-value">${orderDetails.location}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Начин на плащане:</span>
              <span class="detail-value">${orderDetails.paymentMethod}</span>
            </div>
          </div>
          
          ${orderDetails.estimatedTime ? `
            <div class="estimated-time">
              <h4>⏰ Очаквано време</h4>
              <p>${orderDetails.estimatedTime}</p>
            </div>
          ` : ''}
          
          <div class="items-section">
            <h3 class="items-title">Артикули в поръчката</h3>
            ${itemsHtml}
          </div>
          
          <div class="total-section">
            <h3 class="total-amount">Обща сума: ${orderDetails.totalAmount.toFixed(2)} лв.</h3>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/order" class="order-button">
              ПОРЪЧАЙ ОТНОВО
            </a>
            <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/dashboard" class="order-button secondary-button">
              МОИТЕ ПОРЪЧКИ
            </a>
          </div>
          
          <p style="text-align: center; font-size: 14px; color: #666;">
            Ако имате въпроси относно поръчката, моля свържете се с нас на 
            <a href="tel:+359888123456" style="color: #d32f2f; text-decoration: none;">+359 888 123 456</a>
          </p>
          
          <div class="footer">
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2024 Pizza Stop. Всички права запазени.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.NEXT_PUBLIC_EMAIL}>`,
      to,
      subject: `Потвърждение за поръчка #${orderId} - Pizza Stop 🍕`,
      html: htmlContent,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Order confirmation email sent successfully to ${to}`)
    } catch (error) {
      console.error('Error sending order confirmation email:', error)
      throw new Error('Failed to send order confirmation email')
    }
  }
}

export const emailService = new EmailService()
