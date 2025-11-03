// src/types/datecs.ts
// TypeScript types for Datecs/BORICA Payment Gateway integration

/**
 * Transaction types supported by BORICA APGW
 */
export enum DatecsTransactionType {
  SALE = '1',                    // Sale transaction
  PRE_AUTH = '12',               // Pre-authorization
  COMPLETION = '21',             // Completion of pre-authorization
  PRE_AUTH_REVERSAL = '22',      // Reversal of pre-authorization
  SALE_REVERSAL = '24',          // Reversal of sale
  STATUS_CHECK = '90'            // Transaction status check
}

/**
 * Payment request to BORICA APGW
 * Based on Table 1 from documentation (Fields in the request from e-merchant to APGW)
 */
export interface DatecsPaymentRequest {
  TERMINAL: string              // 8 chars - Terminal ID provided by FI
  TRTYPE: DatecsTransactionType // Transaction type (1, 12, 21, 22, 24, 90)
  AMOUNT: string                // 4-12 chars - Amount with decimal point (e.g. "12.00")
  CURRENCY: string              // 3 chars - Currency code (ISO 4217)
  ORDER: string                 // 6 digits - Unique order number (right-aligned, zero-padded)
  DESC: string                  // 1-50 chars - Order description
  MERCHANT: string              // 10 chars - Merchant ID provided by FI
  MERCH_NAME: string            // 1-80 chars - Merchant name
  MERCH_URL?: string            // 1-250 chars - Merchant's primary website URL
  COUNTRY: string               // 2 chars - Country code (ISO 3166-1)
  MERCH_GMT: string             // 3 chars - Merchant's UTC/GMT offset (e.g. "+03")
  LANG?: string                 // 2 chars - Transaction language: BG or EN (default BG)
  ADDENDUM: string              // 5 chars - System field with value "AD,TD"
  'AD.CUST_BOR_ORDER_ID': string // 6-22 chars - ORDER + 16 chars for merchant order number
  TIMESTAMP: string             // 14 chars - Transaction date/time in UTC (YYYYMMDDHHMMSS)
  M_INFO: string                // 0-35000 chars - Base64 encoded JSON with cardholder data
  NONCE: string                 // 32 chars - 16 unpredictable random bytes in hex format
  P_SIGN: string                // 512 chars - Message Authentication Code (MAC) - 256 bytes in hex
}

/**
 * M_INFO structure (cardholder data)
 * Encoded as Base64 JSON
 */
export interface DatecsMInfo {
  cardholderName: string        // Up to 45 characters, Latin only
  email?: string                // Email address
  mobilePhone?: {
    cc: string                  // Country code (e.g. "359")
    subscriber: string          // Phone number
  }
  threeDSRequestorChallengeInd?: string // "04" for mandatory authentication (SCA)
}

/**
 * Payment response from BORICA APGW
 * Based on Table 2 from documentation (Fields in APGW response)
 */
export interface DatecsPaymentResponse {
  ACTION: string                // 1-2 chars - E-Gateway action code (0=success, 1=duplicate, 2=declined, 3=error, etc.)
  RC: string                    // 2 chars - ISO-8583 Field 39: response code
  STATUSMSG: string             // 1-255 chars - Text message corresponding to response code
  TERMINAL: string              // 8 chars - Echo from request
  TRTYPE: string                // 1-2 chars - Echo from request
  AMOUNT?: string               // 4-12 chars - Final transaction amount
  CURRENCY?: string             // 3 chars - Echo from request
  ORDER: string                 // 6 chars - Echo from request
  LANG?: string                 // 2 chars - Echo from request
  TIMESTAMP: string             // 14 chars - Date/time of response in UTC (YYYYMMDDHHMMSS)
  TRAN_DATE?: string            // 14 chars - Date/time of transaction (YYYYMMDDHHMMSS)
  TRAN_TRTYPE?: string          // 1-2 chars - Original transaction type
  APPROVAL?: string             // 6 chars - Cardholder's bank approval code (ISO-8583 Field 38)
  RRN?: string                  // 12 chars - Retrieval reference number (ISO-8583 Field 37)
  INT_REF: string               // 16 chars - APGW internal reference
  PARES_STATUS?: string         // 1 char - 3-D Secure authentication status
  AUTH_STEP_RES?: string        // 1-32 chars - 3-D Secure authentication status level
  CARDHOLDERINFO?: string       // 1-128 chars - Issuer ACS cardholder information
  ECI?: string                  // 2 chars - Electronic Commerce Indicator
  CARD?: string                 // 16-19 chars - Masked card number (e.g. "5100XXXXXXXX0022")
  CARD_BRAND?: string           // 1-4 chars - Card's brand
  NONCE: string                 // 32 chars - Echo from request
  P_SIGN: string                // 512 chars - Message Authentication Code (MAC)
}

/**
 * Configuration for Datecs Payment Gateway
 */
export interface DatecsConfig {
  terminalId: string            // TERMINAL ID (8 chars)
  merchantId: string            // MERCHANT ID (10 chars)
  merchantName: string          // Merchant name
  merchantUrl: string           // Merchant website URL
  gatewayUrl: string            // BORICA gateway URL (test or production)
  backrefUrl: string            // URL where BORICA sends responses
  country: string               // Country code (e.g. "BG")
  timezone: string              // Timezone offset (e.g. "+03")
  currency: string              // Currency code (e.g. "BGN")
  privateKeyPath: string        // Path to merchant's private key
  privateKeyPassword?: string   // Password for private key (if encrypted)
  boricaPublicKeyPath: string   // Path to BORICA's public key
  lang: 'BG' | 'EN'            // Default language
}

/**
 * Fields used for signature generation
 * Based on Table 10 from documentation
 */
export interface DatecsSignatureFields {
  request: string[]             // Fields to include in request signature
  response: string[]            // Fields to include in response signature
}

/**
 * Signature fields for each transaction type
 */
export const DATECS_SIGNATURE_FIELDS: Record<DatecsTransactionType, DatecsSignatureFields> = {
  [DatecsTransactionType.SALE]: {
    request: ['TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 'TIMESTAMP', 'NONCE', 'RFU'],
    response: ['ACTION', 'RC', 'APPROVAL', 'TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 
               'RRN', 'INT_REF', 'PARES_STATUS', 'ECI', 'TIMESTAMP', 'NONCE', 'RFU']
  },
  [DatecsTransactionType.PRE_AUTH]: {
    request: ['TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 'TIMESTAMP', 'NONCE', 'RFU'],
    response: ['ACTION', 'RC', 'APPROVAL', 'TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 
               'RRN', 'INT_REF', 'PARES_STATUS', 'ECI', 'TIMESTAMP', 'NONCE', 'RFU']
  },
  [DatecsTransactionType.COMPLETION]: {
    request: ['TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 'TIMESTAMP', 'NONCE', 'RFU'],
    response: ['ACTION', 'RC', 'APPROVAL', 'TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 
               'RRN', 'INT_REF', 'PARES_STATUS', 'ECI', 'TIMESTAMP', 'NONCE', 'RFU']
  },
  [DatecsTransactionType.PRE_AUTH_REVERSAL]: {
    request: ['TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 'TIMESTAMP', 'NONCE', 'RFU'],
    response: ['ACTION', 'RC', 'APPROVAL', 'TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 
               'RRN', 'INT_REF', 'PARES_STATUS', 'ECI', 'TIMESTAMP', 'NONCE', 'RFU']
  },
  [DatecsTransactionType.SALE_REVERSAL]: {
    request: ['TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 'TIMESTAMP', 'NONCE', 'RFU'],
    response: ['ACTION', 'RC', 'APPROVAL', 'TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 
               'RRN', 'INT_REF', 'PARES_STATUS', 'ECI', 'TIMESTAMP', 'NONCE', 'RFU']
  },
  [DatecsTransactionType.STATUS_CHECK]: {
    request: ['TERMINAL', 'TRTYPE', 'ORDER', 'NONCE'],
    response: ['ACTION', 'RC', 'APPROVAL', 'TERMINAL', 'TRTYPE', 'AMOUNT', 'CURRENCY', 'ORDER', 
               'RRN', 'INT_REF', 'PARES_STATUS', 'ECI', 'TIMESTAMP', 'NONCE', 'RFU']
  }
}

/**
 * Action codes from BORICA APGW
 */
export enum DatecsActionCode {
  SUCCESS = '0',                      // Transaction successfully completed
  DUPLICATE = '1',                    // Duplicate transaction found
  DECLINED = '2',                     // Transaction declined
  ERROR = '3',                        // Transaction processing error
  DUPLICATE_DECLINED = '6',           // Duplicate, declined transaction
  DUPLICATE_AUTH_ERROR = '7',         // Duplicate, authentication error
  DUPLICATE_NO_RESPONSE = '8',        // Duplicate, no response
  SOFT_DECLINE = '21'                 // Soft Decline (RC 65/1A)
}

/**
 * Response codes (RC field)
 */
export enum DatecsResponseCode {
  APPROVED = '00',                    // Successfully completed
  REFER_TO_ISSUER = '01',            // Refer to card issuer
  PICK_UP = '04',                     // Pick up card
  DO_NOT_HONOUR = '05',              // Do not honour
  ERROR = '06',                       // Error
  INVALID_TRANSACTION = '12',        // Invalid transaction
  INVALID_AMOUNT = '13',             // Invalid amount
  NO_SUCH_CARD = '14',               // No such card
  DECLINED = '05',                    // General decline
}

/**
 * Order generation options
 */
export interface DatecsOrderOptions {
  prefix?: string                     // Optional prefix for order number
  useTimestamp?: boolean              // Use timestamp in order number
}

/**
 * Payment generation result
 */
export interface DatecsPaymentResult {
  formHtml: string                    // HTML form to submit to BORICA
  orderNumber: string                 // Generated order number
  nonce: string                       // Generated NONCE
  timestamp: string                   // Generated timestamp
  pSign: string                       // Generated signature
}

