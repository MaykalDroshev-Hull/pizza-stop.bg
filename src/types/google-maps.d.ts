/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google
    mapMarker?: google.maps.Marker
  }
  
  interface Navigator {
    geolocation: Geolocation
    permissions?: Permissions
    serial?: Serial
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

  // Web Serial API types - using official browser types
  interface SerialPort {
    readonly readable: ReadableStream<Uint8Array> | null
    readonly writable: WritableStream<Uint8Array> | null
    open(options: SerialOptions): Promise<void>
    close(): Promise<void>
    forget(): Promise<void>
    getInfo(): SerialPortInfo
  }

  interface SerialOptions {
    baudRate: number
    dataBits?: 7 | 8
    stopBits?: 1 | 2
    parity?: 'none' | 'even' | 'odd'
    bufferSize?: number
    flowControl?: 'none' | 'hardware'
  }

  interface SerialPortInfo {
    usbVendorId?: number
    usbProductId?: number
  }

  interface Serial extends EventTarget {
    getPorts(): Promise<SerialPort[]>
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
    addEventListener(
      type: 'connect' | 'disconnect',
      listener: (this: Serial, ev: Event) => any,
      options?: boolean | AddEventListenerOptions
    ): void
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[]
  }

  interface SerialPortFilter {
    usbVendorId?: number
    usbProductId?: number
  }
}

export {}
