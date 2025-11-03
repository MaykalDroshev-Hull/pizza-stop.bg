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

const req = http.request(options, (res) => {

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
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


