/// <reference types="@types/google.maps" />

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

export {}
