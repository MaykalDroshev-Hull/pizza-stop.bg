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

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
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
}

export const emailService = new EmailService()
