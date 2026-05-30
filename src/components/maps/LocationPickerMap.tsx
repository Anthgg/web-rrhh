"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons in Next.js/Vite
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

let defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerMapProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  radius?: number;
  onLocationChange: (location: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
}

function MapEvents({ onLocationChange, disabled }: { onLocationChange: (loc: { latitude: number; longitude: number }) => void, disabled?: boolean }) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onLocationChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
  });
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  radius = 100,
  onLocationChange,
  disabled = false,
}: LocationPickerMapProps) {
  // Default to Lima, Peru
  const center: [number, number] = latitude && longitude ? [latitude, longitude] : [-12.04318, -77.02824];
  const isValidLocation = typeof latitude === "number" && typeof longitude === "number";

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <MapContainer
        center={center}
        zoom={isValidLocation ? 16 : 11}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {isValidLocation && (
          <>
            <Marker position={[latitude, longitude]} />
            <Circle 
              center={[latitude, longitude]} 
              radius={radius} 
              pathOptions={{ fillColor: "#4f46e5", color: "#4338ca", weight: 2, fillOpacity: 0.2 }}
            />
          </>
        )}

        <MapEvents onLocationChange={onLocationChange} disabled={disabled} />
      </MapContainer>
    </div>
  );
}
