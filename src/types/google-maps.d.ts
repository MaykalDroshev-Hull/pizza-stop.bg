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

  // Web Serial API types
  interface SerialPort {
    readonly readable: ReadableStream<Uint8Array> | null
    readonly writable: WritableStream<Uint8Array> | null
    open(options: SerialOptions): Promise<void>
    close(): Promise<void>
    getInfo(): SerialPortInfo
  }

  interface SerialOptions {
    baudRate: number
    dataBits?: 7 | 8
    stopBits?: 1 | 2
    parity?: 'none' | 'even' | 'odd'
    flowControl?: 'none' | 'hardware'
  }

  interface SerialPortInfo {
    usbVendorId?: number
    usbProductId?: number
  }

  interface Serial extends EventTarget {
    requestPort(): Promise<SerialPort>
    getPorts(): Promise<SerialPort[]>
  }

  interface Navigator {
    serial?: Serial
  }
}

export {}
