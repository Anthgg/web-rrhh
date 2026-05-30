import Image from "next/image";
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  History,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/fields";
import { formatDate, formatDateRange, formatDateTime, formatFileSize } from "@/lib/utils/format";
import type { RequestAttachment, RequestDetail } from "@/types/requests";

import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";

interface RequestDetailModalProps {
  isOpen: boolean;
  request: RequestDetail | null;
  isLoading?: boolean;
  isError?: boolean;
  errorDescription?: string;
  isSubmitting?: boolean;
  isUploadingDocuments?: boolean;
  deletingDocumentId?: string | null;
  onRetry?: () => void;
  onClose: () => void;
  onEdit?: (request: RequestDetail) => void;
  onCancel?: (request: RequestDetail) => void;
  onResubmit?: (request: RequestDetail) => void;
  onApprove?: (request: RequestDetail) => void;
  onReject?: (request: RequestDetail) => void;
  onObserve?: (request: RequestDetail) => void;
  onUploadDocuments?: (requestId: string, files: File[]) => Promise<unknown> | void;
  onDeleteDocument?: (requestId: string, documentId: string) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-[1.25rem] border border-border bg-white/85 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

function getAttachmentIcon(attachment: RequestAttachment) {
  const mimeType = attachment.mimeType?.toLowerCase() ?? "";
  const fileName = attachment.name.toLowerCase();

  if (attachment.isImage || mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("spreadsheet") || fileName.match(/\.(xls|xlsx|csv)$/)) return FileSpreadsheet;
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("presentation") ||
    fileName.match(/\.(pdf|doc|docx|ppt|pptx|txt)$/)
  ) {
    return FileText;
  }

  return File;
}

function getQueuedFileIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon;
  if (file.type.includes("spreadsheet") || file.name.match(/\.(xls|xlsx|csv)$/i)) return FileSpreadsheet;
  if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.type.includes("presentation") ||
    file.name.match(/\.(pdf|doc|docx|ppt|pptx|txt)$/i)
  ) {
    return FileText;
  }

  return File;
}

function createQueuedImagePreview(file: File) {
  if (!file.type.startsWith("image/")) return null;
  return URL.createObjectURL(file);
}

export function RequestDetailModal({
  isOpen,
  request,
  isLoading = false,
  isError = false,
  errorDescription,
  isSubmitting = false,
  isUploadingDocuments = false,
  deletingDocumentId,
  onRetry,
  onClose,
  onEdit,
  onCancel,
  onResubmit,
  onApprove,
  onReject,
  onObserve,
  onUploadDocuments,
  onDeleteDocument,
}: RequestDetailModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<RequestAttachment | null>(null);

  const queuedPreviews = useMemo(
    () =>
      queuedFiles.map((file) => ({
        file,
        previewUrl: createQueuedImagePreview(file),
      })),
    [queuedFiles],
  );

  useEffect(() => {
    return () => {
      queuedPreviews.forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      });
    };
  }, [queuedPreviews]);

  const canManageDocuments = Boolean(request && (request.canEdit || request.canResubmit));
  const hasWorkerActions = Boolean(request && (request.canEdit || request.canCancel || request.canResubmit));
  const hasReviewActions = Boolean(request && request.canReview);
  const additionalComment =
    request && typeof request.metadata?.additionalComment === "string"
      ? request.metadata.additionalComment
      : null;
  const isReviewedRequest = Boolean(
    request && ["approved", "rejected", "observed"].includes(request.status),
  );
  const approverLabel =
    request?.approvedBy?.trim() || (isReviewedRequest ? "Aprobador del Sistema" : undefined);
  const approverRowLabel = request?.status === "approved" ? "Aprobada por" : "Revisada por";
  const reviewDateLabel = request?.status === "approved" ? "Fecha de aprobacion" : "Fecha de revision";

  const appendFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles).slice(0, 5);

    setQueuedFiles((current) => {
      const merged = [...current, ...nextFiles]
        .filter(
          (file, index, array) =>
            array.findIndex((entry) => entry.name === file.name && entry.size === file.size) === index,
        )
        .slice(0, 5);

      return merged;
    });
  };

  return (
    <>
      <RequestModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Detalle de la solicitud"
        subtitle="Consulta informacion general, comentarios, adjuntos e historial de revision."
        position="right"
        footer={
          request ? (
            <div className="flex flex-col gap-3">
              {hasReviewActions ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => onApprove?.(request)} disabled={isSubmitting}>
                    <CheckCircle2 className="mr-2 size-4" />
                    Aprobar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onObserve?.(request)}
                    disabled={isSubmitting}
                  >
                    <Eye className="mr-2 size-4" />
                    Observar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onReject?.(request)}
                    disabled={isSubmitting}
                  >
                    <XCircle className="mr-2 size-4" />
                    Rechazar
                  </Button>
                </div>
              ) : null}

              {hasWorkerActions ? (
                <div className="flex flex-wrap gap-2">
                  {request.canEdit ? (
                    <Button
                      variant="secondary"
                      onClick={() => onEdit?.(request)}
                      disabled={isSubmitting}
                    >
                      Editar solicitud
                    </Button>
                  ) : null}

                  {request.canResubmit ? (
                    <Button onClick={() => onResubmit?.(request)} disabled={isSubmitting}>
                      <RotateCcw className="mr-2 size-4" />
                      Reenviar a revision
                    </Button>
                  ) : null}

                  {request.canCancel ? (
                    <Button
                      variant="ghost"
                      className="text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onCancel?.(request)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Cancelar solicitud
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button variant="secondary" onClick={onClose} disabled={isSubmitting || isUploadingDocuments}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {isLoading ? <LoadingPanel title="Cargando detalle de la solicitud." /> : null}

        {!isLoading && isError ? (
          <ErrorState
            title="No pudimos cargar el detalle"
            description={errorDescription ?? "La solicitud existe, pero el backend no devolvio su detalle completo."}
            onRetry={onRetry}
          />
        ) : null}

        {!isLoading && !isError && request ? (
          <div className="grid gap-5">
            <Card className="grid gap-5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-2">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                    <FileText className="size-3.5" />
                    {request.code}
                  </div>
                  <div>
                    <h3 className="section-title text-2xl font-semibold text-ink">{request.typeName}</h3>
                    <p className="text-sm text-ink-soft">{request.reason}</p>
                  </div>
                </div>

                <RequestStatusBadge status={request.status} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Trabajador" value={request.requester.fullName} />
                <DetailRow label="Cargo" value={request.requester.position ?? "No informado"} />
                <DetailRow label="Area / proyecto" value={request.requester.project ?? request.requester.department ?? "No informado"} />
                <DetailRow label="Creada" value={formatDateTime(request.createdAt)} />
                <DetailRow label="Rango solicitado" value={formatDateRange(request.startDate, request.endDate)} />
                <DetailRow label="Dias solicitados" value={request.daysRequested ? String(request.daysRequested) : "No informado"} />
                <DetailRow label="Ultima actualizacion" value={formatDateTime(request.updatedAt ?? request.createdAt)} />
                {isReviewedRequest && approverLabel ? (
                  <DetailRow label={approverRowLabel} value={approverLabel} />
                ) : null}
                {isReviewedRequest ? (
                  <DetailRow
                    label={reviewDateLabel}
                    value={request.approvedAt ? formatDateTime(request.approvedAt) : "Sin registro"}
                  />
                ) : null}
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="grid gap-4 p-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-brand" />
                  <h4 className="section-title text-lg font-semibold text-ink">Contenido</h4>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-border bg-slate-50/80 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                      Motivo
                    </span>
                    <p className="mt-2 text-sm leading-6 text-ink">{request.reason}</p>
                  </div>

                <div className="rounded-[1.5rem] border border-border bg-slate-50/80 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Observaciones RRHH / Admin
                  </span>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    {request.reviewComment ?? "Sin observaciones registradas."}
                  </p>
                </div>

                {additionalComment ? (
                  <div className="rounded-[1.5rem] border border-border bg-slate-50/80 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                      Comentario adicional del trabajador
                    </span>
                    <p className="mt-2 text-sm leading-6 text-ink">{additionalComment}</p>
                  </div>
                ) : null}
              </div>
            </Card>

              <div className="grid gap-5">
                <Card className="grid gap-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="size-4 text-brand" />
                      <h4 className="section-title text-lg font-semibold text-ink">Adjuntos</h4>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-soft">
                      {request.attachments.length} archivo(s)
                    </span>
                  </div>

                  {!request.attachments.length ? (
                    <div className="rounded-[1.5rem] border border-dashed border-border bg-slate-50/80 px-4 py-6 text-sm text-ink-soft">
                      Esta solicitud no registra documentos adjuntos.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {request.attachments.map((attachment) => {
                        const AttachmentIcon = getAttachmentIcon(attachment);

                        return (
                          <div
                            key={attachment.id}
                            className="grid gap-3 rounded-[1.5rem] border border-border bg-slate-50/80 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                {attachment.isImage && attachment.url ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAttachment(attachment)}
                                    className="overflow-hidden rounded-2xl border border-border bg-white"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <Image unoptimized width={400} height={400}
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="size-14 object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600">
                                    <AttachmentIcon className="size-5" />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-ink">{attachment.name}</p>
                                  <p className="mt-1 text-xs text-ink-soft">
                                    {attachment.mimeType ?? attachment.documentType ?? "Archivo"}
                                  </p>
                                  <p className="mt-1 text-xs text-ink-soft">
                                    {formatFileSize(attachment.fileSize)}{" "}
                                    {attachment.createdAt ? `· ${formatDateTime(attachment.createdAt)}` : ""}
                                  </p>
                                  {attachment.uploadedByName ? (
                                    <p className="mt-1 text-xs text-ink-soft">Subido por {attachment.uploadedByName}</p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex flex-wrap justify-end gap-2">
                                {attachment.url ? (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-white px-3 text-sm font-semibold text-brand transition hover:border-brand"
                                  >
                                    <Download className="mr-2 size-4" />
                                    Abrir
                                  </a>
                                ) : null}

                                {canManageDocuments && onDeleteDocument ? (
                                  <Button
                                    variant="ghost"
                                    className="h-10 rounded-2xl px-3 text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                                    onClick={() => onDeleteDocument(request.id, attachment.id)}
                                    disabled={deletingDocumentId === attachment.id}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Eliminar
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {canManageDocuments && onUploadDocuments ? (
                    <div className="grid gap-4 rounded-[1.5rem] border border-dashed border-border bg-white/80 p-4">
                      <div className="flex items-center gap-2">
                        <Plus className="size-4 text-brand" />
                        <div>
                          <p className="text-sm font-semibold text-ink">Agregar mas documentos</p>
                          <p className="text-xs text-ink-soft">
                            PDF, Word, Excel, imagenes y texto. Maximo 10MB por archivo y hasta 5 archivos.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`rounded-[1.5rem] border-2 border-dashed px-5 py-6 text-center transition ${
                          dragActive
                            ? "border-brand bg-brand-soft/50"
                            : "border-border bg-slate-50/70 hover:border-brand/40"
                        }`}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          setDragActive(true);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={(event) => {
                          event.preventDefault();
                          setDragActive(false);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragActive(false);
                          appendFiles(event.dataTransfer.files);
                        }}
                      >
                        <UploadCloud className="mx-auto size-8 text-brand" />
                        <p className="mt-3 text-sm font-semibold text-ink">
                          Arrastra archivos aqui o selecciona desde tu equipo
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          Los archivos se subiran con `multipart/form-data` y quedaran disponibles en el detalle.
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          className="mt-4"
                          onChange={(event) => {
                            appendFiles(event.target.files ?? []);
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>

                      {isUploadingDocuments ? (
                        <div className="overflow-hidden rounded-full bg-slate-100">
                          <div className="size-2/3 animate-[shimmer_1.5s_linear_infinite] bg-gradient-to-r from-brand via-emerald-400 to-brand bg-[length:200%_100%]" />
                        </div>
                      ) : null}

                      {queuedPreviews.length ? (
                        <div className="grid gap-3">
                          {queuedPreviews.map(({ file, previewUrl }) => {
                            const QueuedFileIcon = getQueuedFileIcon(file);

                            return (
                              <div
                                key={`${file.name}-${file.size}`}
                                className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  {previewUrl ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewAttachment({
                                          id: `${file.name}-${file.size}`,
                                          name: file.name,
                                          url: previewUrl,
                                          mimeType: file.type,
                                          fileSize: file.size,
                                          isImage: true,
                                        })
                                      }
                                      className="overflow-hidden rounded-2xl border border-border bg-white"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <Image unoptimized width={400} height={400}
                                        src={previewUrl}
                                        alt={file.name}
                                        className="size-14 object-cover"
                                      />
                                    </button>
                                  ) : (
                                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600">
                                      <QueuedFileIcon className="size-5" />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                                    <p className="text-xs text-ink-soft">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  className="h-10 rounded-2xl px-3 text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() =>
                                    setQueuedFiles((current) =>
                                      current.filter(
                                        (entry) => !(entry.name === file.name && entry.size === file.size),
                                      ),
                                    )
                                  }
                                  disabled={isUploadingDocuments}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Quitar
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setQueuedFiles([])}
                          disabled={!queuedFiles.length || isUploadingDocuments}
                        >
                          Limpiar
                        </Button>
                        <Button
                          onClick={() => {
                            if (!queuedFiles.length) return;

                            void Promise.resolve(onUploadDocuments(request.id, queuedFiles))
                              .then(() => {
                                setQueuedFiles([]);
                              })
                              .catch(() => undefined);
                          }}
                          disabled={!queuedFiles.length || isUploadingDocuments}
                        >
                          Subir documentos
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Card>

                <Card className="grid gap-4 p-5">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-brand" />
                    <h4 className="section-title text-lg font-semibold text-ink">Historial</h4>
                  </div>

                  {!request.reviewHistory.length ? (
                    <div className="rounded-[1.5rem] border border-dashed border-border bg-slate-50/80 px-4 py-6 text-sm text-ink-soft">
                      El backend no devolvio movimientos de revision para esta solicitud.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {request.reviewHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-[1.5rem] border border-border bg-slate-50/80 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                              <UserRound className="size-4 text-brand" />
                              {entry.actorName}
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                              {entry.actionLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-ink-soft">
                            {entry.actorRole ? `${entry.actorRole} · ` : ""}
                            {formatDateTime(entry.createdAt)}
                          </p>
                          {entry.comment ? <p className="mt-3 text-sm leading-6 text-ink">{entry.comment}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {request.metadata ? (
              <Card className="grid gap-4 p-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-brand" />
                  <h4 className="section-title text-lg font-semibold text-ink">Datos adicionales</h4>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(request.metadata).map(([key, value]) => (
                    <DetailRow key={key} label={key} value={value === null ? "Sin dato" : String(value)} />
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </RequestModalShell>

      {previewAttachment?.isImage ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Cerrar vista previa"
            onClick={() => setPreviewAttachment(null)}
          />

          <div className="relative z-10 max-h-[90vh] max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_36px_120px_rgba(15,23,42,0.5)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-sm font-semibold">{previewAttachment.name}</p>
                <p className="text-xs text-slate-300">
                  {previewAttachment.fileSize
                    ? formatFileSize(previewAttachment.fileSize)
                    : previewAttachment.createdAt
                      ? formatDate(previewAttachment.createdAt)
                      : "Vista previa"}
                </p>
              </div>
              <Button
                variant="ghost"
                className="size-10 rounded-2xl px-0 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setPreviewAttachment(null)}
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image unoptimized width={400} height={400}
              src={previewAttachment.url}
              alt={previewAttachment.name}
              className="max-h-[78vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
