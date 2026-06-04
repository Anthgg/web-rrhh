"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FieldFrame, Input, Select, Textarea } from "@/components/ui/fields";
import { formatFileSize } from "@/lib/utils/format";
import type { CreateRequestPayload, RequestItem, RequestType, UpdateRequestPayload } from "@/types/requests";

import { RequestModalShell } from "@/components/requests/request-modal-shell";

const requestFormSchema = z
  .object({
    requestTypeId: z.string().min(1, "El tipo de solicitud es obligatorio."),
    startDate: z.string().min(1, "La fecha de inicio es obligatoria."),
    endDate: z.string().optional(),
    reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres."),
  })
  .superRefine((values, context) => {
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha fin no puede ser menor que la fecha inicio.",
        path: ["endDate"],
      });
    }
  });

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface RequestFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  request: RequestItem | null;
  requestTypes: RequestType[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRequestPayload | UpdateRequestPayload) => void;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon;
  if (file.type.includes("spreadsheet") || file.name.match(/\.(xlsx|xls)$/i)) return FileSpreadsheet;
  if (file.type.includes("pdf") || file.type.includes("word") || file.name.match(/\.(doc|docx|ppt|pptx|txt)$/i)) {
    return FileText;
  }

  return File;
}

function createFilePreview(file: File) {
  if (!file.type.startsWith("image/")) return null;
  return URL.createObjectURL(file);
}

export function RequestFormModal({
  isOpen,
  mode,
  request,
  requestTypes,
  isSubmitting = false,
  onClose,
  onSubmit,
}: RequestFormModalProps) {
  const [documents, setDocuments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const defaultTypeId = useMemo(
    () => request?.requestTypeId ?? requestTypes[0]?.id ?? "",
    [request?.requestTypeId, requestTypes],
  );

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requestTypeId: defaultTypeId,
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    form.reset({
      requestTypeId: request?.requestTypeId ?? requestTypes[0]?.id ?? "",
      startDate: request?.startDate ?? "",
      endDate: request?.endDate ?? "",
      reason: request?.reason ?? "",
    });
  }, [form, isOpen, request, requestTypes]);

  const selectedTypeId = useWatch({
    control: form.control,
    name: "requestTypeId",
  });
  const selectedType = requestTypes.find((type) => type.id === selectedTypeId);

  const appendFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles).slice(0, 5);

    setDocuments((current) => {
      const merged = [...current, ...nextFiles].slice(0, 5);
      return merged.filter((file, index, array) => array.findIndex((entry) => entry.name === file.name && entry.size === file.size) === index);
    });
  };

  const filePreviews = useMemo(
    () =>
      documents.map((file) => ({
        file,
        preview: createFilePreview(file),
      })),
    [documents],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((entry) => {
        if (entry.preview) {
          URL.revokeObjectURL(entry.preview);
        }
      });
    };
  }, [filePreviews]);

  return (
    <RequestModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Nueva solicitud" : "Editar solicitud"}
      subtitle={
        mode === "create"
          ? "Registra permisos, descansos medicos, vacaciones, justificaciones y otros requerimientos laborales."
          : "Actualiza la solicitud y, si hace falta, agrega nuevos documentos para la correccion."
      }
      size="lg"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cerrar
          </Button>
          <Button
            onClick={form.handleSubmit((values) =>
              onSubmit({
                ...values,
                documents,
              }),
            )}
            disabled={isSubmitting}
          >
            {mode === "create" ? "Crear solicitud" : "Guardar cambios"}
          </Button>
        </div>
      }
    >
      <form className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame
            label="Tipo de solicitud"
            error={form.formState.errors.requestTypeId?.message}
          >
            <Select {...form.register("requestTypeId")}>
              <option value="">Selecciona un tipo</option>
              {requestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </FieldFrame>

          <div className="rounded-[1.5rem] border border-border bg-slate-50/80 px-4 py-3 text-sm text-ink-soft">
            <div className="mb-2 font-semibold text-ink">Tipo seleccionado</div>
            <p>{selectedType?.description ?? "Selecciona un tipo para ver su descripcion operativa."}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldFrame label="Fecha de inicio" error={form.formState.errors.startDate?.message}>
            <Input type="date" {...form.register("startDate")} />
          </FieldFrame>

          <FieldFrame label="Fecha de fin" error={form.formState.errors.endDate?.message}>
            <Input type="date" {...form.register("endDate")} />
          </FieldFrame>
        </div>

        <FieldFrame label="Motivo" error={form.formState.errors.reason?.message}>
          <Textarea
            placeholder="Describe con claridad el motivo de la solicitud."
            {...form.register("reason")}
          />
        </FieldFrame>

        <FieldFrame
          label="Documentos adjuntos"
          hint="PDF, Word, Excel, imagenes. Maximo 10MB por archivo y hasta 5 archivos."
        >
          <div
            className={`rounded-[1.5rem] border-2 border-dashed px-5 py-8 text-center transition ${
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
              El navegador enviara `multipart/form-data` automaticamente cuando haya adjuntos.
            </p>
            <Input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="mt-4"
              onChange={(event) => appendFiles(event.target.files ?? [])}
            />
          </div>
        </FieldFrame>

        {isSubmitting && documents.length ? (
          <div className="overflow-hidden rounded-full bg-slate-100">
            <div className="size-2/3 animate-[shimmer_1.5s_linear_infinite] bg-gradient-to-r from-brand via-emerald-400 to-brand bg-[length:200%_100%]" />
          </div>
        ) : null}

        {filePreviews.length ? (
          <div className="grid gap-3">
            {filePreviews.map(({ file, preview }) => {
              const Icon = getFileIcon(file);

              return (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image unoptimized width={400} height={400}
                        src={preview}
                        alt={file.name}
                        className="size-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Icon className="size-5" />
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

        {mode === "edit" ? (
          <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Si agregas nuevos archivos durante la edicion, se subirán después de guardar los cambios
            de la solicitud.
          </div>
        ) : null}
      </form>
    </RequestModalShell>
  );
}
