"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Info,
  Trash2,
  UploadCloud,
  AlertTriangle,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select, Textarea } from "@/components/ui/fields";
import { formatFileSize } from "@/lib/utils/format";
import type { RequestType } from "@/types/requests";
import { VacationBalanceCard } from "@/components/attendance/VacationBalanceCard";
import { useVacationBalance } from "@/hooks/useVacationBalance";

export interface NewRequestFormPayload {
  requestTypeId: string;
  startDate: string;
  endDate?: string;
  reason: string;
  additionalComment?: string;
  documents: File[];
}

export interface NewRequestFormInitialData {
  requestTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  additionalComment?: string | null;
}

interface NewRequestFormProps {
  requestTypes: RequestType[];
  initialRequest?: NewRequestFormInitialData | null;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (payload: NewRequestFormPayload) => Promise<unknown> | void;
}

function getInitialValues(initialRequest: NewRequestFormInitialData | null | undefined, requestTypes: RequestType[]) {
  return {
    requestTypeId: initialRequest?.requestTypeId ?? requestTypes[0]?.id ?? "",
    startDate: initialRequest?.startDate ?? "",
    endDate: initialRequest?.endDate ?? "",
    reason: initialRequest?.reason ?? "",
    additionalComment: initialRequest?.additionalComment ?? "",
  };
}

function getFileIcon(file: File) {
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

function createImagePreview(file: File) {
  if (!file.type.startsWith("image/")) return null;
  return URL.createObjectURL(file);
}

export function NewRequestForm({
  requestTypes,
  initialRequest,
  isSubmitting = false,
  submitError,
  onSubmit,
}: NewRequestFormProps) {
  const initialValues = useMemo(
    () => getInitialValues(initialRequest, requestTypes),
    [initialRequest, requestTypes],
  );
  const [requestTypeId, setRequestTypeId] = useState(initialValues.requestTypeId);
  const [startDate, setStartDate] = useState(initialValues.startDate);
  const [endDate, setEndDate] = useState(initialValues.endDate);
  const [reason, setReason] = useState(initialValues.reason);
  const [additionalComment, setAdditionalComment] = useState(initialValues.additionalComment);
  const [documents, setDocuments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const filePreviews = useMemo(
    () =>
      documents.map((file) => ({
        file,
        previewUrl: createImagePreview(file),
      })),
    [documents],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      });
    };
  }, [filePreviews]);

  const selectedType = requestTypes.find((item) => item.id === requestTypeId);

  /**
   * Use type/code from the catalog ONLY for UI decisions (labels, validation, showing
   * VacationBalanceCard). The form always sends requestTypeId — never `type` alongside it.
   */
  const selectedLeaveType = selectedType?.type;
  const isVacationSelected = selectedLeaveType === "VACATION";
  const isLeaveType =
    selectedLeaveType === "VACATION" ||
    selectedLeaveType === "MEDICAL_LEAVE" ||
    selectedLeaveType === "UNPAID_LEAVE";

  // End date is required for all leave types unless the type explicitly says otherwise
  const endDateRequired = selectedType?.requiresEndDate ?? isLeaveType;
  const endDateError = endDate && startDate && endDate < startDate;
  const formInvalid =
    !requestTypeId ||
    !startDate ||
    reason.trim().length < 8 ||
    Boolean(endDateError) ||
    (endDateRequired && !endDate);

  // Fetch vacation balance only when VACATION type is selected
  const vacationBalance = useVacationBalance({ enabled: isVacationSelected });

  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      return differenceInCalendarDays(end, start) + 1;
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  const appendFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles).slice(0, 5);
    setDocuments((current) =>
      [...current, ...nextFiles]
        .filter(
          (file, index, array) =>
            array.findIndex((entry) => entry.name === file.name && entry.size === file.size) === index,
        )
        .slice(0, 5),
    );
  };

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="grid gap-6 p-6">
        <div className="grid gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <CalendarDays className="size-3.5" />
            {initialRequest ? "Edicion de solicitud" : "Registro de solicitud"}
          </div>
          <h2 className="section-title text-2xl font-semibold text-foreground">
            {initialRequest ? "Actualizar solicitud" : "Nueva solicitud"}
          </h2>
          <p className="text-sm leading-6 text-foreground-soft">
            Completa el formulario con fechas, motivo y adjuntos para enviarlo al flujo real de
            solicitudes.
          </p>
        </div>

        {submitError ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {submitError}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <FieldFrame
            label="Tipo de solicitud"
            error={showErrors && !requestTypeId ? "Selecciona un tipo de solicitud." : undefined}
          >
            <Select value={requestTypeId} onChange={(event) => setRequestTypeId(event.target.value)}>
              <option value="">Selecciona un tipo</option>
              {requestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <div className="rounded-[1.5rem] border border-border bg-muted/80 p-4 text-sm text-foreground-soft">
            <p className="font-semibold text-foreground">Tipo seleccionado</p>
            <p className="mt-2 leading-6">
              {selectedType?.description ?? "Selecciona un tipo para mostrar el contexto operativo del tramite."}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FieldFrame
            label="Fecha de inicio"
            error={showErrors && !startDate ? "La fecha de inicio es obligatoria." : undefined}
          >
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </FieldFrame>

          <FieldFrame
            label={`Fecha de fin${endDateRequired ? " *" : ""}`}
            error={
              endDateError
                ? "La fecha fin no puede ser menor que la fecha inicio."
                : showErrors && endDateRequired && !endDate
                ? "La fecha de fin es obligatoria para este tipo de solicitud."
                : undefined
            }
            hint={
              endDateRequired
                ? "Requerida para vacaciones, descanso médico y permisos."
                : "Déjalo vacío si no aplica para este tipo de solicitud."
            }
          >
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </FieldFrame>
        </div>

        {/* Vacation balance card — shown only when VACATION type is selected, UI decision only */}
        {isVacationSelected && (
          <div className="space-y-3">
            <VacationBalanceCard
              balance={vacationBalance.data}
              isLoading={vacationBalance.isLoading}
              isError={vacationBalance.isError}
              compact
            />
            {vacationBalance.data && requestedDays > 0 && requestedDays > vacationBalance.data.availableDays && (
              <div className="flex items-start gap-3 rounded-[1.5rem] border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold">Solicitud excede saldo disponible</p>
                  <p className="mt-1 leading-normal">
                    Solicitas {requestedDays} días y tienes {parseFloat(vacationBalance.data.availableDays.toFixed(2))} disponibles. Si RRHH aprueba la solicitud, quedarás con {parseFloat((requestedDays - vacationBalance.data.availableDays).toFixed(2))} días adelantados.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <FieldFrame
          label="Motivo"
          error={
            showErrors && reason.trim().length < 8
              ? "Describe el motivo con al menos 8 caracteres."
              : undefined
          }
        >
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe con claridad por que necesitas registrar esta solicitud."
          />
        </FieldFrame>

        <FieldFrame
          label="Comentario adicional"
          hint="Se conserva en la interfaz para equipos que ya soportan notas complementarias del trabajador."
        >
          <Textarea
            value={additionalComment}
            onChange={(event) => setAdditionalComment(event.target.value)}
            placeholder="Agrega contexto adicional, coordinaciones o indicaciones para el area revisora."
            className="min-h-24"
          />
        </FieldFrame>

        <FieldFrame
          label="Archivo opcional"
          hint="PDF, Word, Excel, imagenes y texto. Maximo 10MB por archivo y hasta 5 elementos."
        >
          <div
            className={`rounded-[1.75rem] border-2 border-dashed px-5 py-8 text-center transition ${
              dragActive
                ? "border-primary bg-primary-soft/50"
                : "border-border bg-muted/70 hover:border-primary/40"
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
            <UploadCloud className="mx-auto size-8 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Arrastra tus archivos o selecciona desde tu equipo
            </p>
            <p className="mt-1 text-xs text-foreground-soft">
              Si agregas adjuntos, el envio se realiza como `multipart/form-data`.
            </p>
            <Input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="mt-4"
              disabled={isSubmitting}
              onChange={(event) => {
                appendFiles(event.target.files ?? []);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </FieldFrame>

        {filePreviews.length ? (
          <div className="grid gap-3">
            {filePreviews.map(({ file, previewUrl }) => {
              const Icon = getFileIcon(file);
              return (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {previewUrl ? (
                      <Image unoptimized width={400} height={400} src={previewUrl} alt={file.name} className="size-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Icon className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-foreground-soft">{formatFileSize(file.size)}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="h-10 rounded-2xl px-3 text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() =>
                      setDocuments((current) =>
                        current.filter((entry) => !(entry.name === file.name && entry.size === file.size)),
                      )
                    }
                  >
                    <Trash2 className="mr-2 size-4" />
                    Quitar
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              const resetValues = getInitialValues(initialRequest, requestTypes);
              setRequestTypeId(resetValues.requestTypeId);
              setStartDate(resetValues.startDate);
              setEndDate(resetValues.endDate);
              setReason(resetValues.reason);
              setAdditionalComment(resetValues.additionalComment);
              setDocuments([]);
              setShowErrors(false);
            }}
          >
            Limpiar
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => {
              if (formInvalid) {
                setShowErrors(true);
                return;
              }
              void Promise.resolve(
                onSubmit({
                  requestTypeId,
                  startDate,
                  endDate: endDate || undefined,
                  reason: reason.trim(),
                  additionalComment: additionalComment.trim() || undefined,
                  documents,
                }),
              ).then(() => {
                setDocuments([]);
                setShowErrors(false);
              });
            }}
          >
            {isSubmitting
              ? initialRequest
                ? "Guardando..."
                : "Enviando..."
              : initialRequest
              ? "Guardar cambios"
              : "Enviar solicitud"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="grid gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Info className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Preparado para backend</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-soft">
                El formulario separa texto, fechas y adjuntos para enviar JSON o `multipart/form-data`
                segun corresponda, sin duplicar vistas.
              </p>
            </div>
          </div>
        </Card>

        <Card className="grid gap-4 p-5">
          <h3 className="text-lg font-semibold text-foreground">Campos incluidos</h3>
          <div className="grid gap-2">
            {[
              "Tipo de solicitud",
              "Fecha de inicio y fecha de fin",
              "Motivo del tramite",
              "Comentario adicional del trabajador",
              "Carga de archivo opcional",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-border bg-muted/80 px-4 py-3 text-sm text-foreground-soft"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="grid gap-4 p-5">
          <h3 className="text-lg font-semibold text-foreground">Notas de UX</h3>
          <div className="grid gap-3 text-sm leading-6 text-foreground-soft">
            <p>
              La zona de adjuntos responde a arrastre y seleccion manual para que el flujo sea claro
              tanto en escritorio como en movil.
            </p>
            <p>
              El modo de edicion reutiliza el mismo componente y deja visible la diferencia entre
              crear y actualizar una solicitud.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
