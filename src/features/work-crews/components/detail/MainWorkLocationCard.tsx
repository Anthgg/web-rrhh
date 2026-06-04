import { MapPin, Navigation, Compass, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainWorkLocationCardProps {
  crew: any;
  onChangeLocation: () => void;
}

export function MainWorkLocationCard({ crew, onChangeLocation }: MainWorkLocationCardProps) {
  const name = crew?.work_location_name || "Sin obra principal asignada";
  const address = crew?.work_location_address || "No se ha registrado una dirección.";
  const hasLocation = !!crew?.work_location_name;
  
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-200 shadow-sm h-full">
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <MapPin className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Obra Principal</h3>
            <p className="text-xs text-slate-500">Ubicación base de la cuadrilla</p>
          </div>
        </div>
        <Button variant="ghost" className="h-8 px-3 text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-full" onClick={onChangeLocation}>
          Cambiar Obra
        </Button>
      </div>
      
      {!hasLocation ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="size-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 mb-4">Esta cuadrilla no tiene una obra principal configurada.</p>
          <Button variant="secondary" onClick={onChangeLocation}>Configurar ubicación</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Compass className="size-4 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">{address}</div>
            </div>
          </div>
          {crew?.work_location_latitude && crew?.work_location_longitude && (
            <div className="flex items-center gap-3">
              <Navigation className="size-4 text-slate-400" />
              <div className="text-sm text-slate-600">
                Lat: {crew.work_location_latitude.toFixed(6)}, Lng: {crew.work_location_longitude.toFixed(6)}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 ml-1" />
            <div className="text-sm text-emerald-600 font-medium ml-1">Estado de obra: Activa</div>
          </div>
        </div>
      )}
    </div>
  );
}
