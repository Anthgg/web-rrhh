"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  FileImage,
  LoaderCircle,
  Lock,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import {
  COMPANY_ASSET_ACCEPT,
  validateCompanyAssetFile,
} from "@/services/companySettingsService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface CompanyAssetUploaderProps {
  currentUrl?: string | null;
  description: string;
  disabled?: boolean;
  disabledMessage?: string;
  emptyLabel: string;
  isUploading?: boolean;
  title: string;
  onDelete: () => Promise<boolean>;
  onUpload: (file: File) => Promise<boolean>;
}

export function CompanyAssetUploader({
  currentUrl,
  description,
  disabled = false,
  disabledMessage,
  emptyLabel,
  isUploading = false,
  title,
  onDelete,
  onUpload,
}: CompanyAssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const isUnavailable = disabled || isUploading;
  const previewUrl = localPreviewUrl || currentUrl || null;

  useEffect(() => {
    if (currentUrl && objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setLocalPreviewUrl(null);
    }
  }, [currentUrl]);

  useEffect(() => {
    const urlToRevoke = objectUrlRef.current;
    return () => {
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, []);

  async function handleFileSelection(file: File | null) {
    if (!file || isUnavailable) {
      return;
    }

    const validationError = validateCompanyAssetFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const nextObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextObjectUrl;
    setLocalPreviewUrl(nextObjectUrl);
    setSelectedFileName(file.name);

    const success = await onUpload(file);
    if (!success) {
      URL.revokeObjectURL(nextObjectUrl);
      objectUrlRef.current = null;
      setLocalPreviewUrl(null);
      setSelectedFileName(null);
    }
  }

  async function handleDelete() {
    const shouldDelete = window.confirm(
      `Se eliminara ${title.toLowerCase()} de la configuracion corporativa. Deseas continuar?`,
    );

    if (!shouldDelete) {
      return;
    }

    const success = await onDelete();

    if (!success) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setLocalPreviewUrl(null);
    setSelectedFileName(null);
  }

  return (
    <div
      aria-busy={isUploading}
      className={cn(
        "group relative grid gap-4 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.82),rgba(255,255,255,0.96))] p-4 shadow-[0_16px_30px_rgba(15,23,42,0.04)] transition",
        dragActive && !isUnavailable && "border-brand bg-brand/5",
        disabled && "opacity-80",
      )}
    >
      {isUploading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.75rem] bg-white/70 backdrop-blur-sm">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <LoaderCircle className="size-4 animate-spin text-brand" />
            Procesando archivo...
          </div>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="section-title text-lg font-semibold text-ink">{title}</h3>
          <p className="text-sm leading-6 text-ink-soft">{description}</p>
        </div>

        {disabled && disabledMessage ? (
          <div className="relative">
            <div
              className="flex size-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700"
              aria-label={disabledMessage}
            >
              <CircleAlert className="size-4" />
            </div>
            <div className="pointer-events-none absolute right-0 top-11 z-10 w-56 rounded-2xl border border-slate-200 bg-slate-950 px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-[0_16px_32px_rgba(15,23,42,0.24)] transition group-hover:opacity-100 group-focus-within:opacity-100">
              {disabledMessage}
            </div>
          </div>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={isUnavailable ? -1 : 0}
        className={cn(
          "grid min-h-[220px] place-items-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-white/85 p-4 text-center transition",
          !isUnavailable && "cursor-pointer hover:border-brand hover:bg-brand/5",
          disabled && "cursor-not-allowed",
        )}
        title={disabled && disabledMessage ? disabledMessage : undefined}
        onClick={() => {
          if (!isUnavailable) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (isUnavailable) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isUnavailable) {
            setDragActive(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isUnavailable) {
            setDragActive(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);

          if (isUnavailable) {
            return;
          }

          void handleFileSelection(event.dataTransfer.files.item(0));
        }}
      >
        {previewUrl ? (
          <div className="grid h-full w-full gap-4">
            <div className="relative flex min-h-[150px] items-center justify-center overflow-hidden rounded-[1.25rem] bg-slate-50">
              <Button
                variant="danger"
                className="absolute right-3 top-3 z-10 size-9 rounded-full p-0 shadow-[0_10px_20px_rgba(225,29,72,0.28)]"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDelete();
                }}
                disabled={isUnavailable}
                aria-label={`Eliminar ${title}`}
              >
                <Trash2 className="size-4" />
              </Button>
              <Image unoptimized width={400} height={400}
                src={previewUrl}
                alt={title}
                className="max-h-[180px] max-w-full object-contain"
              />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-semibold text-ink">
                {selectedFileName ?? "Vista previa disponible"}
              </p>
              <p className="text-xs text-ink-soft">
                Arrastra otra imagen o haz clic para reemplazar el archivo actual.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              {disabled ? <Lock className="size-6" /> : <FileImage className="size-6" />}
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-ink">{emptyLabel}</p>
              <p className="max-w-xs text-sm leading-6 text-ink-soft">
                {disabled && disabledMessage
                  ? disabledMessage
                  : "Arrastra una imagen aqui o selecciona un archivo desde tu equipo."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-ink-soft">
          JPG, JPEG, PNG, WEBP o SVG. Maximo 3 MB.
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={isUnavailable}
          >
            {isUploading ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 size-4" />
            )}
            Seleccionar archivo
          </Button>

          {previewUrl ? (
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              disabled={isUnavailable}
            >
              <Trash2 className="mr-2 size-4" />
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={COMPANY_ASSET_ACCEPT}
        onChange={(event) => {
          void handleFileSelection(event.target.files?.item(0) ?? null);
          event.target.value = "";
        }}
      />
    </div>
  );
}
