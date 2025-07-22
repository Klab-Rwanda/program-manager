"use client"
import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  })
}

interface Location {
  lat: number
  lng: number
  address: string
  radius: number
}

interface UserLocation {
  lat: number
  lng: number
  accuracy: number
}

interface LiveMapProps {
  sessionLocation: Location
  userLocation?: UserLocation | null
  isScanning?: boolean
  distance?: number | null
}

// Component to update map view when locations change
function MapUpdater({
  sessionLocation,
  userLocation,
}: { sessionLocation: Location; userLocation?: UserLocation | null }) {
  const map = useMap()

  useEffect(() => {
    if (userLocation && sessionLocation) {
      // Fit bounds to show both locations
      const bounds = L.latLngBounds([
        [sessionLocation.lat, sessionLocation.lng],
        [userLocation.lat, userLocation.lng],
      ])
      map.fitBounds(bounds, { padding: [20, 20] })
    } else {
      // Just show session location
      map.setView([sessionLocation.lat, sessionLocation.lng], 16)
    }
  }, [map, sessionLocation, userLocation])

  return null
}

// Animated scanning circle component
function ScanningCircle({
  center,
  maxRadius,
  isScanning,
}: { center: [number, number]; maxRadius: number; isScanning: boolean }) {
  const [currentRadius, setCurrentRadius] = useState(0)

  useEffect(() => {
    if (!isScanning) {
      setCurrentRadius(0)
      return
    }

    const animate = () => {
      setCurrentRadius((prev) => {
        if (prev >= maxRadius) return 0
        return prev + 5 // Increase radius by 5 meters each frame
      })
    }

    const interval = setInterval(animate, 100)
    return () => clearInterval(interval)
  }, [isScanning, maxRadius])

  if (!isScanning || currentRadius === 0) return null

  return (
    <Circle
      center={center}
      radius={currentRadius}
      pathOptions={{
        color: "#1f497d",
        fillColor: "#1f497d",
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6,
      }}
    />
  )
}

export default function LiveMap({ sessionLocation, userLocation, isScanning = false, distance }: LiveMapProps) {
  const mapRef = useRef<L.Map>(null)

  // Create custom icons
  const sessionIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  const userIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
    </svg>
  `),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })

  // Don't render on server side
  if (typeof window === 'undefined') {
    return <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  }

  return (
    <div className="w-full h-48 rounded-xl overflow-hidden relative">
      <MapContainer
        ref={mapRef}
        center={[sessionLocation.lat, sessionLocation.lng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater sessionLocation={sessionLocation} userLocation={userLocation} />

        {/* Session location marker */}
        <Marker position={[sessionLocation.lat, sessionLocation.lng]} icon={sessionIcon} />

        {/* Session location radius */}
        <Circle
          center={[sessionLocation.lat, sessionLocation.lng]}
          radius={sessionLocation.radius}
          pathOptions={{
            color: typeof distance === "number" && distance <= sessionLocation.radius ? "#22c55e" : "#1f497d",
            fillColor: typeof distance === "number" && distance <= sessionLocation.radius ? "#22c55e" : "#1f497d",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />

        {/* User location marker */}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}

        {/* User location accuracy circle */}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={userLocation.accuracy}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#ef4444",
              fillOpacity: 0.1,
              weight: 1,
              dashArray: "5, 5",
            }}
          />
        )}

        {/* Scanning animation */}
        {isScanning && userLocation && (
          <ScanningCircle
            center={[userLocation.lat, userLocation.lng]}
            maxRadius={sessionLocation.radius * 2}
            isScanning={isScanning}
          />
        )}
      </MapContainer>

      {/* Map overlay with status */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              typeof distance === "number" && distance <= sessionLocation.radius ? "bg-green-500" : "bg-blue-500"
            }`}
          />
          <span className="text-xs font-medium text-gray-700">
            {distance !== null ? `${distance}m away` : "Getting location..."}
          </span>
        </div>
      </div>

      {/* Scanning indicator */}
      {isScanning && (
        <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white">Scanning...</span>
          </div>
        </div>
      )}
    </div>
  )
}