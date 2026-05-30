"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Edit3, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EditTemplateModal } from "@/components/reports/EditTemplateModal";
import { EmptyState } from "@/components/reports/EmptyState";
import { ErrorState } from "@/components/reports/ErrorState";
import { ReportsLayout } from "@/components/reports/ReportsLayout";
import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { useReportTemplates } from "@/hooks/useReportTemplates";
import { reportTemplatesApi } from "@/services/reportTemplatesApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/features/auth/auth-provider";
import { getTemplateOwnerLabel } from "@/features/reports/report-config";
import { formatDateTime } from "@/lib/utils/format";
import type { ReportTemplate, SaveReportTemplatePayload } from "@/types/report.types";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

export function ReportsTemplatesPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const templatesQuery = useReportTemplates();
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ReportTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return (templatesQuery.data ?? []).filter(
      (template) => template.module !== "requests" && !template.reportType?.startsWith("requests")
    );
  }, [templatesQuery.data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveReportTemplatePayload }) =>
      reportTemplatesApi.update(id, payload),
    onSuccess: () => {
      toast.success("Plantilla actualizada correctamente.");
      setEditingTemplate(null);
      void queryClient.invalidateQueries({ queryKey: ["report-templates", "requests"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => reportTemplatesApi.remove(templateId),
    onSuccess: () => {
      toast.success("Plantilla eliminada correctamente.");
      setDeletingTemplate(null);
      void queryClient.invalidateQueries({ queryKey: ["report-templates", "requests"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <ReportsLayout
      title="Plantillas de reportes"
      description="Administra configuraciones reutilizables para acelerar la generacion de reportes y conservar criterios compartidos."
    >
      {templatesQuery.isError ? (
        <ErrorState
          title="No se pudieron cargar las plantillas"
          description={getErrorMessage(templatesQuery.error)}
          onRetry={() => void templatesQuery.refetch()}
        />
      ) : !filteredTemplates.length ? (
        <EmptyState
          title="Aun no hay plantillas guardadas"
          description="Guarda tu primera configuracion desde el generador para reutilizar filtros, columnas y graficos."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => {
            const canDelete = !template.isDefault || user?.role === "admin" || user?.role === "hr";

            return (
              <Card
                key={template.id}
                className="grid gap-4 border-border bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <h3 className="text-lg font-semibold text-ink">{template.name}</h3>
                    <p className="text-sm text-ink-soft">
                      {template.description || "Plantilla reutilizable para reportes de solicitudes."}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {getTemplateOwnerLabel(template)}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-ink-soft">
                  <p>Tipo: {template.reportType}</p>
                  <p>Columnas: {template.columns.length}</p>
                  <p>Actualizada: {formatDateTime(template.updatedAt ?? template.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/reports/generator?templateId=${template.id}`}>
                    <Button>
                      <Link2 className="mr-2 size-4" />
                      Usar plantilla
                    </Button>
                  </Link>
                  <Button variant="secondary" onClick={() => setEditingTemplate(template)}>
                    <Edit3 className="mr-2 size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                    disabled={!canDelete || deleteMutation.isPending}
                    onClick={() => {
                      if (!canDelete) {
                        toast.error("No puedes eliminar una plantilla por defecto.");
                        return;
                      }

                      setDeletingTemplate(template);
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <EditTemplateModal
        template={editingTemplate}
        isOpen={Boolean(editingTemplate)}
        isSubmitting={updateMutation.isPending}
        isDefaultAllowed={Boolean(user?.role === "admin" || user?.role === "hr")}
        filters={editingTemplate?.filters ?? {}}
        columns={editingTemplate?.columns ?? []}
        chartConfig={editingTemplate?.chartConfig}
        onClose={() => setEditingTemplate(null)}
        onSubmit={(payload) => {
          if (!editingTemplate) return;
          updateMutation.mutate({ id: editingTemplate.id, payload });
        }}
      />

      <RequestModalShell
        isOpen={Boolean(deletingTemplate)}
        onClose={() => setDeletingTemplate(null)}
        title="Eliminar plantilla"
        subtitle="Confirma si deseas quitar esta configuracion del catalogo de reportes."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeletingTemplate(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deletingTemplate) return;
                deleteMutation.mutate(deletingTemplate.id);
              }}
              disabled={deleteMutation.isPending}
            >
              Eliminar plantilla
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertTriangle className="size-6" />
          </div>
          <div className="grid gap-2">
            <p className="text-base font-semibold text-ink">
              {deletingTemplate?.name ?? "Plantilla seleccionada"}
            </p>
            <p className="text-sm leading-6 text-ink-soft">
              Esta accion eliminara la plantilla guardada. No se puede deshacer.
            </p>
          </div>
        </div>
      </RequestModalShell>
    </ReportsLayout>
  );
}
