require('dotenv').config({ path: '.env.local' })

const http = require('http');

// Get emails and name from command line arguments or use defaults
// Usage: node test-all-emails.js "email1@test.com,email2@test.com" "Test User Name"
const args = process.argv.slice(2);
const TEST_EMAIL = args[0] || 'hm.websiteprovisioning@gmail.com';
const TEST_NAME = args[1] || 'Pizza Stop Test User';

// Parse comma-separated emails
const emailList = TEST_EMAIL.split(',').map(email => email.trim()).filter(email => email.length > 0);

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
};

async function testEmail(endpoint, data, description) {
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

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const status = res.statusCode === 200 ? '✅ SUCCESS' : `❌ FAILED (${res.statusCode})`;
        console.log(`${description}: ${status}`);
        
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            console.log(`   Error: ${parsed.error}`);
          }
        } catch (e) {
          // Response might not be JSON
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${description}: Connection failed - ${error.message}`);
      console.log('   💡 Make sure your dev server is running (npm run dev)');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testAllEmails() {
  console.log('🍕 Pizza Stop - Email Testing System');
  console.log('═══════════════════════════════════════\n');
  
  if (emailList.length === 0) {
    console.error('❌ Error: No valid email addresses provided!');
    console.log('\n💡 Usage:');
    console.log('   node test-all-emails.js "email@test.com" "Name"');
    console.log('   node test-all-emails.js "email1@test.com,email2@test.com" "Name"');
    console.log('   node test-all-emails.js  (uses default: hm.websiteprovisioning@gmail.com)\n');
    process.exit(1);
  }
  
  console.log(`👤 Recipient Name: ${TEST_NAME}`);
  console.log(`📧 Sending test emails to ${emailList.length} address(es):`);
  emailList.forEach(email => console.log(`   • ${email}`));
  console.log('');

  try {
    for (const emailAddress of emailList) {
      console.log(`\n📬 Testing emails for: ${emailAddress}`);
      console.log('─────────────────────────────────────');
      
      // Test 1: Registration/Welcome Email
      console.log('1️⃣  Testing Registration Email...');
      await testEmail('test-email', { to: emailAddress }, 'Registration Email');
      await sleep(500);

      // Test 2: Password Reset & Order Confirmation Emails
      console.log('2️⃣  Testing Order & Password Reset Emails...');
      await testEmail('test-emails', { 
        to: emailAddress, 
        name: TEST_NAME, 
        orderDetails, 
        orderId: 'TEST-' + Date.now() 
      }, 'Order Confirmation & Password Reset');
      await sleep(500);

      // Test 3: Order Ready Time Email
      console.log('3️⃣  Testing Order Ready Time Email...');
      await testEmail('send-ready-time-email', { 
        to: emailAddress, 
        name: TEST_NAME, 
        orderId: 'TEST-' + Date.now(), 
        readyTimeMinutes: 25, 
        orderDetails 
      }, 'Order Ready Time');
      await sleep(500);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 All email tests completed!');
    console.log(`📬 Check inbox for ${emailList.length} recipient(s)`);
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Email test suite failed:', error.message);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the tests
testAllEmails();

