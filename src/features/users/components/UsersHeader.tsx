import { FileDown, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UsersHeaderProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
}

export function UsersHeader({ onExportPDF, onExportExcel, isExportingPdf, isExportingExcel }: UsersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">ACCESOS</p>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Usuarios</h1>
        <p className="text-sm text-ink-soft">Gestión de usuarios del sistema, roles, accesos y vinculación laboral.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onExportExcel} disabled={isExportingExcel} className="gap-2">
          {isExportingExcel ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          <span className="hidden sm:inline">{isExportingExcel ? "Exportando..." : "Exportar Excel"}</span>
          <span className="sm:hidden">Excel</span>
        </Button>
        <Button variant="secondary" onClick={onExportPDF} disabled={isExportingPdf} className="gap-2">
          {isExportingPdf ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          <span className="hidden sm:inline">{isExportingPdf ? "Exportando..." : "Exportar PDF"}</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>
    </div>
  );
}
