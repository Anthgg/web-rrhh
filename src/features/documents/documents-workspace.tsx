"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Plus,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { workersService } from "@/services/workers.service";
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [replaceContext, setReplaceContext] = useState<{
    workerId: string;
    documentId: string;
    type: string;
    title: string;
  } | null>(null);

  // Fetch documents list
  const {
    data: documentsData,
    isError: isDocumentsError,
    isLoading: isDocumentsLoading,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["documents", page, search, status, selectedType, selectedWorkerId],
    queryFn: () =>
      documentsService.list({
        page,
        pageSize: 10,
        search: search || undefined,
        status: status || undefined,
        type: selectedType || undefined,
        workerId: selectedWorkerId || undefined,
      }),
  });

  // Fetch document types
  const { data: documentTypes = [] } = useQuery({
    queryKey: ["document-types"],
    queryFn: () => documentsService.getTypes(),
  });

  // Fetch workers list for upload select
  const { data: workersResponse } = useQuery({
    queryKey: ["workers-for-docs"],
    queryFn: () => workersService.list({ page: 1, pageSize: 150 }),
  });

  const workers = useMemo(() => {
    return workersResponse?.items || [];
  }, [workersResponse]);

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentsService.delete(documentId),
    onSuccess: () => {
      toast.success("Documento eliminado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setIsDeleteOpen(false);
      setActiveDocument(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Ocurrió un error al eliminar el documento.");
    },
  });

  const handleOpenUpload = (workerId?: string) => {
    setReplaceContext(null);
    setIsUploadOpen(true);
  };

  const handleOpenReplace = (doc: DocumentRecord) => {
    setReplaceContext({
      workerId: doc.workerId || "",
      documentId: doc.id,
      type: doc.documentType || doc.type || "",
      title: doc.title,
    });
    setIsUploadOpen(true);
  };

  const handleOpenReview = (doc: DocumentRecord) => {
    setActiveDocument(doc);
    setIsReviewOpen(true);
  };

  const handleOpenDelete = (doc: DocumentRecord) => {
    setActiveDocument(doc);
    setIsDeleteOpen(true);
  };

  const columns = useMemo<Column<DocumentRecord>[]>(
    () => [
      {
        key: "worker",
        header: "Trabajador",
        render: (item) => (
          <div className="grid gap-0.5">
            <span className="font-semibold text-foreground">{item.workerName || "Sin nombre"}</span>
            <span className="text-xs text-muted-foreground">ID: {(item.workerId || "").slice(0, 8)}...</span>
          </div>
        ),
      },
      {
        key: "type",
        header: "Tipo",
        render: (item) => (
          <span className="px-2 py-1 rounded bg-muted text-xs font-mono text-muted-foreground uppercase">
            {item.documentType || item.type}
          </span>
        ),
      },
      {
        key: "title",
        header: "Título / Nombre",
        render: (item) => (
          <div className="grid gap-0.5">
            <span className="font-medium text-foreground">{item.title}</span>
            {item.fileName && (
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                {item.fileName}
              </span>
            )}
            {(item.contractCode || item.contract_code) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-1 w-max">
                Código: {item.contractCode || item.contract_code}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: "file",
        header: "Archivo",
        render: (item) => {
          if (!item.fileUrl) {
            return <span className="text-xs text-muted-foreground">Sin archivo</span>;
          }
          return (
            <Button
              variant="secondary"
              className="h-8 rounded-xl px-2.5 text-xs inline-flex items-center gap-1.5"
              onClick={() => window.open(item.fileUrl!, "_blank", "noopener,noreferrer")}
            >
              <Eye className="size-3.5" />
              Ver
            </Button>
          );
        },
      },
      {
        key: "uploadedAt",
        header: "Fecha de Subida",
        render: (item) => item.uploadedAt ? formatDate(item.uploadedAt) : "-",
      },
      {
        key: "reviewedBy",
        header: "Revisión",
        render: (item) => {
          if (!item.reviewedAt) return <span className="text-xs text-muted-foreground">Pendiente</span>;
          return (
            <div className="grid gap-0.5 text-xs">
              <span className="text-foreground font-medium">Revisado</span>
              <span className="text-muted-foreground">{formatDate(item.reviewedAt)}</span>
            </div>
          );
        },
      },
      {
        key: "comment",
        header: "Comentario",
        render: (item) => (
          <span className="text-xs text-muted-foreground block max-w-[150px] truncate" title={item.reviewComment || ""}>
            {item.reviewComment || "-"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Acciones",
        render: (item) => (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="h-8 rounded-xl px-2 text-xs"
              onClick={() => handleOpenReview(item)}
            >
              Revisar
            </Button>
            {item.canReplace && (
              <Button
                variant="secondary"
                className="h-8 rounded-xl px-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50/50"
                onClick={() => handleOpenReplace(item)}
              >
                Reemplazar
              </Button>
            )}
            <Button
              variant="ghost"
              className="h-8 rounded-xl px-2 text-xs text-destructive hover:bg-destructive/10"
              disabled={!item.canDelete}
              onClick={() => handleOpenDelete(item)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // Map backend items into format expected by legacy export modal
  const exportData = useMemo(() => {
    if (!documentsData?.items) return [];
    return documentsData.items.map((item: DocumentRecord) => ({
      title: item.title,
      category: item.documentType || item.type,
      ownerName: item.workerName,
      project: "",
      status: item.status,
      updatedAt: item.uploadedAt || "",
    }));
  }, [documentsData]);

  if (isDocumentsLoading) {
    return <LoadingPanel title="Cargando centro de documentos..." />;
  }

  if (isDocumentsError || !documentsData) {
    return (
      <ErrorState
        title="No pudimos cargar los documentos"
        description="Hubo un problema al consultar el servicio de documentos. Por favor intenta de nuevo."
        onRetry={() => void refetchDocuments()}
      />
    );
  }

  const items = documentsData.items || [];

  return (
    <>
      <PageHeader
        eyebrow="Repositorio"
        title="Centro de Documentos"
        description="Gestiona, revisa y aprueba la documentación obligatoria y expedientes digitales de los trabajadores."
        action={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="rounded-xl border-border hover:bg-muted"
              onClick={() => setIsExportModalOpen(true)}
            >
              <FileText className="mr-2 size-4 text-muted-foreground" />
              Exportar PDF
            </Button>
            <Button
              variant="primary"
              className="rounded-xl inline-flex items-center gap-2"
              onClick={() => handleOpenUpload()}
            >
              <Plus className="size-4" />
              Subir Documento
            </Button>
          </div>
        }
      />

      <Card className="grid gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm">
        {/* Filters Panel */}
        <div className="grid gap-4 md:grid-cols-4">
          <FieldFrame label="Buscar por título/nombre">
            <Input
              value={search}
              placeholder="Ej. Contrato, DNI, etc..."
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </FieldFrame>

          <FieldFrame label="Filtrar por Estado">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="missing">Falta cargar</option>
              <option value="pending">Pendiente</option>
              <option value="observed">Observado</option>
              <option value="rejected">Rechazado</option>
              <option value="approved">Aprobado</option>
              <option value="generated">Generado</option>
              <option value="signed">Firmado</option>
              <option value="expired">Vencido</option>
            </Select>
          </FieldFrame>

          <FieldFrame label="Filtrar por Tipo">
            <Select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los tipos</option>
              {documentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <FieldFrame label="Trabajador">
            <Select
              value={selectedWorkerId}
              onChange={(e) => {
                setSelectedWorkerId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los trabajadores</option>
              {workers.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.fullName}
                </option>
              ))}
            </Select>
          </FieldFrame>
        </div>

        {/* Data Table */}
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(item) => item.id}
          />
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          page={documentsData.page}
          pageSize={documentsData.pageSize}
          total={documentsData.total}
          onPageChange={setPage}
        />
      </Card>

      {/* Export PDF Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportType="documents"
        activeFilters={{
          status: status || undefined,
          search: search || undefined,
        }}
        tableData={exportData}
        tableColumns={documentColumnsForExport}
        filename="reporte-documentos-rrhh"
      />

      {/* Upload/Replace Document Modal */}
      {isUploadOpen && (
        <UploadDocumentModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            refetchDocuments();
            setIsUploadOpen(false);
          }}
          workers={workers}
          documentTypes={documentTypes}
          replaceContext={replaceContext}
        />
      )}

      {/* Review Document Modal */}
      {isReviewOpen && activeDocument && (
        <ReviewDocumentModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onSuccess={() => {
            refetchDocuments();
            setIsReviewOpen(false);
            setActiveDocument(null);
          }}
          document={activeDocument}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="text-destructive size-5" />
                Eliminar Documento
              </h3>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsDeleteOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro de que deseas eliminar el documento{" "}
              <strong className="text-foreground font-semibold">
                "{activeDocument.title}"
              </strong>{" "}
              del trabajador{" "}
              <strong className="text-foreground font-semibold">
                {activeDocument.workerName}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="inline-flex items-center gap-2"
                onClick={() => deleteMutation.mutate(activeDocument.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Confirmar Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ----------------------------------------------------
// Upload / Replace Document Modal Component
// ----------------------------------------------------
interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workers: any[];
  documentTypes: string[];
  replaceContext?: {
    workerId: string;
    documentId: string;
    type: string;
    title: string;
  } | null;
}

function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  workers,
  documentTypes,
  replaceContext,
}: UploadDocumentModalProps) {
  const [workerId, setWorkerId] = useState(replaceContext?.workerId || "");
  const [type, setType] = useState(replaceContext?.type || "");
  const [title, setTitle] = useState(replaceContext?.title || "");
  const [description, setDescription] = useState("");
  const fileRef = useRef<File | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isReplacing = Boolean(replaceContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) {
      toast.error("Debe seleccionar un trabajador.");
      return;
    }
    if (!type) {
      toast.error("Debe seleccionar o especificar un tipo de documento.");
      return;
    }
    if (!title.trim()) {
      toast.error("Debe ingresar un título.");
      return;
    }
    const selectedFile = fileRef.current;
    if (!selectedFile) {
      toast.error("Debe seleccionar un archivo para cargar.");
      return;
    }

    try {
      setIsPending(true);
      await documentsService.upload(workerId, {
        file: selectedFile,
        type,
        title,
        description: description || undefined,
        documentId: replaceContext?.documentId || undefined,
      });
      toast.success(
        isReplacing
          ? "Documento reemplazado con éxito."
          : "Documento subido correctamente."
      );
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Ocurrió un error al subir el documento.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Upload className="text-primary size-5" />
            {isReplacing ? "Reemplazar Documento" : "Subir Documento de Trabajador"}
          </h3>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Worker Select */}
          <FieldFrame label="Trabajador">
            <Select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              disabled={isReplacing || isPending}
              required
            >
              <option value="">Selecciona un trabajador...</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName}
                </option>
              ))}
            </Select>
          </FieldFrame>

          {/* Document Type select/input */}
          <FieldFrame label="Tipo de Documento">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isReplacing || isPending}
              required
            >
              <option value="">Selecciona tipo...</option>
              {documentTypes.length > 0 ? (
                documentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              ) : (
                <>
                  <option value="DNI">DNI</option>
                  <option value="CV">CV</option>
                  <option value="MEDICAL_CERTIFICATE">Certificado médico</option>
                </>
              )}
            </Select>
          </FieldFrame>

          {/* Title */}
          <FieldFrame label="Título del Documento">
            <Input
              type="text"
              placeholder="Ej. Copia DNI Vigente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              required
            />
          </FieldFrame>

          {/* Description */}
          <FieldFrame label="Descripción (opcional)">
            <Input
              type="text"
              placeholder="Ej. Subido para regularización de legajo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </FieldFrame>

          {/* File input */}
          <FieldFrame label="Archivo">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                aria-label="Archivo del documento"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                onChange={(e) => {
                  fileRef.current = e.target.files?.[0] ?? null;
                }}
                disabled={isPending}
                required
              />
              <span className="text-xs text-muted-foreground">
                Soporta PDF, PNG, JPG de hasta 10MB.
              </span>
            </div>
          </FieldFrame>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="inline-flex items-center gap-2"
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isReplacing ? "Reemplazar y Guardar" : "Subir Documento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Review Document Modal Component
// ----------------------------------------------------
interface ReviewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  document: DocumentRecord;
}

function ReviewDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  document: doc,
}: ReviewDocumentModalProps) {
  const [status, setStatus] = useState<"approved" | "rejected" | "observed">("approved");
  const [comment, setComment] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((status === "observed" || status === "rejected") && !comment.trim()) {
      toast.error("Debe ingresar un comentario para detallar el motivo.");
      return;
    }

    try {
      setIsPending(true);
      await documentsService.review(doc.id, {
        status,
        reviewComment: comment || undefined,
      });
      toast.success("Revisión guardada con éxito.");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Ocurrió un error al guardar la revisión.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="text-primary size-5" />
            Revisar Documento
          </h3>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4 bg-muted/30 p-3 rounded-xl border border-border text-xs space-y-1">
          <div>
            <strong className="text-foreground">Trabajador:</strong> {doc.workerName}
          </div>
          <div>
            <strong className="text-foreground">Documento:</strong> {doc.title} ({doc.documentType || doc.type})
          </div>
          {doc.fileName && (
            <div>
              <strong className="text-foreground">Archivo:</strong> {doc.fileName}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldFrame label="Resultado de la revisión">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={isPending}
            >
              <option value="approved">Aprobar</option>
              <option value="observed">Observar (Requiere comentarios)</option>
              <option value="rejected">Rechazar (Requiere comentarios)</option>
            </Select>
          </FieldFrame>

          <FieldFrame
            label="Comentarios de revisión"
            hint={status !== "approved" ? "Indica por qué se observa/rechaza el documento" : "Opcional"}
          >
            <textarea
              aria-label="Comentarios de revisión"
              className="w-full min-h-[90px] rounded-2xl border border-border bg-card p-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Ej. El documento se encuentra borroso o vencido."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
              required={status !== "approved"}
            />
          </FieldFrame>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="inline-flex items-center gap-2"
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Guardar Revisión
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
