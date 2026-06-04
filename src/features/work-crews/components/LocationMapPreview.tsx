import dynamic from "next/dynamic";
import { Navigation, MapPin } from "lucide-react";

const LocationPickerMap = dynamic(
  () => import("@/components/maps/LocationPickerMap").then((m) => m.LocationPickerMap),
  { ssr: false }
);

interface LocationMapPreviewProps {
  location?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    allowed_radius_meters: number;
  };
  className?: string;
}

export function LocationMapPreview({ location, className = "" }: LocationMapPreviewProps) {
  if (!location) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl ${className}`}>
        <MapPin className="size-10 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Esta obra aún no tiene ubicación configurada.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full h-full bg-white ${className}`}>
      <div className="p-4 bg-white border-b border-slate-100 flex items-start gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
          <MapPin className="size-5" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">{location.name}</h4>
          <p className="text-sm text-slate-500 mt-0.5">{location.address}</p>
        </div>
      </div>
      <div className="flex-1 min-h-[300px] bg-slate-50 border-b border-slate-100 relative">
        <LocationPickerMap
          latitude={location.latitude}
          longitude={location.longitude}
          radius={location.allowed_radius_meters}
          onLocationChange={() => {}}
          disabled={true}
        />
      </div>
      <div className="bg-slate-50/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white">
        <div className="flex flex-col">
          <span className="text-slate-700 text-sm font-semibold flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></div>
            Ubicación válida para asistencia
          </span>
          <span className="text-slate-500 text-xs ml-3.5">Radio permitido: {location.allowed_radius_meters}m</span>
        </div>
        <div className="text-slate-500 font-mono text-xs flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto">
          <Navigation className="size-3.5 text-slate-400" />
          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
