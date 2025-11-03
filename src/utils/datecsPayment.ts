// src/utils/datecsPayment.ts
// Datecs/BORICA Payment Gateway Integration Utilities

import crypto from 'crypto'
import {
  DatecsPaymentRequest,
  DatecsPaymentResponse,
  DatecsMInfo,
  DatecsConfig,
  DatecsTransactionType,
  DATECS_SIGNATURE_FIELDS,
  DatecsActionCode,
  DatecsPaymentResult
} from '@/types/datecs'

/**
 * Datecs Payment Gateway Service
 * Handles cryptographic operations, signature generation, and payment form creation
 * Based on Datecs BORICA APGW documentation (P-OM-41-EN v5.0)
 */
export class DatecsPaymentService {
  private config: DatecsConfig

  constructor(config: DatecsConfig) {
    this.config = config
  }

  /**
   * Generate a unique NONCE (32 hex characters)
   * Must be unique for the terminal within the last 24 hours
   * Contains 16 unpredictable random bytes in hexadecimal format
   * Allowed characters: A-F and 0-9 (uppercase)
   */
  generateNonce(): string {
    const randomBytes = crypto.randomBytes(16)
    return randomBytes.toString('hex').toUpperCase()
  }

  /**
   * Generate a unique ORDER number (6 digits)
   * Must be unique for the terminal within the last 24 hours
   * Right-aligned and supplemented with leading zeros
   * Format: 000001 to 999999
   */
  generateOrderNumber(): string {
    // Use timestamp + random to ensure uniqueness
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const orderNum = (timestamp % 900000 + 100000 + random) % 1000000
    return orderNum.toString().padStart(6, '0')
  }

  /**
   * Generate TIMESTAMP in UTC format
   * Format: YYYYMMDDHHMMSS
   * Must not exceed 15 minutes difference with APGW server time
   */
  generateTimestamp(): string {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }

  /**
   * Encode cardholder information as M_INFO
   * Base64 encoded JSON string
   * Mandatory: cardholder name + (email and/or telephone)
   */
  encodeMInfo(data: DatecsMInfo): string {
    const jsonString = JSON.stringify(data)
    return Buffer.from(jsonString, 'utf-8').toString('base64')
  }

  /**
   * Decode M_INFO from Base64
   */
  decodeMInfo(encoded: string): DatecsMInfo {
    const jsonString = Buffer.from(encoded, 'base64').toString('utf-8')
    return JSON.parse(jsonString) as DatecsMInfo
  }

  /**
   * Generate AD.CUST_BOR_ORDER_ID
   * Format: ORDER (6 digits) + up to 16 additional characters
   * Must not contain semicolon ";"
   * Used for financial file transfer to acquiring institution
   */
  generateCustBorOrderId(orderNumber: string, suffix: string = ''): string {
    const sanitizedSuffix = suffix.replace(/;/g, '').substring(0, 16)
    return `${orderNumber}${sanitizedSuffix}`
  }

  /**
   * Build signing string for MAC_GENERAL signature
   * Format: LENGTH + VALUE for each field
   * RFU (Reserved for Future Use) is always "-" (0x2D)
   * Missing fields are replaced with "-" (0x2D)
   */
  private buildSigningString(
    data: Partial<DatecsPaymentRequest | DatecsPaymentResponse>,
    fields: string[]
  ): string {
    let signingString = ''

    for (const field of fields) {
      let value: string

      if (field === 'RFU') {
        // RFU is always "-" (minus sign)
        value = '-'
      } else if (field in data) {
        const fieldValue = data[field as keyof typeof data]
        value = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '-'
      } else {
        // Missing field is replaced with "-"
        value = '-'
      }

      // Append length + value
      const length = Buffer.byteLength(value, 'utf-8')
      signingString += `${length}${value}`
    }

    return signingString
  }

  /**
   * Sign data using RSA-SHA256 with merchant's private key
   * Returns P_SIGN (512 hex characters = 256 bytes)
   */
  async signRequest(
    request: Partial<DatecsPaymentRequest>,
    transactionType: DatecsTransactionType
  ): Promise<string> {
    try {
      // Get signature fields for transaction type
      const signatureFields = DATECS_SIGNATURE_FIELDS[transactionType].request

      // Build signing string
      const signingString = this.buildSigningString(request, signatureFields)

      console.log('🔐 Signing request:')
      console.log('   Transaction type:', transactionType)
      console.log('   Signing fields:', signatureFields)
      console.log('   Signing string:', signingString)

      // Load private key
      const privateKey = await this.loadPrivateKey()

      // Sign with RSA-SHA256
      const sign = crypto.createSign('RSA-SHA256')
      sign.update(signingString, 'utf-8')
      sign.end()

      const signature = sign.sign(privateKey)
      const pSign = signature.toString('hex').toUpperCase()

      console.log('   Signature (P_SIGN):', pSign.substring(0, 64) + '...')

      return pSign
    } catch (error) {
      console.error('❌ Error signing request:', error)
      throw new Error(`Failed to sign request: ${error}`)
    }
  }

  /**
   * Verify signature in BORICA response using BORICA's public key
   * Returns true if signature is valid
   */
  async verifyResponse(response: DatecsPaymentResponse): Promise<boolean> {
    try {
      // Get signature fields for transaction type
      const transactionType = response.TRTYPE as DatecsTransactionType
      const signatureFields = DATECS_SIGNATURE_FIELDS[transactionType]?.response || 
                             DATECS_SIGNATURE_FIELDS[DatecsTransactionType.SALE].response

      // Build signing string
      const signingString = this.buildSigningString(response, signatureFields)

      console.log('🔍 Verifying response signature:')
      console.log('   Transaction type:', transactionType)
      console.log('   Signing fields:', signatureFields)
      console.log('   Signing string:', signingString)

      // Load BORICA public key
      const publicKey = await this.loadBoricaPublicKey()

      // Convert P_SIGN from hex to buffer
      const signature = Buffer.from(response.P_SIGN, 'hex')

      // Verify with RSA-SHA256
      const verify = crypto.createVerify('RSA-SHA256')
      verify.update(signingString, 'utf-8')
      verify.end()

      const isValid = verify.verify(publicKey, signature)

      console.log('   Signature valid:', isValid ? '✅' : '❌')

      return isValid
    } catch (error) {
      console.error('❌ Error verifying response:', error)
      return false
    }
  }

  /**
   * Load merchant's private key from file system
   * Supports both encrypted and unencrypted keys
   */
  private async loadPrivateKey(): Promise<string | crypto.KeyObject> {
    try {
      const fs = await import('fs/promises')
      const privateKeyContent = await fs.readFile(this.config.privateKeyPath, 'utf-8')

      // If key is encrypted with password
      if (this.config.privateKeyPassword) {
        return {
          key: privateKeyContent,
          passphrase: this.config.privateKeyPassword
        } as any
      }

      return privateKeyContent
    } catch (error) {
      console.error('❌ Error loading private key:', error)
      throw new Error(`Failed to load private key from ${this.config.privateKeyPath}`)
    }
  }

  /**
   * Load BORICA's public key from file system
   */
  private async loadBoricaPublicKey(): Promise<string> {
    try {
      const fs = await import('fs/promises')
      const publicKeyContent = await fs.readFile(this.config.boricaPublicKeyPath, 'utf-8')
      return publicKeyContent
    } catch (error) {
      console.error('❌ Error loading BORICA public key:', error)
      throw new Error(`Failed to load BORICA public key from ${this.config.boricaPublicKeyPath}`)
    }
  }

  /**
   * Generate complete payment request
   */
  async generatePaymentRequest(
    orderId: string,
    amount: number,
    customerInfo: {
      name: string
      email: string
      phone: string
    },
    description: string = 'Payment for order'
  ): Promise<DatecsPaymentRequest> {
    // Generate unique identifiers
    const orderNumber = this.generateOrderNumber()
    const nonce = this.generateNonce()
    const timestamp = this.generateTimestamp()

    // Format amount (2 decimal places)
    const formattedAmount = amount.toFixed(2)

    // Encode M_INFO
    const mInfo = this.encodeMInfo({
      cardholderName: customerInfo.name,
      email: customerInfo.email,
      mobilePhone: {
        cc: '359', // Bulgaria country code
        subscriber: customerInfo.phone.replace(/^0/, '') // Remove leading 0
      }
    })

    // Build payment request (without signature)
    const request: Partial<DatecsPaymentRequest> = {
      TERMINAL: this.config.terminalId,
      TRTYPE: DatecsTransactionType.SALE,
      AMOUNT: formattedAmount,
      CURRENCY: this.config.currency,
      ORDER: orderNumber,
      DESC: description.substring(0, 50), // Max 50 chars
      MERCHANT: this.config.merchantId,
      MERCH_NAME: this.config.merchantName,
      MERCH_URL: this.config.merchantUrl,
      COUNTRY: this.config.country,
      MERCH_GMT: this.config.timezone,
      LANG: this.config.lang,
      ADDENDUM: 'AD,TD',
      'AD.CUST_BOR_ORDER_ID': this.generateCustBorOrderId(orderNumber, `ORD${orderId}`),
      TIMESTAMP: timestamp,
      M_INFO: mInfo,
      NONCE: nonce
    }

    // Generate signature
    const pSign = await this.signRequest(request, DatecsTransactionType.SALE)

    // Add signature to request
    const completeRequest: DatecsPaymentRequest = {
      ...request,
      P_SIGN: pSign
    } as DatecsPaymentRequest

    return completeRequest
  }

  /**
   * Generate HTML form for automatic submission to BORICA gateway
   * The form auto-submits via JavaScript
   */
  generatePaymentForm(request: DatecsPaymentRequest): string {
    const formFields = Object.entries(request)
      .map(([key, value]) => {
        const sanitizedValue = String(value).replace(/"/g, '&quot;')
        return `      <input type="hidden" name="${key}" value="${sanitizedValue}" />`
      })
      .join('\n')

    return `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пренасочване към плащане...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      color: #fff;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: #ff4444;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    p {
      margin: 0;
      opacity: 0.8;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <h2>Пренасочване към плащане...</h2>
    <p>Моля, изчакайте. Не затваряйте прозореца.</p>
  </div>
  
  <form id="datecsPaymentForm" action="${this.config.gatewayUrl}" method="POST">
${formFields}
  </form>

  <script>
    // Auto-submit form after brief delay
    setTimeout(function() {
      document.getElementById('datecsPaymentForm').submit();
    }, 1000);
  </script>
</body>
</html>
    `.trim()
  }

  /**
   * Check if response indicates successful payment
   */
  isPaymentSuccessful(response: DatecsPaymentResponse): boolean {
    return response.ACTION === DatecsActionCode.SUCCESS && response.RC === '00'
  }

  /**
   * Check if response indicates declined payment
   */
  isPaymentDeclined(response: DatecsPaymentResponse): boolean {
    return response.ACTION === DatecsActionCode.DECLINED || 
           (response.ACTION === DatecsActionCode.ERROR && response.RC !== '00')
  }

  /**
   * Get human-readable error message from response
   */
  getErrorMessage(response: DatecsPaymentResponse): string {
    if (response.STATUSMSG) {
      return response.STATUSMSG
    }

    // Map common error codes to Bulgarian messages
    const errorMessages: Record<string, string> = {
      '01': 'Моля, свържете се с издателя на картата',
      '04': 'Картата е задържана',
      '05': 'Плащането е отказано',
      '06': 'Възникна грешка при обработката',
      '12': 'Невалидна транзакция',
      '13': 'Невалидна сума',
      '14': 'Невалиден номер на карта',
      '15': 'Издателят на картата не съществува',
      '17': 'Транзакцията е отменена от клиента',
      '30': 'Грешка във формата на данните',
      '41': 'Картата е загубена',
      '43': 'Картата е откраднат',
      '51': 'Недостатъчна наличност',
      '54': 'Картата е изтекла',
      '55': 'Грешен PIN код',
      '57': 'Транзакцията не е позволена за този тип карта',
      '58': 'Транзакцията не е позволена за този терминал',
      '59': 'Подозрение за измама',
      '91': 'Издателят не е достъпен',
      '-17': 'Грешка в подписа на заявката',
      '-19': 'Грешка при автентикация',
      '-20': 'Транзакцията е изтекла (надвишено време)',
      '-21': 'Дублирана транзакция'
    }

    return errorMessages[response.RC] || 'Плащането не е успешно'
  }
}

/**
 * Create Datecs Payment Service instance from environment variables
 */
export function createDatecsService(): DatecsPaymentService {
  const config: DatecsConfig = {
    terminalId: process.env.DATECS_TERMINAL_ID || '',
    merchantId: process.env.DATECS_MERCHANT_ID || '',
    merchantName: process.env.DATECS_MERCHANT_NAME || 'Pizza Stop',
    merchantUrl: process.env.DATECS_MERCHANT_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://pizza-stop.bg',
    gatewayUrl: process.env.DATECS_GATEWAY_URL || 'https://3dsgate-dev.borica.bg/cgi-bin/cgi_link',
    backrefUrl: process.env.DATECS_BACKREF_URL || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
    country: process.env.DATECS_COUNTRY || 'BG',
    timezone: process.env.DATECS_TIMEZONE || '+03',
    currency: process.env.DATECS_CURRENCY || 'BGN',
    privateKeyPath: process.env.DATECS_PRIVATE_KEY_PATH || '',
    privateKeyPassword: process.env.DATECS_PRIVATE_KEY_PASSWORD || undefined,
    boricaPublicKeyPath: process.env.DATECS_BORICA_PUBLIC_KEY_PATH || '',
    lang: (process.env.DATECS_LANG as 'BG' | 'EN') || 'BG'
  }

  // Validate required config
  if (!config.terminalId || !config.merchantId) {
    throw new Error('Missing required Datecs configuration: TERMINAL_ID or MERCHANT_ID')
  }

  if (!config.privateKeyPath || !config.boricaPublicKeyPath) {
    throw new Error('Missing required Datecs key paths: PRIVATE_KEY_PATH or BORICA_PUBLIC_KEY_PATH')
  }

  return new DatecsPaymentService(config)
}

