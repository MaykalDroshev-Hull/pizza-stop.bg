/**
 * Simple order ID encryption/decryption utilities
 * Uses base64 encoding with a salt for basic obfuscation
 */

const SALT = 'pizza-stop-2024'

/**
 * Encrypts an order ID for URL usage
 * @param orderId - The plain order ID
 * @returns Encrypted order ID safe for URLs
 */
export function encryptOrderId(orderId: string): string {
  try {
    // Add salt and timestamp for uniqueness
    const timestamp = Date.now().toString()
    const saltedId = `${orderId}:${timestamp}:${SALT}`
    
    // Encode to base64
    const encoded = btoa(saltedId)
    
    // Make URL safe by replacing characters
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch (error) {
    console.error('Error encrypting order ID:', error)
    return orderId // Fallback to original ID
  }
}

/**
 * Decrypts an order ID from URL
 * @param encryptedId - The encrypted order ID from URL
 * @returns Decrypted order ID or null if invalid
 */
export function decryptOrderId(encryptedId: string): string | null {
  try {
    // Restore base64 padding and characters
    let base64 = encryptedId.replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    
    // Decode from base64
    const decoded = atob(base64)
    
    // Split the salted ID
    const parts = decoded.split(':')
    if (parts.length !== 3) {
      return null
    }
    
    const [orderId, timestamp, salt] = parts
    
    // Verify salt
    if (salt !== SALT) {
      return null
    }
    
    // Check if timestamp is not too old (24 hours)
    const orderTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (now - orderTime > maxAge) {
      return null
    }
    
    return orderId
  } catch (error) {
    console.error('Error decrypting order ID:', error)
    return null
  }
}

/**
 * Validates if an encrypted order ID is valid
 * @param encryptedId - The encrypted order ID
 * @returns True if valid, false otherwise
 */
export function isValidEncryptedOrderId(encryptedId: string): boolean {
  return decryptOrderId(encryptedId) !== null
}
