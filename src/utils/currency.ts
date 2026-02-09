/**
 * Client-side currency conversion utilities
 * These functions are safe to use in client components
 */

/**
 * Convert EUR price to BGN using fixed conversion rate
 * Rate: 1 EUR = 1.9558 BGN
 */
export function convertToBGN(eurPrice: number): number {
  return eurPrice * 1.9558
}

/**
 * Format BGN price for display
 * Returns formatted string with лв. suffix
 */
export function formatBGNPrice(bgnPrice: number): string {
  return `${bgnPrice.toFixed(2)} лв.`
}

/**
 * Get both EUR and BGN formatted prices for display
 * Returns object with both formatted prices
 */
export function getDualCurrencyDisplay(eurPrice: number): {
  eur: string
  bgn: string
  bgnValue: number
} {
  const bgnValue = convertToBGN(eurPrice)
  return {
    eur: `€ ${eurPrice.toFixed(2)}`,
    bgn: formatBGNPrice(bgnValue),
    bgnValue
  }
}
