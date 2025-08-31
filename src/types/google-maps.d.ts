declare global {
  interface Window {
    google: typeof google
    mapMarker?: google.maps.Marker
  }
  
  interface Navigator {
    geolocation: Geolocation
    permissions?: Permissions
  }
  
  interface Permissions {
    query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>
  }
  
  interface PermissionDescriptor {
    name: string
  }
  
  interface PermissionStatus {
    state: 'granted' | 'denied' | 'prompt'
  }
  
  interface Geolocation {
    getCurrentPosition(
      successCallback: PositionCallback,
      errorCallback?: PositionErrorCallback,
      options?: PositionOptions
    ): void
    watchPosition(
      successCallback: PositionCallback,
      errorCallback?: PositionErrorCallback,
      options?: PositionOptions
    ): number
    clearWatch(watchId: number): void
  }
  
  interface PositionCallback {
    (position: GeolocationPosition): void
  }
  
  interface PositionErrorCallback {
    (error: GeolocationPositionError): void
  }
  
  interface PositionOptions {
    enableHighAccuracy?: boolean
    timeout?: number
    maximumAge?: number
  }
  
  interface GeolocationPosition {
    coords: GeolocationCoordinates
    timestamp: number
  }
  
  interface GeolocationCoordinates {
    latitude: number
    longitude: number
    accuracy?: number
    altitude?: number | null
    altitudeAccuracy?: number | null
    heading?: number | null
    speed?: number | null
  }
  
  interface GeolocationPositionError {
    code: number
    message: string
    PERMISSION_DENIED: number
    POSITION_UNAVAILABLE: number
    TIMEOUT: number
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions)
      addListener(eventName: string, handler: Function): void
      panTo(latLng: LatLng): void
      setCenter(latLng: LatLng): void
      setZoom(zoom: number): void
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
    }

    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void
    }

    interface MapOptions {
      center?: LatLng
      zoom?: number
      mapTypeId?: MapTypeId
      styles?: MapTypeStyle[]
    }

    interface MarkerOptions {
      position?: LatLng
      map?: Map
      title?: string
      icon?: string | Icon
    }

    interface Icon {
      url: string
      scaledSize?: Size
      anchor?: Point
    }

    interface Size {
      new(width: number, height: number): Size
    }

    interface Point {
      new(x: number, y: number): Point
    }

    interface LatLng {
      lat(): number
      lng(): number
    }

    interface MapMouseEvent {
      latLng?: LatLng
    }

    interface GeocoderRequest {
      address?: string
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng
      }
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    enum MapTypeId {
      ROADMAP = 'roadmap'
    }

    interface MapTypeStyle {
      featureType?: string
      elementType?: string
      stylers?: Array<{ [key: string]: any }>
    }

    // Places API
    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions)
        addListener(eventName: string, handler: Function): void
        getPlace(): PlaceResult
      }

      interface AutocompleteOptions {
        types?: string[]
        componentRestrictions?: ComponentRestrictions
        fields?: string[]
      }

      interface ComponentRestrictions {
        country?: string | string[]
      }

      interface PlaceResult {
        formatted_address?: string
        geometry?: {
          location: LatLng
        }
        place_id?: string
      }
    }
  }
}

export {}
