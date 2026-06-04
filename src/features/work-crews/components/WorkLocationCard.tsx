import { Building2, MapPin, CheckCircle2, Users, ArrowRightLeft, ArrowUpRight, ArrowDownRight, History, Navigation, Map } from "lucide-react";
import { type OrganizationWorkLocation } from "@/services/organization.service";
import { Button } from "@/components/ui/button";

interface WorkLocationCardProps {
  location: OrganizationWorkLocation;
  onViewDetail: () => void;
  onExport?: () => void;
}

export function WorkLocationCard({ location, onViewDetail, onExport }: WorkLocationCardProps) {
  const metrics = location.workers_metrics;
  const isActive = location.is_active ?? location.status ?? true;
  const hasCoordinates = location.latitude != null && location.longitude != null;

  const totalActive = metrics?.total_active ?? 0;
  const baseCrew = metrics?.base_crew_workers ?? 0;
  const tempReceived = metrics?.temporary_received ?? 0;
  const tempSent = metrics?.temporary_sent ?? 0;
  const totalMovements = metrics?.total_movements ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-indigo-200 group">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Building2 className="size-24 text-indigo-900" />
        </div>
        
        <div className="flex gap-4 relative z-10 w-full">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 group-hover:scale-105 transition-transform">
            <Building2 className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-base truncate pr-2">{location.name}</h3>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                    <CheckCircle2 className="size-3" /> Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    Inactiva
                  </span>
                )}
                {hasCoordinates ? (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                    <MapPin className="size-3" /> Ubicación GPS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                    Sin GPS
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500 truncate mt-1 flex items-center gap-1.5" title={location.address}>
              <Map className="size-3.5 shrink-0" />
              {location.address || "DirecciÃ³n no registrada"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Body: Metrics */}
      <div className="p-5 flex-1 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            Total actual en obra
          </span>
          <span className="inline-flex items-center justify-center min-w-8 h-8 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm">
            {totalActive}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <div className="size-1.5 rounded-full bg-emerald-500" />
              Base
            </span>
            <span className="font-bold text-slate-800 text-lg">{baseCrew}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <div className="size-1.5 rounded-full bg-amber-500" />
              Recibidos
            </span>
            <span className="font-bold text-slate-800 text-lg">{tempReceived}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <div className="size-1.5 rounded-full bg-rose-500" />
              Enviados
            </span>
            <span className="font-bold text-slate-800 text-lg">{tempSent}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <History className="size-3 text-slate-400" />
              Movimientos
            </span>
            <span className="font-bold text-slate-800 text-lg">{totalMovements}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
        <Button onClick={onViewDetail} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm">
          Ver detalle
        </Button>
        {onExport && (
          <Button variant="secondary" onClick={onExport} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            Exportar
          </Button>
        )}
        {hasCoordinates && (
          <Button 
            variant="secondary" 
            className="px-3 rounded-xl border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200" 
            title="Ver en mapa"
            onClick={() => window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
          >
            <Navigation className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
