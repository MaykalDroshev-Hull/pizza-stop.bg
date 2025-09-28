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
  
  // Monday to Friday: 08:00-23:00 (0800-2300)
  // Saturday and Sunday: 11:00-21:00 (1100-2100)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
    return currentTime >= 800 && currentTime < 2300
  } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    return currentTime >= 1100 && currentTime < 2100
  }
  
  return false
}

export function getCurrentBulgariaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Sofia"}))
}

export function getOpeningHoursText(): string {
  return "Пон.–Пет.: 08:00–23:00, Съб.–Нед.: 11:00–21:00"
}

export function getCurrentDayWorkingHours(): string {
  const now = new Date()
  const bulgariaTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Sofia"}))
  const dayOfWeek = bulgariaTime.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Monday to Friday: 08:00-23:00
  // Saturday and Sunday: 11:00-21:00
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
    return "08:00 – 23:00"
  } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    return "11:00 – 21:00"
  }
  
  return "11:00 – 21:00" // fallback
}

export function getOrderAcceptanceText(): string {
  return "Прием на поръчки: 9:30–22:30"
}
