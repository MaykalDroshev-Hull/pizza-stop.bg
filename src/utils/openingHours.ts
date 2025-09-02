/**
 * Opening hours utility functions for Pizza Stop
 * All times are in Bulgarian timezone (Europe/Sofia)
 */

export function isRestaurantOpen(): boolean {
  // Get current time in Bulgaria (UTC+2 in summer, UTC+3 in winter)
  const now = new Date()
  const bulgariaTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Sofia"}))
  
  const currentHour = bulgariaTime.getHours()
  const currentMinute = bulgariaTime.getMinutes()
  const currentTime = currentHour * 100 + currentMinute // Convert to HHMM format
  const dayOfWeek = bulgariaTime.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Monday to Saturday: 11:00-23:00 (1100-2300)
  // Sunday: 11:00-21:00 (1100-2100)
  if (dayOfWeek === 0) { // Sunday
    return currentTime >= 1100 && currentTime < 2100
  } else if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Monday to Saturday
    return currentTime >= 1100 && currentTime < 2300
  }
  
  return false
}

export function getCurrentBulgariaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Sofia"}))
}

export function getOpeningHoursText(): string {
  return "Пон.–Съб.: 11:00–23:00, Нед.: 11:00–21:00"
}

export function getOrderAcceptanceText(): string {
  return "Прием на поръчки: 9:30–22:30"
}
