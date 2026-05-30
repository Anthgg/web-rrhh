"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderDown, Search, LayoutTemplate, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingPanel } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { requestsService } from "@/services/requests.service";
import { useReportTemplates } from "@/hooks/useReportTemplates";
import { reportTemplatesApi } from "@/services/reportTemplatesApi";
import { RequestTemplateCard } from "@/components/requests/RequestTemplateCard";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

export function RequestTemplatesGrid() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"documents" | "reports">("documents");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  // Consulta para plantillas de documentos del sistema (Pestaña 1)
  const templatesQuery = useQuery({
    queryKey: ["request-templates"],
    queryFn: () => requestsService.getTemplates(),
    staleTime: 300_000,
  });

  const downloadMutation = useMutation({
    mutationFn: (templateId: string) => requestsService.downloadTemplate(templateId),
    onSuccess: () => {
      toast.success("La descarga de la plantilla se inicio correctamente.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Consulta para plantillas de reportes de solicitudes guardadas (Pestaña 2)
  const reportTemplatesQuery = useReportTemplates("requests");

  const deleteReportTemplateMutation = useMutation({
    mutationFn: (id: string) => reportTemplatesApi.remove(id),
    onSuccess: () => {
      toast.success("Plantilla de reporte eliminada correctamente.");
      void queryClient.invalidateQueries({ queryKey: ["report-templates", "requests"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Filtrado local de plantillas de documentos
  const filteredTemplates = useMemo(() => {
    return (templatesQuery.data ?? []).filter((template) => {
      const searchText = [template.name, template.description, template.requestType]
        .join(" ")
        .toLowerCase();

      if (status !== "all" && template.status !== status) return false;
      if (search && !searchText.includes(search.toLowerCase())) return false;

      return true;
    });
  }, [search, status, templatesQuery.data]);

  // Filtrado local de plantillas de reportes
  const filteredReportTemplates = useMemo(() => {
    return (reportTemplatesQuery.data ?? []).filter((template) => {
      const searchText = [template.name, template.description]
        .join(" ")
        .toLowerCase();
      if (search && !searchText.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, reportTemplatesQuery.data]);

  if (activeTab === "documents" && templatesQuery.isLoading && !templatesQuery.data) {
    return <LoadingPanel title="Cargando plantillas de solicitudes..." />;
  }

  if (activeTab === "reports" && reportTemplatesQuery.isLoading && !reportTemplatesQuery.data) {
    return <LoadingPanel title="Cargando plantillas de reportes guardadas..." />;
  }

  return (
    <div className="grid gap-6">
      {/* Selector de Pestañas (Tabs) con estéticas premium */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("documents");
            setSearch("");
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === "documents"
              ? "border-brand text-brand"
              : "border-transparent text-ink-soft hover:border-slate-300 hover:text-ink"
          }`}
        >
          <FolderDown className="size-4" />
          Formatos oficiales
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("reports");
            setSearch("");
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === "reports"
              ? "border-brand text-brand"
              : "border-transparent text-ink-soft hover:border-slate-300 hover:text-ink"
          }`}
        >
          <LayoutTemplate className="size-4" />
          Reportes guardados
        </button>
      </div>

      {activeTab === "documents" ? (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-1">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                  <FolderDown className="size-3.5" />
                  Plantillas automáticas
                </div>
                <p className="text-sm text-ink-soft">
                  Descarga formatos oficiales predefinidos para tramitar cada tipo de solicitud.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {filteredTemplates.length} plantilla(s)
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <FieldFrame label="Buscar plantilla">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Vacaciones, constancia, turno, descanso..."
                    className="pl-11"
                  />
                </div>
              </FieldFrame>

              <FieldFrame label="Estado">
                <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                  <option value="all">Todas</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </Select>
              </FieldFrame>
            </div>
          </Card>

          {templatesQuery.isError && !templatesQuery.data ? (
            <ErrorState
              title="No se pudo cargar el catálogo de plantillas"
              description={getErrorMessage(templatesQuery.error)}
              onRetry={() => void templatesQuery.refetch()}
            />
          ) : !filteredTemplates.length ? (
            <EmptyState
              title="No se encontraron plantillas"
              description="Prueba con otro criterio de búsqueda o revisa el estado del catálogo."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredTemplates.map((template) => (
                <RequestTemplateCard
                  key={template.id}
                  template={template}
                  onDownload={(item) => {
                    downloadMutation.mutate(item.id);
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-1">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                  <LayoutTemplate className="size-3.5" />
                  Configuraciones de reportes
                </div>
                <p className="text-sm text-ink-soft">
                  Gestiona tus plantillas de filtros y columnas personalizadas guardadas para el reporte de solicitudes.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {filteredReportTemplates.length} reporte(s)
              </div>
            </div>

            <FieldFrame label="Buscar reporte guardado">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o descripción de plantilla..."
                  className="pl-11"
                />
              </div>
            </FieldFrame>
          </Card>

          {reportTemplatesQuery.isError && !reportTemplatesQuery.data ? (
            <ErrorState
              title="No se pudieron cargar las plantillas de reportes"
              description={getErrorMessage(reportTemplatesQuery.error)}
              onRetry={() => void reportTemplatesQuery.refetch()}
            />
          ) : !filteredReportTemplates.length ? (
            <EmptyState
              title="No se encontraron reportes guardados"
              description="Aún no has guardado ninguna configuración de reporte. Hazlo desde Solicitudes -> Reportes -> Guardar plantilla."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredReportTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="grid gap-4 border border-border bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] hover:shadow-[0_25px_70px_rgba(15,23,42,0.12)] transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <h3 className="text-base font-semibold text-ink">{template.name}</h3>
                      <p className="text-xs text-ink-soft leading-relaxed">
                        {template.description || "Configuración de reporte de solicitudes."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-1.5 text-xs text-ink-soft border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span>Columnas:</span>
                      <span className="font-semibold text-ink">{template.columns.length}</span>
                    </div>
                    {template.isDefault && (
                      <div className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        Por defecto
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/dashboard/requests/reports?templateId=${template.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                    >
                      <Link2 className="mr-1.5 size-3.5" />
                      Usar plantilla
                    </Link>
                    <button
                      type="button"
                      disabled={deleteReportTemplateMutation.isPending}
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas eliminar la plantilla "${template.name}"?`)) {
                          deleteReportTemplateMutation.mutate(template.id);
                        }
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-rose-700 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
