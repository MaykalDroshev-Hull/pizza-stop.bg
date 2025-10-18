// Test script to send email to hm.websiteprovisioning@gmail.com
const http = require('http');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/test-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing email API...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const response = JSON.parse(data);
      console.log('✅ Email API test completed:', response);
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem with request: ${e.message}`);
});

req.write(postData);
req.end();


