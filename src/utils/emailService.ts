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
    addressInstructions?: string
    specialInstructions?: string
  }
}

interface OrderReadyTimeEmailOptions {
  to: string
  name: string
  orderId: string
  readyTimeMinutes: number
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
    addressInstructions?: string
    specialInstructions?: string
  }
}

interface DeliveryETAEmailOptions {
  to: string
  name: string
  orderId: string
  etaMinutes: number
  estimatedArrivalTime: string
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
    addressInstructions?: string
    specialInstructions?: string
  }
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    })
  }

  async sendWelcomeEmail({ to, name }: EmailOptions): Promise<void> {
    // Skip sending emails to printer guest accounts
    if (to.startsWith('printer_guest')) {
      console.log(`Skipping welcome email for printer guest account: ${to}`);
      return;
    }
    
    const logoUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU4NzE1NjI1LCJleHAiOjI3MTg3MDYwMjV9.PEJqf8J-Su8iIHobLQ3CZrmq1XnYiT2lRbnqwyiX1jE'
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Добре дошли в Pizza Stop!</title>
        <style>
          body {
            font-family: Inter, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #f8fafc;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(180deg, #0b1020 0%, #0b1020 50%, #111827 100%);
            background-color: #0b1020;
          }
          .email-container {
            background-color: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            width: 80px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
          }
          .welcome-title {
            color: #ff7f11;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 20px;
          }
          .welcome-text {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #cbd5e1;
          }
          .order-button {
            display: inline-block;
            background-color: #ff7f11;
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            border: none;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            color: #cbd5e1;
            font-size: 14px;
          }
          .highlight {
            color: #ff7f11;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          
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
            <p>Телефон: <a href="tel:+359686700070" style="color: #ff7f11; text-decoration: none; font-weight: 700;">068 670 070</a></p>
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2025 Pizza Stop. Всички права запазени.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              Изработка от <a href="https://www.hmwspro.com/bg" target="_blank" rel="noopener noreferrer" style="color: #ff7f11; text-decoration: none; font-weight: 700;">H&M WS Pro</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.EMAIL_USER}>`,
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
    // Skip sending emails to printer guest accounts
    if (to.startsWith('printer_guest')) {
      console.log(`Skipping password reset email for printer guest account: ${to}`);
      return;
    }
    
    const logoUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU4NzE1NjI1LCJleHAiOjI3MTg3MDYwMjV9.PEJqf8J-Su8iIHobLQ3CZrmq1XnYiT2lRbnqwyiX1jE'
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Възстановяване на парола - Pizza Stop</title>
        <style>
          body {
            font-family: Inter, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #f8fafc;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(180deg, #0b1020 0%, #0b1020 50%, #111827 100%);
            background-color: #0b1020;
          }
          .email-container {
            background-color: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            width: 80px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
          }
          .reset-title {
            color: #ff7f11;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 20px;
          }
          .reset-text {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #cbd5e1;
          }
          .reset-button {
            display: inline-block;
            background-color: #ff7f11;
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            border: none;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            color: #cbd5e1;
            font-size: 14px;
          }
          .highlight {
            color: #ff7f11;
            font-weight: 700;
          }
          .warning {
            background-color: rgba(255, 127, 17, 0.1);
            border: 1px solid rgba(255, 127, 17, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            color: #ff7f11;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          
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
            <a href="${resetUrl}" style="color: #ff7f11; word-break: break-all; font-weight: 700;">${resetUrl}</a>
          </p>
          
          <div class="footer">
            <p>Телефон: <a href="tel:+359686700070" style="color: #ff7f11; text-decoration: none; font-weight: 700;">068 670 070</a></p>
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2025 Pizza Stop. Всички права запазени.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              Изработка от <a href="https://www.hmwspro.com/bg" target="_blank" rel="noopener noreferrer" style="color: #ff7f11; text-decoration: none; font-weight: 700;">H&M WS Pro</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.EMAIL_USER}>`,
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
    // Skip sending emails to printer guest accounts
    if (to.startsWith('printer_guest')) {
      console.log(`Skipping order confirmation email for printer guest account: ${to}`);
      return;
    }
    
    const logoUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU4NzE1NjI1LCJleHAiOjI3MTg3MDYwMjV9.PEJqf8J-Su8iIHobLQ3CZrmq1XnYiT2lRbnqwyiX1jE'
    
    // Generate items HTML
    const itemsHtml = orderDetails.items.map(item => `
      <div style="margin-bottom: 15px; padding: 16px; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 800; color: #f8fafc; font-size: 16px;">
              ${item.name}${item.size ? ` (${item.size})` : ''}
            </p>
            ${item.addons && item.addons.length > 0 ? `
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #cbd5e1;">
                Добавки: ${item.addons.map(addon => addon.name).join(', ')}
              </p>
            ` : ''}
            ${item.comment ? `
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #cbd5e1; font-style: italic;">
                Бележка: ${item.comment}
              </p>
            ` : ''}
          </div>
          <div style="text-align: right; min-width: 120px;">
            <p style="margin: 0; font-weight: 800; color: #ff7f11; font-size: 16px;">
              ${item.quantity} × ${item.price.toFixed(2)} лв.
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
              Общо: ${(item.quantity * (item.price || 0)).toFixed(2)} лв.
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
            font-family: Inter, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #f8fafc;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(180deg, #0b1020 0%, #0b1020 50%, #111827 100%);
            background-color: #0b1020;
          }
          .email-container {
            background-color: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo img {
            width: 80px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
          }
          .order-title {
            color: #ff7f11;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 20px;
          }
          .order-id {
            background-color: rgba(255, 255, 255, 0.06);
            border: 2px solid rgba(225, 29, 72, 0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .order-id h3 {
            margin: 0;
            color: #ff7f11;
            font-size: 24px;
            font-weight: 800;
          }
          .order-details {
            background-color: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .detail-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #ff7f11;
          }
          .detail-label {
            color: #cbd5e1;
            font-weight: 500;
          }
          .detail-value {
            color: #f8fafc;
            font-weight: 600;
          }
          .items-section {
            margin: 25px 0;
          }
          .items-title {
            font-size: 20px;
            font-weight: 800;
            color: #f8fafc;
            margin-bottom: 15px;
            border-bottom: 2px solid rgba(225, 29, 72, 0.3);
            padding-bottom: 8px;
          }
          .total-section {
            background-color: rgba(255, 127, 17, 0.1);
            border: 1px solid rgba(255, 127, 17, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .total-amount {
            font-size: 24px;
            font-weight: 800;
            color: #ff7f11;
            margin: 0;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .order-button {
            display: inline-block;
            background-color: #ff7f11;
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 18px;
            margin: 10px;
            text-align: center;
            min-width: 200px;
            border: none;
          }
          .secondary-button {
            background-color: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #f8fafc;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            color: #cbd5e1;
            font-size: 14px;
          }
          .highlight {
            color: #ff7f11;
            font-weight: 700;
          }
          .estimated-time {
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            text-align: center;
          }
          .estimated-time h4 {
            margin: 0 0 5px 0;
            color: #10b981;
            font-size: 18px;
            font-weight: 700;
          }
          .estimated-time p {
            margin: 0;
            color: #10b981;
            font-weight: 500;
          }
          .delivery-instructions {
            background-color: rgba(255, 127, 17, 0.1);
            border: 1px solid rgba(255, 127, 17, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
          }
          .delivery-instructions h4 {
            margin: 0 0 10px 0;
            color: #ff7f11;
            font-size: 16px;
            font-weight: 700;
          }
          .delivery-instructions p {
            margin: 5px 0;
            color: #f8fafc;
            font-size: 14px;
            line-height: 1.5;
          }
          .instruction-type {
            font-weight: 600;
            color: #ff7f11;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          
          <h1 class="order-title">Поръчката е потвърдена! 🍕</h1>
          
          <div class="order-id">
            <h3>Номер на поръчката: #${orderId}</h3>
          </div>
          
          <p style="text-align: center; font-size: 16px; margin-bottom: 30px; color: #cbd5e1;">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Благодарим ви за поръчката!
          </p>
          
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Време на поръчка: </span>
              <span class="detail-value">${orderDetails.orderTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Начин на получаване: </span>
              <span class="detail-value">${orderDetails.orderType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Адрес: </span>
              <span class="detail-value">${orderDetails.location}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Начин на плащане: </span>
              <span class="detail-value">${orderDetails.paymentMethod}</span>
            </div>
          </div>
          
          ${(orderDetails.addressInstructions || orderDetails.specialInstructions) ? `
            <div class="delivery-instructions">
              <h4>📝 Инструкции за доставка</h4>
              ${orderDetails.addressInstructions ? `
                <p><span class="instruction-type">Адрес:</span> ${orderDetails.addressInstructions}</p>
              ` : ''}
              ${orderDetails.specialInstructions ? `
                <p><span class="instruction-type">Допълнителни инструкции:</span> ${orderDetails.specialInstructions}</p>
              ` : ''}
            </div>
          ` : ''}
          
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
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pizza-stop.bg'}/order" class="order-button">
              ПОРЪЧАЙ ОТНОВО
            </a>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pizza-stop.bg'}/user" class="order-button secondary-button">
              МОИТЕ ПОРЪЧКИ
            </a>
          </div>
          
          <p style="text-align: center; font-size: 14px; color: #cbd5e1;">
            Ако имате въпроси относно поръчката, моля свържете се с нас на 
            <a href="tel:+359686700070" style="color: #ff7f11; text-decoration: none; font-weight: 700;">068 670 070</a>
          </p>
          
          <div class="footer">
            <p>Телефон: <a href="tel:+359686700070" style="color: #ff7f11; text-decoration: none; font-weight: 700;">068 670 070</a></p>
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2025 Pizza Stop. Всички права запазени.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              Изработка от <a href="https://www.hmwspro.com/bg" target="_blank" rel="noopener noreferrer" style="color: #ff7f11; text-decoration: none; font-weight: 700;">H&M WS Pro</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.EMAIL_USER}>`,
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

  async sendDeliveryETAEmail({ to, name, orderId, etaMinutes, estimatedArrivalTime, orderDetails }: DeliveryETAEmailOptions): Promise<void> {
    // Skip sending emails to printer guest accounts
    if (to.startsWith('printer_guest')) {
      console.log(`Skipping delivery ETA email for printer guest account: ${to}`);
      return;
    }
    
    const logoUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU4NzE1NjI1LCJleHAiOjI3MTg3MDYwMjV9.PEJqf8J-Su8iIHobLQ3CZrmq1XnYiT2lRbnqwyiX1jE'
    
    // Generate items HTML
    const itemsHtml = orderDetails.items.map(item => `
      <div style="margin-bottom: 15px; padding: 16px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.name}</div>
            ${item.size ? `<div style="font-size: 14px; color: #666; margin-bottom: 4px;">Размер: ${item.size}</div>` : ''}
            ${item.addons && item.addons.length > 0 ? `
              <div style="font-size: 14px; color: #666;">
                Добавки: ${item.addons.map(addon => addon.name).join(', ')}
              </div>
            ` : ''}
            ${item.comment ? `<div style="font-size: 14px; color: #666; font-style: italic; margin-top: 4px;">${item.comment}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 600; color: #333;">${item.quantity}x</div>
            <div style="font-weight: 700; color: #ff7f11; font-size: 16px;">${item.price.toFixed(2)} лв.</div>
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
          <title>Вашата поръчка е на път - Pizza Stop</title>
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
            width: 80px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .eta-title {
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 20px;
          }
          .eta-subtitle {
            font-size: 18px;
            text-align: center;
            margin-bottom: 30px;
            color: #555;
          }
          .eta-highlight {
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
          }
          .eta-box {
            background: linear-gradient(135deg, rgba(225, 29, 72, 0.1), rgba(255, 127, 17, 0.1));
            border: 2px solid rgba(255, 127, 17, 0.3);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
          }
          .eta-time {
            font-size: 32px;
            font-weight: 800;
            color: #ff7f11;
            margin-bottom: 8px;
          }
          .eta-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 4px;
          }
          .eta-arrival {
            font-size: 18px;
            font-weight: 600;
            color: #333;
          }
          .order-info {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .info-label {
            color: #666;
          }
          .info-value {
            color: #333;
            font-weight: 500;
          }
          .items-section {
            margin: 24px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #333;
            margin-bottom: 16px;
            text-align: center;
          }
          .total-section {
            background: linear-gradient(135deg, rgba(225, 29, 72, 0.1), rgba(255, 127, 17, 0.1));
            border: 1px solid rgba(255, 127, 17, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
          }
          .total-amount {
            font-size: 24px;
            font-weight: 800;
            color: #ff7f11;
            margin-bottom: 4px;
          }
          .total-label {
            font-size: 14px;
            color: #666;
          }
          .contact-info {
            background-color: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
          }
          .contact-title {
            font-size: 16px;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 8px;
          }
          .contact-text {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
            font-size: 14px;
          }
          .highlight {
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo">
            <img src="${logoUrl}" alt="Pizza Stop Logo" />
          </div>

          <h1 class="eta-title">Вашата поръчка е на път! 🚗</h1>

          <p class="eta-subtitle">
            Здравейте, <span class="highlight">${name}</span>!<br>
            Вашата поръчка #${orderId} е взета от шофьора и е на път към вас.
          </p>

          <div class="eta-box">
            <div class="eta-time">${etaMinutes} мин</div>
            <div class="eta-label">Очаквано време за доставка</div>
            <div class="eta-arrival">Приблизително пристигане: ${estimatedArrivalTime}</div>
          </div>

          <div class="order-info">
            <div class="info-row">
              <span class="info-label">Номер на поръчка:</span>
              <span class="info-value">#${orderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Време на поръчка:</span>
              <span class="info-value">${orderDetails.orderTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Тип поръчка:</span>
              <span class="info-value">${orderDetails.orderType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Начин на плащане:</span>
              <span class="info-value">${orderDetails.paymentMethod}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адрес:</span>
              <span class="info-value">${orderDetails.location}</span>
            </div>
          </div>

          <div class="items-section">
            <h3 class="section-title">Вашата поръчка</h3>
            ${itemsHtml}
          </div>

          <div class="total-section">
            <div class="total-amount">${orderDetails.totalAmount.toFixed(2)} лв.</div>
            <div class="total-label">Обща сума</div>
          </div>

          <div class="contact-info">
            <div class="contact-title">📞 Нужда от помощ?</div>
            <div class="contact-text">Телефон: <a href="tel:+359686700070" style="color: #3b82f6; text-decoration: none; font-weight: 700;">068 670 070</a></div>
            <div class="contact-text">Email: info@pizza-stop.bg</div>
          </div>

          <div class="footer">
            <p>Благодарим ви, че избрахте <span class="highlight">Pizza Stop</span>!</p>
            <p>Насладете се на вкусната храна! 🍕</p>
            <p>© 2025 Pizza Stop. Всички права запазени.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Изработка от <a href="https://www.hmwspro.com/bg" target="_blank" rel="noopener noreferrer" style="color: #ff7f11; text-decoration: none; font-weight: 700;">H&M WS Pro</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    try {
      await this.transporter.sendMail({
        from: `"Pizza Stop" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Вашата поръчка е на път - ETA: ${etaMinutes} минути | Pizza Stop`,
        html: htmlContent,
      })
      
      console.log(`✅ Delivery ETA email sent successfully to ${to} for order ${orderId}`)
    } catch (error) {
      console.error('Error sending delivery ETA email:', error)
      throw new Error('Failed to send delivery ETA email')
    }
  }

  async sendOrderReadyTimeEmail({ to, name, orderId, readyTimeMinutes, orderDetails }: OrderReadyTimeEmailOptions): Promise<void> {
    // Skip sending emails to printer guest accounts
    if (to.startsWith('printer_guest')) {
      console.log(`Skipping order ready time email for printer guest account: ${to}`);
      return;
    }
    
    const logoUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU4NzE1NjI1LCJleHAiOjI3MTg3MDYwMjV9.PEJqf8J-Su8iIHobLQ3CZrmq1XnYiT2lRbnqwyiX1jE'
    
    // Generate items HTML
    const itemsHtml = orderDetails.items.map(item => `
      <div style="margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
          ${item.name}${item.size ? ` (${item.size})` : ''}
        </div>
        <div style="color: #666; font-size: 14px;">
          Количество: ${item.quantity} × ${item.price.toFixed(2)} лв. = ${(item.quantity * item.price).toFixed(2)} лв.
        </div>
        ${item.addons && item.addons.length > 0 ? `
          <div style="color: #d32f2f; font-size: 13px; margin-top: 5px;">
            Добавки: ${item.addons.map(addon => addon.name).join(', ')}
          </div>
        ` : ''}
        ${item.comment ? `
          <div style="color: #666; font-size: 13px; margin-top: 5px; font-style: italic;">
            Коментар: ${item.comment}
          </div>
        ` : ''}
      </div>
    `).join('')

    // Format ready time text
    const readyTimeText = readyTimeMinutes < 60 
      ? `${readyTimeMinutes} минути` 
      : `Време за приготвяне: ${Math.floor(readyTimeMinutes / 60)} час/часа ${readyTimeMinutes % 60 > 0 ? `и ${readyTimeMinutes % 60} минути` : ''}`

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Поръчката започва да се приготвя - Pizza Stop!</title>
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
            width: 80px;
            height: auto;
          }
          .title {
            color: #d32f2f;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
          }
          .ready-time-box {
            background-color: #e8f5e8;
            border: 2px solid #4caf50;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .ready-time-text {
            color: #2e7d32;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .ready-time-subtitle {
            color: #388e3c;
            font-size: 16px;
          }
          .order-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .items-section {
            margin: 20px 0;
          }
          .section-title {
            color: #d32f2f;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #d32f2f;
            padding-bottom: 5px;
          }
          .total-section {
            background-color: #d32f2f;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .total-text {
            font-size: 18px;
            font-weight: bold;
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
          
          <h1 class="title">Поръчката започва да се приготвя! 🍕</h1>
          
          <div class="ready-time-box">
            <div class="ready-time-text">⏰ ${readyTimeText}</div>
            <div class="ready-time-subtitle">Ще бъде готова за вземане/доставка</div>
          </div>
          
          <p style="text-align: center; font-size: 16px; color: #555; margin-bottom: 30px;">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Радваме се да ви уведомим, че започнахме да приготвяме вашата поръчка!
          </p>
          
          <div class="order-info">
            <div class="info-row">
              <span class="info-label">Номер на поръчката:</span>
              <span class="info-value">#${orderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Време на поръчка:</span>
              <span class="info-value">${orderDetails.orderTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Начин на получаване:</span>
              <span class="info-value">${orderDetails.orderType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адрес:</span>
              <span class="info-value">${orderDetails.location}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Начин на плащане:</span>
              <span class="info-value">${orderDetails.paymentMethod}</span>
            </div>
          </div>
          
          <div class="items-section">
            <h2 class="section-title">Артикули в поръчката</h2>
            ${itemsHtml}
          </div>
          
          <div class="total-section">
            <div class="total-text">Обща сума: ${orderDetails.totalAmount.toFixed(2)} лв.</div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/order" 
               style="display: inline-block; background-color: #d32f2f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              ПОРЪЧАЙ ОТНОВО МОИТЕ ПОРЪЧКИ
            </a>
          </div>
          
          <p style="text-align: center; font-size: 14px; color: #666;">
            Ако имате въпроси относно поръчката, моля свържете се с нас на 
            <a href="tel:+359686700070" style="color: #d32f2f; text-decoration: none; font-weight: 700;">068 670 070</a>
          </p>
          
          <div class="footer">
            <p>Телефон: <a href="tel:+359686700070" style="color: #d32f2f; text-decoration: none; font-weight: 700;">068 670 070</a></p>
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© 2025 Pizza Stop. Всички права запазени.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #888;">
              Изработка от <a href="https://www.hmwspro.com/bg" target="_blank" rel="noopener noreferrer" style="color: #d32f2f; text-decoration: none; font-weight: 700;">H&M WS Pro</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"Pizza Stop" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Поръчката започва да се приготвя - #${orderId} - Pizza Stop 🍕`,
      html: htmlContent,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Order ready time email sent successfully to ${to}`)
    } catch (error) {
      console.error('Error sending order ready time email:', error)
      throw new Error('Failed to send order ready time email')
    }
  }
}

export const emailService = new EmailService()
