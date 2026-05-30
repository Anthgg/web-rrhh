"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { ExportReportModal } from "@/components/reports/ExportReportModal";
import { formatDate } from "@/lib/utils/format";
import { documentsService } from "@/services/documents.service";
import type { DocumentRecord } from "@/types";

const documentColumnsForExport = [
  { key: "title", label: "Título de Documento" },
  { key: "category", label: "Categoría" },
  { key: "ownerName", label: "Titular" },
  { key: "project", label: "Proyecto" },
  { key: "status", label: "Estado" },
  { key: "updatedAt", label: "Fecha Actualización" },
];

export function DocumentsWorkspace() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const documentsQuery = useQuery({
    queryKey: ["documents", page, search, status],
    queryFn: () =>
      documentsService.list({
        page,
        pageSize: 8,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const columns = useMemo<Column<DocumentRecord>[]>(
    () => [
      {
        key: "title",
        header: "Documento",
        render: (item) => (
          <div className="grid gap-1">
            <strong className="font-semibold text-ink">{item.title}</strong>
            <span className="text-xs text-ink-soft">{item.category}</span>
          </div>
        ),
      },
      {
        key: "owner",
        header: "Titular",
        render: (item) => (
          <div className="grid gap-1">
            <span>{item.ownerName}</span>
            <span className="text-xs text-ink-soft">{item.project ?? "Sin proyecto"}</span>
          </div>
        ),
      },
      {
        key: "date",
        header: "Actualizacion",
        render: (item) => formatDate(item.updatedAt),
      },
      {
        key: "status",
        header: "Estado",
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: "actions",
        header: "Acciones",
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-9 px-3"
              disabled={!item.url}
              onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 size-4" />
              Abrir
            </Button>
            <Button
              variant="ghost"
              className="h-9 px-3"
              disabled={!item.url}
              onClick={async () => {
                if (!item.url) return;
                await navigator.clipboard.writeText(item.url);
                toast.success("Enlace copiado.");
              }}
            >
              <Copy className="mr-2 size-4" />
              Copiar
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (documentsQuery.isLoading) {
    return <LoadingPanel title="Cargando documentos." />;
  }

  if (documentsQuery.isError || !documentsQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar documentos"
        description="La vista consume solo la API real. Revisa el backend o ajusta la ruta si este modulo aun no esta disponible."
        onRetry={() => void documentsQuery.refetch()}
      />
    );
  }

  const data = documentsQuery.data;

  return (
    <>
      <PageHeader
        eyebrow="Repositorio"
        title="Documentos"
        description="Consulta administrativa de documentos, estado de vigencia y accesos rapidos a los enlaces asociados."
        action={
          <Button
            variant="secondary"
            className="rounded-xl border-slate-200 hover:bg-slate-50"
            onClick={() => setIsExportModalOpen(true)}
          >
            <FileText className="mr-2 size-4 text-slate-500" />
            Exportar PDF
          </Button>
        }
      />

      <Card className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.6fr]">
          <FieldFrame label="Buscar">
            <Input
              value={search}
              placeholder="Documento, categoria o titular"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </FieldFrame>
          <FieldFrame label="Estado">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="available">Disponible</option>
              <option value="pending">Pendiente</option>
              <option value="expired">Vencido</option>
              <option value="missing">Faltante</option>
            </Select>
          </FieldFrame>
        </div>

        <DataTable columns={columns} rows={data.items} rowKey={(item) => item.id} />
        <PaginationControls
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      </Card>

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportType="documents"
        activeFilters={{
          status: status || undefined,
          search: search || undefined
        }}
        tableData={data.items}
        tableColumns={documentColumnsForExport}
        filename="reporte-documentos-fabryor"
      />
    </>
  );
}
