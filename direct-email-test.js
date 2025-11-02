// Direct test script to send email to hm.websiteprovisioning@gmail.com
require('dotenv').config({ path: '.env.local' })

const nodemailer = require('nodemailer');

async function sendTestEmail() {
  try {

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content (simple version)
    const mailOptions = {
      from: `"Pizza Stop Test" <${process.env.EMAIL}>`,
      to: 'hm.websiteprovisioning@gmail.com',
      subject: 'Test Email from Pizza Stop - Console Errors Fixed! ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff7f11;">🍕 Pizza Stop - Console Errors Fixed!</h1>
          <p>Hello!</p>
          <p>This is a test email to confirm that all console errors have been fixed in the Pizza Stop application.</p>
          <h2>✅ Fixed Issues:</h2>
          <ul>
            <li><strong>Favicon Errors:</strong> Removed corrupted favicon.ico and replaced with proper PNG icons</li>
            <li><strong>Database Connection:</strong> Fixed menu data loading from Supabase database</li>
            <li><strong>Error Handling:</strong> Added proper error states and user feedback</li>
            <li><strong>Icon System:</strong> Updated site.webmanifest and layout.tsx with working icons</li>
          </ul>
          <p>The application should now run without console errors!</p>
          <p>Best regards,<br>Pizza Stop Development Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('Stack:', error.stack);
  }
}

sendTestEmail();
