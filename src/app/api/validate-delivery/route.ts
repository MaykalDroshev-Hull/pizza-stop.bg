import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { coordinatesSchema } from '@/utils/zodSchemas'

/**
 * Server-side delivery radius validation
 * Validates if an address is within the delivery zones
 */

// Define delivery zones (same as in priceCalculation.ts)
const lovechArea = [
  { lat: 43.12525, lng: 24.71518 },
  { lat: 43.12970, lng: 24.70579 },
  { lat: 43.13005, lng: 24.69994 },
  { lat: 43.12483, lng: 24.68928 },
  { lat: 43.12299, lng: 24.67855 },
  { lat: 43.13595, lng: 24.67501 },
  { lat: 43.14063, lng: 24.67991 },
  { lat: 43.14337, lng: 24.67877 },
  { lat: 43.14687, lng: 24.67553 },
  { lat: 43.15432, lng: 24.68221 },
  { lat: 43.15486, lng: 24.68312 },
  { lat: 43.15629, lng: 24.69245 },
  { lat: 43.15968, lng: 24.70306 },
  { lat: 43.16907, lng: 24.72538 },
  { lat: 43.15901, lng: 24.74022 },
  { lat: 43.15548, lng: 24.73935 },
  { lat: 43.14960, lng: 24.73785 },
  { lat: 43.13553, lng: 24.73599 },
  { lat: 43.13952, lng: 24.72210 },
  { lat: 43.12939, lng: 24.72549 }
]

const extendedArea = [
  { lat: 43.19740, lng: 24.67377 },
  { lat: 43.19530, lng: 24.68420 },
  { lat: 43.18795, lng: 24.69091 },
  { lat: 43.18184, lng: 24.69271 },
  { lat: 43.16906, lng: 24.70673 },
  { lat: 43.18185, lng: 24.73747 },
  { lat: 43.19690, lng: 24.78520 },
  { lat: 43.19429, lng: 24.78849 },
  { lat: 43.19177, lng: 24.79354 },
  { lat: 43.18216, lng: 24.77405 },
  { lat: 43.15513, lng: 24.78379 },
  { lat: 43.14733, lng: 24.78212 },
  { lat: 43.14837, lng: 24.76925 },
  { lat: 43.14629, lng: 24.74900 },
  { lat: 43.13578, lng: 24.74945 },
  { lat: 43.12876, lng: 24.76489 },
  { lat: 43.12203, lng: 24.75945 },
  { lat: 43.11969, lng: 24.76062 },
  { lat: 43.10933, lng: 24.75319 },
  { lat: 43.10442, lng: 24.75046 },
  { lat: 43.09460, lng: 24.75211 },
  { lat: 43.09237, lng: 24.74715 },
  { lat: 43.09868, lng: 24.73602 },
  { lat: 43.10296, lng: 24.72085 },
  { lat: 43.10702, lng: 24.70585 },
  { lat: 43.11009, lng: 24.70742 },
  { lat: 43.11222, lng: 24.71048 },
  { lat: 43.12163, lng: 24.70547 },
  { lat: 43.12097, lng: 24.67849 },
  { lat: 43.14318, lng: 24.67233 },
  { lat: 43.15453, lng: 24.68183 },
  { lat: 43.15655, lng: 24.68643 },
  { lat: 43.16302, lng: 24.69263 },
  { lat: 43.17894, lng: 24.67871 },
  { lat: 43.17927, lng: 24.65107 },
  { lat: 43.18665, lng: 24.64179 },
  { lat: 43.19006, lng: 24.64309 },
  { lat: 43.19788, lng: 24.64881 }
]

function isPointInPolygon(point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean {
  const { lat, lng } = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: lati, lng: lngi } = polygon[i]
    const { lat: latj, lng: lngj } = polygon[j]
    
    if (((lngi > lng) !== (lngj > lng)) && 
        (lat < (latj - lati) * (lng - lngi) / (lngj - lngi) + lati)) {
      inside = !inside
    }
  }
  
  return inside
}

function getDeliveryZone(coordinates: { lat: number; lng: number }): 'yellow' | 'blue' | 'outside' {
  const isInLovechArea = isPointInPolygon(coordinates, lovechArea)
  const isInExtendedArea = isPointInPolygon(coordinates, extendedArea)
  
  if (isInLovechArea) {
    return 'yellow' // 3 BGN delivery
  } else if (isInExtendedArea) {
    return 'blue' // 7 BGN delivery
  } else {
    return 'outside' // No delivery
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate coordinates with Zod
    const validationResult = coordinatesSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid coordinates',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { lat, lng } = validationResult.data
    const zone = getDeliveryZone({ lat, lng })

    const response = {
      valid: zone !== 'outside',
      zone,
      deliveryCost: zone === 'yellow' ? 3.00 : zone === 'blue' ? 7.00 : 0,
      message: zone === 'outside' 
        ? 'Адресът е извън зоната за доставка'
        : zone === 'yellow'
        ? 'Адресът е в централната зона (3 € доставка)'
        : 'Адресът е в разширената зона (7 € доставка)'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Delivery validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






