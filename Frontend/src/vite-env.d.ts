/// <reference types="vite/client" />

// Allow importing image files
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

// Google Maps TypeScript declarations
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      addListener(eventName: string, handler: Function): void;
      fitBounds(bounds: LatLngBounds): void;
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
    }

    interface MarkerOptions {
      position?: LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
    }

    interface Icon {
      url: string;
    }

    class Polyline {
      constructor(options?: PolylineOptions);
    }

    interface PolylineOptions {
      path?: LatLngLiteral[];
      geodesic?: boolean;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      map?: Map;
    }

    class LatLngBounds {
      constructor();
      extend(point: LatLngLiteral): void;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class MapMouseEvent {
      latLng: LatLng | null;
    }

    class LatLng {
      lat(): number;
      lng(): number;
    }
  }
}
