// Script to send all mock emails to hm.websiteprovisioning@gmail.com
require('dotenv').config({ path: '.env.local' })

const http = require('http');

const TEST_EMAIL = 'hm.websiteprovisioning@gmail.com';
const TEST_NAME = 'Pizza Stop Test User';

console.log(`🚀 Sending mock emails to ${TEST_EMAIL}...`);

// Test data for emails
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
};

async function sendEmail(endpoint, data, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`📧 Sending ${description}...`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ ${description} sent successfully`);
            resolve(response);
          } else {
            console.log(`❌ ${description} failed:`, response);
            reject(new Error(`${description} failed: ${response.error}`));
          }
        } catch (e) {
          console.log(`❌ ${description} error:`, data);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${description} request error:`, e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function sendAllEmails() {
  try {
    console.log('🍕 Starting Pizza Stop Email Test Suite...\n');

    // 1. Test Registration/Welcome Email
    await sendEmail('test-email', {}, 'Registration/Welcome Email');

    // 2. Test Password Reset Email
    const resetToken = 'test-reset-token-' + Date.now();
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pizza-stop.bg'}/reset-password?token=${resetToken}`;

    await sendEmail('test-emails', {
      to: TEST_EMAIL,
      name: TEST_NAME,
      resetToken,
      resetUrl,
      orderDetails,
      orderId: 'TEST-' + Date.now()
    }, 'Password Reset Email');

    // 3. Test Order Confirmation Email
    await sendEmail('test-emails', {
      to: TEST_EMAIL,
      name: TEST_NAME,
      orderId: 'TEST-' + Date.now(),
      orderDetails
    }, 'Order Confirmation Email');

    // 4. Test Order Ready Email (Kitchen Update)
    await sendEmail('send-ready-time-email', {
      to: TEST_EMAIL,
      name: TEST_NAME,
      orderId: 'TEST-' + Date.now(),
      readyTimeMinutes: 25,
      orderDetails
    }, 'Order Ready Email (Kitchen Update)');

    // 5. Test Delivery ETA Email (Driver Update) - Note: This requires an actual order in database
    console.log('📧 Skipping Delivery ETA Email (requires actual order in database)');
    // Uncomment below if you have a real order to test with:
    // await sendEmail('delivery/update-eta', {
    //   orderId: YOUR_REAL_ORDER_ID,
    //   etaMinutes: 15,
    //   driverId: 'test-driver'
    // }, 'Delivery ETA Email (Driver Update)');

    console.log('\n🎉 All mock emails sent successfully!');
    console.log(`📧 Check your inbox at ${TEST_EMAIL}`);
    console.log('📝 Note: Delivery ETA email requires an actual order in the database to work properly.');

  } catch (error) {
    console.error('\n❌ Error sending emails:', error.message);
    console.error('Please make sure the development server is running on localhost:3000');
  }
}

sendAllEmails();
