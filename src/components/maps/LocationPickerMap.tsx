"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Leaflet icon fix for Next.js ──────────────────────────────────────────────
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

function makeIcon() {
  return L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocationPickerMapProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  radius?: number;
  onLocationChange: (location: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
}

// Module-level flag so each mount gets a unique id (React 18/19 Strict Mode safe)
let _instanceCounter = 0;

// ── Component ─────────────────────────────────────────────────────────────────

export function LocationPickerMap({
  latitude,
  longitude,
  radius = 100,
  onLocationChange,
  disabled = false,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable refs for imperative Leaflet objects
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Keep latest callback in a ref so event handlers never go stale
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  });

  // ── Map initialisation ────────────────────────────────────────────────────
  // Runs ONCE per component mount.
  // The `(container as any)._leaflet_id` guard prevents double-initialisation
  // caused by React 18/19 Strict Mode's effect double-invocation.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard: if Leaflet has already claimed this DOM node, skip.
    // This handles React Strict Mode's "reconnectPassiveEffects" path which
    // re-runs effects WITHOUT calling cleanup first.
    if ((container as any)._leaflet_id) return;

    const defaultCenter: L.LatLngExpression =
      typeof latitude === "number" && typeof longitude === "number"
        ? [latitude, longitude]
        : [-12.04318, -77.02824];

    const map = L.map(container, {
      center: defaultCenter,
      zoom: typeof latitude === "number" ? 16 : 11,
      scrollWheelZoom: true,
    });

    tileLayerRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }
    ).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!disabledRef.current) {
        onLocationChangeRef.current({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    });

    mapRef.current = map;

    return () => {
      // Real unmount cleanup
      tileLayerRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      mapRef.current = null;
      map.remove(); // also deletes container._leaflet_id
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← intentionally empty: we manage state imperatively

  // ── Sync marker + circle whenever lat/lng/radius/disabled changes ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing overlay
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") return;

    // Marker
    const marker = L.marker([latitude, longitude], {
      icon: makeIcon(),
      draggable: !disabled,
    });

    if (!disabled) {
      marker.on("dragend", (e) => {
        const latlng = (e.target as L.Marker).getLatLng();
        onLocationChangeRef.current({
          latitude: latlng.lat,
          longitude: latlng.lng,
        });
      });
    }

    marker.addTo(map);
    markerRef.current = marker;

    // Circle
    const circle = L.circle([latitude, longitude], {
      radius,
      fillColor: "#4f46e5",
      color: "#4338ca",
      weight: 2,
      fillOpacity: 0.15,
    }).addTo(map);
    circleRef.current = circle;

    // Fly to new position smoothly
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
      duration: 0.8,
    });
  }, [latitude, longitude, radius, disabled]);

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {!disabled && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg bg-white/90 px-2 py-1 text-xs text-slate-500 shadow-sm backdrop-blur-sm">
          Haz clic o arrastra el pin para mover la ubicación
        </div>
      )}
      {/* The imperative Leaflet map is mounted on this div */}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
