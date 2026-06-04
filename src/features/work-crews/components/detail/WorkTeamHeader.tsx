import { ArrowLeft, UsersRound, FileText, FileSpreadsheet, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface WorkTeamHeaderProps {
  crew: any;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export function WorkTeamHeader({ crew, onExportPdf, onExportExcel }: WorkTeamHeaderProps) {
  const router = useRouter();
  const isActive = crew?.status === "active" || true; // Adjust according to your real status field

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border-b border-slate-200 px-6 py-5 shrink-0 shadow-sm gap-4">
      <div className="flex items-center gap-4">
        <Button variant="secondary" className="h-10 gap-2 rounded-xl border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Regresar</span>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <UsersRound className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{crew?.name || "Detalle de Cuadrilla"}</h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {isActive ? "Activa" : "Inactiva"}
              </span>
            </div>
            {crew?.description ? (
              <p className="text-sm text-slate-500 mt-0.5">{crew.description}</p>
            ) : (
              <p className="text-sm text-slate-500 mt-0.5">Administra el supervisor, obra y trabajadores asignados</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button variant="secondary" title="Exportar PDF" onClick={onExportPdf} className="h-10 w-10 shrink-0 rounded-xl border-rose-200 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
          <FileText className="size-4" />
        </Button>
        <Button variant="secondary" title="Exportar Excel" onClick={onExportExcel} className="h-10 w-10 shrink-0 rounded-xl border-emerald-200 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
          <FileSpreadsheet className="size-4" />
        </Button>
        {/* Placeholder for future "Edit" action */}
        <Button variant="secondary" className="h-10 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50">
          <Edit className="size-4" />
          Editar Cuadrilla
        </Button>
      </div>
    </div>
  );
}
