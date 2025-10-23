# 🔒 COMPREHENSIVE SECURITY TESTING PLAN - Pizza Stop

## 📋 Executive Summary

This document provides a comprehensive security testing plan for the Pizza Stop application based on the vulnerability assessment. The plan includes automated tests, manual penetration testing scenarios, and security monitoring recommendations.

**Total Vulnerabilities Identified:** 18 (8 Critical, 3 High, 3 Medium, 4 Low)
**Testing Priority:** Critical vulnerabilities first, then work down by severity
**Estimated Testing Time:** 2-3 days for full coverage

## 🚨 CRITICAL VULNERABILITIES TESTING

### VULN-001: Price Manipulation (CVSS: 9.1)
**Risk:** Unlimited financial loss through manipulated order prices

#### Automated Tests
```javascript
// test-price-manipulation.js
const puppeteer = require('puppeteer');

describe('Price Manipulation Tests', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should detect and reject manipulated prices', async () => {
    await page.goto('http://localhost:3000/checkout');

    // Intercept and modify network requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/api/order/confirm')) {
        const postData = JSON.parse(request.postData());

        // Test 1: Zero price manipulation
        postData.totalPrice = 0.01;
        postData.orderItems[0].price = 0.01;

        request.continue({
          method: 'POST',
          postData: JSON.stringify(postData),
          headers: { ...request.headers(), 'Content-Type': 'application/json' }
        });
      } else {
        request.continue();
      }
    });

    // Submit order and check response
    await page.click('[data-testid="submit-order"]');
    const response = await page.waitForResponse('/api/order/confirm');

    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toContain('price mismatch');
  });

  test('should validate addon prices server-side', async () => {
    // Test addon price manipulation
    const maliciousOrder = {
      orderItems: [{
        name: 'Margherita',
        price: 15.00,
        addons: [
          { name: 'Extra Cheese', price: 0.01 }, // Manipulated
          { name: 'Pepperoni', Price: 3.50 }     // Correct case
        ]
      }],
      totalPrice: 18.51 // Manipulated total
    };

    const response = await fetch('/api/order/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousOrder)
    });

    expect(response.status).toBe(400);
  });
});
```

#### Manual Testing Steps
1. **Browser DevTools Manipulation:**
   - Open browser DevTools → Console
   - Navigate to checkout page
   - Execute: `document.querySelector('[name="totalPrice"]').value = "0.01"`
   - Execute: `cart.items[0].price = 0.01`
   - Submit order and verify server rejects it

2. **Network Interception:**
   - Use Burp Suite or similar proxy
   - Intercept POST to `/api/order/confirm`
   - Modify `totalPrice` to `0.01`
   - Forward request and verify 400 response

3. **Expected Behavior:**
   - Server logs should show "SECURITY ALERT: Price mismatch detected"
   - Order should be rejected with 400 status
   - Email should NOT be sent for manipulated orders

### VULN-002: Addon Price Calculation Bug (CVSS: 7.5)
**Risk:** Revenue loss due to incorrect addon pricing

#### Automated Tests
```javascript
// test-addon-pricing.js
describe('Addon Price Calculation Tests', () => {
  test('should correctly calculate addon prices', async () => {
    const testOrder = {
      orderItems: [{
        id: 1,
        name: 'Margherita Pizza',
        price: 15.00,
        category: 'pizza',
        addons: [
          { name: 'Extra Cheese', Price: 2.50 },
          { name: 'Pepperoni', price: 3.00 }, // Wrong case - should be ignored
          { name: 'Mushrooms', Price: 2.00 }
        ],
        quantity: 1
      }]
    };

    // This should fail due to the bug (Price vs price)
    const response = await request(app)
      .post('/api/order/confirm')
      .send(testOrder);

    // Bug: addonTotal will be 0 because it reads 'price' instead of 'Price'
    expect(response.body.validatedTotalPrice).toBe(15.00); // Should be 22.50
  });

  test('should handle case-insensitive addon price property', async () => {
    // Test both 'Price' and 'price' properties
    const mixedCaseAddons = [
      { name: 'Cheese', Price: 2.50 },  // Correct case
      { name: 'Pepperoni', price: 3.00 } // Wrong case
    ];

    // Should sum correctly regardless of case
    const total = calculateAddonTotal(mixedCaseAddons);
    expect(total).toBe(5.50); // 2.50 + 3.00
  });
});
```

#### Manual Testing Steps
1. **Database Verification:**
   ```sql
   SELECT OrderID, TotalAmount, DeliveryPrice,
          (SELECT SUM(TotalPrice) FROM LkOrderProduct WHERE OrderID = o.OrderID) as ItemsTotal
   FROM [Order] o
   WHERE OrderDT >= '2024-01-01'
   ORDER BY OrderID DESC LIMIT 10;
   ```

2. **Compare with Kitchen Display:**
   - Place order with addons in kitchen interface
   - Verify displayed total matches database total
   - Check if addon costs are included

### VULN-003: IDOR (Insecure Direct Object Reference) (CVSS: 8.2)
**Risk:** Unauthorized access to any user's data

#### Automated Tests
```javascript
// test-idor.js
describe('IDOR Protection Tests', () => {
  let user1Token, user2Token, user1Id, user2Id;

  beforeAll(async () => {
    // Create test users
    const user1 = await createTestUser('user1@test.com');
    const user2 = await createTestUser('user2@test.com');
    user1Id = user1.id;
    user2Id = user2.id;

    user1Token = generateAuthToken(user1Id);
    user2Token = generateAuthToken(user2Id);
  });

  test('should prevent user1 from accessing user2 data', async () => {
    const response = await request(app)
      .get(`/api/user/orders?userId=${user2Id}`)
      .set('x-user-id', user1Id)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Unauthorized');
  });

  test('should allow user to access own data only', async () => {
    const response = await request(app)
      .get(`/api/user/orders?userId=${user1Id}`)
      .set('x-user-id', user1Id)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.orders).toBeDefined();
  });

  test('should log authorization violations', async () => {
    await request(app)
      .get(`/api/user/orders?userId=${user2Id}`)
      .set('x-user-id', user1Id);

    // Check logs for security alert
    const logs = await getSecurityLogs();
    const violationLog = logs.find(log =>
      log.includes('AUTHORIZATION VIOLATION') &&
      log.includes(`sessionUserId:${user1Id}`) &&
      log.includes(`requestedUserId:${user2Id}`)
    );

    expect(violationLog).toBeDefined();
  });
});
```

#### Manual Testing Steps
1. **Sequential ID Enumeration:**
   - Register multiple test accounts
   - Try accessing `/api/user/orders?userId=1`, `userId=2`, etc.
   - Verify only own data is accessible

2. **Profile Modification:**
   - Try POST to `/api/user/profile` with different userId
   - Verify request is rejected with 401

3. **Order Details Access:**
   - Try GET `/api/order/details?orderId=X` for various order IDs
   - Verify only orders belonging to authenticated user are accessible

### VULN-004: Client-Side Authentication (CVSS: 9.3)
**Risk:** Complete admin panel takeover via XSS

#### Automated Tests
```javascript
// test-client-auth.js
describe('Client-Side Authentication Bypass Tests', () => {

  test('should prevent localStorage admin auth bypass', async () => {
    await page.goto('http://localhost:3000/admin');

    // Try to bypass with localStorage manipulation
    await page.evaluate(() => {
      localStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_kitchen', 'true');
      sessionStorage.setItem('admin_delivery', 'true');
    });

    await page.reload();

    // Should redirect to login (server-side check should override)
    await page.waitForNavigation();
    expect(page.url()).toContain('/login-admin');
  });

  test('should validate admin access server-side', async () => {
    // Try direct API access without proper auth
    const response = await fetch('/api/admin/products', {
      headers: { 'x-admin-auth': 'fake-token' }
    });

    expect(response.status).toBe(401);
  });
});
```

#### Manual Testing Steps
1. **localStorage Manipulation:**
   ```javascript
   // In browser console:
   localStorage.setItem('admin_authenticated', 'true');
   sessionStorage.setItem('admin_kitchen', 'true');
   // Refresh page - should redirect to login
   ```

2. **Direct API Access:**
   - Try accessing `/api/admin/products` directly via fetch
   - Should return 401 without proper token

3. **Session Persistence Test:**
   - Login as admin, close browser, reopen
   - Should require re-authentication

### VULN-005: Hardcoded Credentials (CVSS: 9.8)
**Risk:** Backdoor access to admin functions

#### Automated Tests
```javascript
// test-hardcoded-credentials.js
describe('Hardcoded Credentials Tests', () => {

  test('should reject default credentials', async () => {
    // These should fail if hardcoded credentials are removed
    const credentials = [
      { username: 'kitchen', password: 'kitchen123' },
      { username: 'delivery', password: 'delivery123' },
      { username: 'printer', password: 'printer123' }
    ];

    for (const cred of credentials) {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cred.username,
          password: cred.password,
          type: cred.username
        })
      });

      expect(response.status).toBe(401);
    }
  });

  test('should only accept environment variable credentials', async () => {
    // Set environment variables
    process.env.KITCHEN_USERNAME = 'secure_kitchen_user';
    process.env.KITCHEN_PASSWORD = 'very_secure_password_123!';

    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'secure_kitchen_user',
        password: 'very_secure_password_123!',
        type: 'kitchen'
      })
    });

    expect(response.status).toBe(200);
  });
});
```

#### Manual Testing Steps
1. **Git Repository Scan:**
   ```bash
   git log -p --grep="kitchen123\|delivery123\|printer123"
   git log -p --all | grep -i "password.*123"
   ```

2. **Source Code Review:**
   - Search for hardcoded strings in all files
   - Check if credentials are in environment variables only

3. **Runtime Testing:**
   - Try logging in with known default credentials
   - Verify rejection with proper error message

## 🟠 HIGH VULNERABILITIES TESTING

### VULN-006: No Rate Limiting (CVSS: 7.5)
**Risk:** Brute force attacks and DoS

#### Automated Tests
```javascript
// test-rate-limiting.js
describe('Rate Limiting Tests', () => {

  test('should rate limit login attempts', async () => {
    const attempts = [];

    // Make 100 rapid login attempts
    for (let i = 0; i < 100; i++) {
      const startTime = Date.now();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: `wrong_password_${i}`
        })
      });
      const endTime = Date.now();

      attempts.push({
        status: response.status,
        responseTime: endTime - startTime
      });
    }

    // Should have 429 responses after threshold
    const rateLimitedResponses = attempts.filter(a => a.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Should take longer due to rate limiting
    const avgResponseTime = attempts.reduce((sum, a) => sum + a.responseTime, 0) / attempts.length;
    expect(avgResponseTime).toBeGreaterThan(100); // ms
  });

  test('should rate limit order submissions', async () => {
    const orderAttempts = [];

    for (let i = 0; i < 50; i++) {
      const response = await fetch('/api/order/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFakeOrder())
      });

      orderAttempts.push(response.status);
    }

    // Should eventually rate limit
    const rateLimited = orderAttempts.some(status => status === 429);
    expect(rateLimited).toBe(true);
  });
});
```

#### Manual Testing Steps
1. **Brute Force Login:**
   ```javascript
   // Automated attack simulation
   for (let i = 0; i < 1000; i++) {
     fetch('/api/auth/login', {
       method: 'POST',
       body: JSON.stringify({
         email: 'victim@email.com',
         password: `password${i}`
       })
     });
   }
   ```

2. **DoS Order Flood:**
   - Create script to submit 1000 fake orders rapidly
   - Monitor server performance and response times

3. **Email Spam Test:**
   - Submit 100 password reset requests for same email
   - Verify rate limiting kicks in

### VULN-007: No CSRF Protection (CVSS: 7.1)
**Risk:** Cross-site request forgery attacks

#### Automated Tests
```javascript
// test-csrf.js
describe('CSRF Protection Tests', () => {

  test('should reject requests without CSRF token', async () => {
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        email: 'newemail@test.com',
        name: 'Updated Name'
      })
      // Missing CSRF token
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('CSRF');
  });

  test('should accept requests with valid CSRF token', async () => {
    // Get CSRF token from form or meta tag
    const csrfToken = await page.evaluate(() =>
      document.querySelector('meta[name="csrf-token"]')?.content
    );

    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        userId: 1,
        email: 'newemail@test.com'
      })
    });

    expect(response.status).toBe(200);
  });
});
```

#### Manual Testing Steps
1. **External Site Attack:**
   - Create HTML file with malicious form
   - Submit to your site when logged in
   - Verify request is blocked

2. **Token Validation:**
   - Check if CSRF tokens are unique per session
   - Verify tokens expire appropriately

### VULN-009: XSS (Cross-Site Scripting) (CVSS: 7.2)
**Risk:** Account takeover via malicious scripts

#### Automated Tests
```javascript
// test-xss.js
describe('XSS Protection Tests', () => {

  test('should sanitize user input in display', async () => {
    const maliciousInput = {
      name: '<script>alert("XSS")</script>',
      email: 'test@example.com'
    };

    // Submit order with malicious name
    await page.goto('http://localhost:3000/checkout');
    await page.type('[name="customerName"]', maliciousInput.name);
    await page.click('[data-testid="submit-order"]');

    // Check kitchen display
    await page.goto('http://localhost:3000/kitchen');
    await page.waitForSelector('[data-testid="order-list"]');

    // Should not execute script
    const alertWasCalled = await page.evaluate(() => {
      return window.alertCalled || false;
    });

    expect(alertWasCalled).toBe(false);
  });

  test('should escape HTML in email templates', async () => {
    const maliciousOrder = {
      customerInfo: {
        name: '<img src=x onerror=alert("XSS")>',
        email: 'test@example.com'
      },
      orderItems: [{
        name: '<script>stealCookies()</script>',
        comment: 'Normal comment'
      }]
    };

    // Should not contain unescaped HTML in email
    const emailContent = generateEmailContent(maliciousOrder);
    expect(emailContent).not.toMatch(/<script|onerror|alert/);
  });
});
```

#### Manual Testing Steps
1. **Order Comment XSS:**
   - Place order with comment: `<script>alert('XSS')</script>`
   - View in kitchen interface - should show escaped text

2. **Customer Name XSS:**
   - Use name: `<img src=x onerror=alert('XSS')>`
   - Should not execute in any display context

3. **Email Template XSS:**
   - Order with malicious product name
   - Check if email contains escaped HTML

## 🟡 MEDIUM VULNERABILITIES TESTING

### VULN-012: Missing Security Headers (CVSS: 5.3)

#### Automated Tests
```javascript
// test-security-headers.js
const fetch = require('node-fetch');

describe('Security Headers Tests', () => {

  test('should include required security headers', async () => {
    const response = await fetch('http://localhost:3000/');

    const requiredHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
      'referrer-policy',
      'permissions-policy'
    ];

    const headers = response.headers;
    const missingHeaders = [];

    requiredHeaders.forEach(header => {
      if (!headers.get(header)) {
        missingHeaders.push(header);
      }
    });

    expect(missingHeaders).toHaveLength(0);
  });

  test('should have secure CSP policy', async () => {
    const response = await fetch('http://localhost:3000/');
    const csp = response.headers.get('content-security-policy');

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("img-src 'self' data:");
  });
});
```

### VULN-014: Sensitive Data in Console Logs (CVSS: 5.0)

#### Automated Tests
```javascript
// test-console-logs.js
describe('Console Log Security Tests', () => {

  test('should not log sensitive data in production', async () => {
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';

    // Mock console methods
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => logs.push(args);

    // Trigger order confirmation
    await request(app).post('/api/order/confirm').send(testOrder);

    // Restore console
    console.log = originalLog;

    // Check for sensitive data in logs
    const sensitivePatterns = [
      /password/i,
      /email/i,
      /phone/i,
      /address/i,
      /credit.?card/i
    ];

    const hasSensitiveData = logs.some(log =>
      sensitivePatterns.some(pattern => pattern.test(JSON.stringify(log)))
    );

    expect(hasSensitiveData).toBe(false);
  });
});
```

## 🔧 AUTOMATED TEST SETUP

### Test Environment Setup
```bash
# Install testing dependencies
npm install --save-dev jest puppeteer @types/jest supertest

# Install security testing tools
npm install --save-dev owasp-zap-puppeteer sqlmap

# Environment configuration
cp .env.example .env.test
# Set test database credentials
# Set test API keys
```

### Test Database Setup
```javascript
// test-setup.js
beforeAll(async () => {
  // Create test database
  await createTestDatabase();

  // Seed with test data
  await seedTestUsers();
  await seedTestProducts();
  await seedTestOrders();
});

afterAll(async () => {
  // Clean up test database
  await dropTestDatabase();
});
```

## 🛠️ MANUAL PENETRATION TESTING

### Authentication Testing
1. **Session Management:**
   - Login, close browser, reopen - should require re-auth
   - Try accessing protected routes with expired sessions
   - Test session fixation vulnerabilities

2. **Privilege Escalation:**
   - Create low-privilege user, try admin operations
   - Manipulate user roles in client-side code
   - Test role-based access controls

### Data Validation Testing
1. **Input Sanitization:**
   - Submit orders with extremely long strings (1000+ chars)
   - Try SQL injection patterns in all input fields
   - Test XSS payloads in every user input field

2. **File Upload Testing:**
   - Try uploading malicious files (if upload exists)
   - Test file type restrictions
   - Verify file size limits

### Network Security Testing
1. **API Endpoint Testing:**
   - Try accessing all API endpoints without authentication
   - Test with various HTTP methods
   - Check for information disclosure in error messages

2. **HTTPS Configuration:**
   - Verify all pages use HTTPS
   - Check for mixed content warnings
   - Test HSTS implementation

## 📊 SECURITY MONITORING SETUP

### Logging Configuration
```javascript
// logger.js
const securityLogger = {
  logSecurityEvent: (event, details) => {
    if (process.env.NODE_ENV === 'production') {
      // Log to security-specific destination
      securityLogTransport.log({
        level: 'warn',
        event,
        ...details,
        timestamp: new Date().toISOString(),
        ip: details.ip || 'unknown',
        userAgent: details.userAgent || 'unknown'
      });
    }
  },

  logAuthFailure: (email, ip) => {
    logSecurityEvent('AUTH_FAILURE', { email, ip });
  },

  logPriceManipulation: (clientPrice, serverPrice, email) => {
    logSecurityEvent('PRICE_MANIPULATION_ATTEMPT', {
      clientPrice,
      serverPrice,
      email
    });
  }
};
```

### Alert Setup
```javascript
// alerts.js
const securityAlerts = {
  highRiskEvents: [
    'PRICE_MANIPULATION_ATTEMPT',
    'AUTHORIZATION_VIOLATION',
    'ADMIN_ACCESS_WITHOUT_AUTH',
    'MULTIPLE_FAILED_LOGINS'
  ],

  setupAlerts: () => {
    securityLogger.on('log', (logEntry) => {
      if (highRiskEvents.includes(logEntry.event)) {
        // Send immediate alert
        sendSecurityAlert({
          subject: `🚨 SECURITY ALERT: ${logEntry.event}`,
          details: logEntry
        });
      }
    });
  }
};
```

## ✅ TESTING CHECKLIST

### Pre-Deployment Security Tests
- [ ] All critical vulnerabilities have automated tests
- [ ] Manual penetration testing completed
- [ ] Security headers properly configured
- [ ] Rate limiting tested and working
- [ ] Authentication bypass attempts logged and blocked
- [ ] Price manipulation attempts detected and logged
- [ ] XSS attempts sanitized and logged
- [ ] IDOR protection verified
- [ ] CSRF protection implemented and tested

### Production Monitoring
- [ ] Security event logging configured
- [ ] Real-time alerts for critical events
- [ ] Regular security log review process
- [ ] Failed authentication attempt tracking
- [ ] Price anomaly detection
- [ ] GDPR compliance logging

## 🚨 IMMEDIATE ACTION ITEMS

1. **Deploy Price Manipulation Fix** (VULN-001)
   - Server-side price calculation is implemented but needs testing

2. **Fix Addon Price Bug** (VULN-002)
   - Line 256 in order confirmation uses wrong case

3. **Implement Proper Authentication** (VULN-004, VULN-010)
   - Replace localStorage with httpOnly cookies
   - Add server-side session validation

4. **Remove Hardcoded Credentials** (VULN-005)
   - Ensure all credentials come from environment variables

5. **Add Rate Limiting** (VULN-006)
   - Implement on all API endpoints

6. **Add Security Headers** (VULN-012)
   - Configure CSP, HSTS, and other headers

## 📈 SUCCESS METRICS

- **Zero critical vulnerabilities** in production
- **All high vulnerabilities** mitigated within 24 hours
- **Security test coverage** > 90% for critical paths
- **Mean time to detect** security incidents < 5 minutes
- **False positive rate** < 1% for security alerts

---

**Test Plan Version:** 1.0
**Last Updated:** Current Session
**Next Review:** After implementing critical fixes





