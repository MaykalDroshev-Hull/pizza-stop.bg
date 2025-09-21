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
            max-width: 200px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
          }
          .welcome-title {
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(225, 29, 72, 0.45);
          }
          .order-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(225, 29, 72, 0.6);
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
            max-width: 200px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
          }
          .reset-title {
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(225, 29, 72, 0.45);
          }
          .reset-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(225, 29, 72, 0.6);
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            <a href="${resetUrl}" style="background: linear-gradient(90deg, #e11d48, #ff7f11); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; word-break: break-all; font-weight: 700;">${resetUrl}</a>
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
            <p style="margin: 0; font-weight: 800; background: linear-gradient(90deg, #e11d48, #ff7f11); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 16px;">
              ${item.quantity} × ${item.price.toFixed(2)} лв.
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #cbd5e1;">
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
            max-width: 200px;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
          }
          .order-title {
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .order-button {
            display: inline-block;
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 18px;
            margin: 10px;
            transition: all 0.3s ease;
            text-align: center;
            min-width: 200px;
            box-shadow: 0 8px 20px rgba(225, 29, 72, 0.45);
          }
          .order-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(225, 29, 72, 0.6);
          }
          .secondary-button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #f8fafc;
          }
          .secondary-button:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
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
            background: linear-gradient(90deg, #e11d48, #ff7f11);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
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
            <a href="tel:+359888123456" style="background: linear-gradient(90deg, #e11d48, #ff7f11); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-decoration: none; font-weight: 700;">+359 888 123 456</a>
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
