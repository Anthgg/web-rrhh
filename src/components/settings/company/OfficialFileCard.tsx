"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef } from "react";
import {
 CheckCircle2,
 CircleDashed,
 FileImage,
 LoaderCircle,
 Trash2,
 UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
 COMPANY_ASSET_ACCEPT,
 validateCompanyAssetFile,
} from "@/services/companySettingsService";
import { cn } from "@/lib/utils/cn";
import type { CompanyAssetType } from "@/types";
import type { OfficialFilePhase } from "@/hooks/useOfficialFileUpload";

interface OfficialFileCardProps {
 assetType: CompanyAssetType;
 currentUrl?: string | null;
 description: string;
 disabled?: boolean;
 disabledMessage?: string;
 phase: OfficialFilePhase;
 title: string;
 onDelete: (assetType: CompanyAssetType) => Promise<boolean>;
 onUpload: (assetType: CompanyAssetType, file: File) => Promise<boolean>;
}

interface OfficialFileCardState {
 dragActive: boolean;
 localPreviewUrl: string | null;
 localFileName: string | null;
 localError: string | null;
 isDeleteConfirmOpen: boolean;
}

const initialOfficialFileCardState: OfficialFileCardState = {
 dragActive: false,
 localPreviewUrl: null,
 localFileName: null,
 localError: null,
 isDeleteConfirmOpen: false,
};

function getFileNameFromUrl(url?: string | null) {
 if (!url) return "Sin archivo cargado";

 try {
 const parsed = new URL(url, "https://local.invalid");
 const segment = parsed.pathname.split("/").filter(Boolean).at(-1);
 return segment ? decodeURIComponent(segment) : "Archivo cargado";
 } catch {
 const segment = url.split("/").filter(Boolean).at(-1);
 return segment ? decodeURIComponent(segment) : "Archivo cargado";
 }
}

export function OfficialFileCard({
 assetType,
 currentUrl,
 description,
 disabled = false,
 disabledMessage,
 phase,
 title,
 onDelete,
 onUpload,
}: OfficialFileCardProps) {
 const inputRef = useRef<HTMLInputElement>(null);
 const [state, setState] = useReducer(
 (current: OfficialFileCardState, values: Partial<OfficialFileCardState>) => ({ ...current, ...values }),
 initialOfficialFileCardState,
 );
 const { dragActive, localPreviewUrl, localFileName, localError, isDeleteConfirmOpen } = state;

 const isProcessing = phase !== "idle";
 const isUnavailable = disabled || isProcessing;
 const previewUrl = localPreviewUrl || currentUrl || null;
 const fileName = localFileName ?? getFileNameFromUrl(currentUrl);
 const hasFile = Boolean(previewUrl);

 useEffect(() => {
 return () => {
 if (localPreviewUrl) {
 URL.revokeObjectURL(localPreviewUrl);
 }
 };
 }, [localPreviewUrl]);

 async function handleFileSelection(file: File | null) {
 if (!file || isUnavailable) return;

 const validationError = validateCompanyAssetFile(file);
 if (validationError) {
 setState({ localError: validationError });
 toast.error(validationError);
 return;
 }

 setState({ localError: null });

 const nextObjectUrl = URL.createObjectURL(file);
 setState({ localPreviewUrl: nextObjectUrl, localFileName: file.name });

 await onUpload(assetType, file);
 setState({ localPreviewUrl: null, localFileName: null });
 }

 async function handleDelete() {
 if (!hasFile || isUnavailable) return;

 const success = await onDelete(assetType);
 if (!success) return;

 setState({ localPreviewUrl: null, localFileName: null, isDeleteConfirmOpen: false });
 }

 return (
 <>
 <article
 aria-busy={isProcessing}
 className={cn(
 "relative grid gap-4 rounded-lg border bg-card p-4 shadow-sm transition duration-200",
 dragActive && !isUnavailable ? "border-primary ring-2 ring-primary/10" : "border-border",
 disabled && "bg-muted",
 )}
 >
 {isProcessing ? (
 <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-card/75 backdrop-blur-sm">
 <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
 <LoaderCircle className="size-4 animate-spin text-primary" />
 {phase === "deleting" ? "Eliminando archivo..." : "Subiendo archivo..."}
 </div>
 </div>
 ) : null}

 <div className="grid gap-3">
 <div className="flex items-start justify-between gap-3">
 <div className="grid gap-1">
 <h3 className="text-base font-semibold text-foreground">{title}</h3>
 <p className="text-sm leading-5 text-foreground-soft">{description}</p>
 </div>

 <span
 className={cn(
 "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
 hasFile ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
 )}
 >
 {hasFile ? <CheckCircle2 className="size-3.5" /> : <CircleDashed className="size-3.5" />}
 {hasFile ? "Cargado" : "Pendiente"}
 </span>
 </div>

 <button
 type="button"
 title={disabled ? disabledMessage : undefined}
 className={cn(
 "grid min-h-[196px] place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-muted p-4 text-center transition",
 !isUnavailable && "cursor-pointer hover:border-primary hover:bg-primary/5",
 disabled && "cursor-not-allowed",
 dragActive && !isUnavailable && "border-primary bg-primary/5",
 )}
 disabled={isUnavailable}
 onClick={() => {
 if (!isUnavailable) inputRef.current?.click();
 }}
 onDragEnter={(event) => {
 event.preventDefault();
 if (!isUnavailable) setState({ dragActive: true });
 }}
 onDragOver={(event) => {
 event.preventDefault();
 if (!isUnavailable) setState({ dragActive: true });
 }}
 onDragLeave={(event) => {
 event.preventDefault();
 setState({ dragActive: false });
 }}
 onDrop={(event) => {
 event.preventDefault();
 setState({ dragActive: false });

 if (!isUnavailable) {
 void handleFileSelection(event.dataTransfer.files.item(0));
 }
 }}
 >
 {previewUrl ? (
 <div className="grid w-full gap-3">
 <div className="flex min-h-[128px] items-center justify-center rounded-lg bg-card p-3">
 <Image unoptimized width={400} height={400} src={previewUrl} alt={title} className="max-h-[124px] max-w-full object-contain" />
 </div>
 <div className="grid gap-1">
 <p className="truncate text-sm font-semibold text-foreground">{fileName}</p>
 <p className="text-xs leading-5 text-foreground-soft">
 Arrastra una nueva imagen o usa reemplazar archivo.
 </p>
 </div>
 </div>
 ) : (
 <div className="grid gap-3">
 <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm">
 <FileImage className="size-6" />
 </div>
 <div className="grid gap-1">
 <p className="text-sm font-semibold text-foreground">
 {disabled ? "Configuracion requerida" : "Arrastra el archivo aqui"}
 </p>
 <p className="max-w-xs text-sm leading-5 text-foreground-soft">
 {disabled && disabledMessage ? disabledMessage : "Tambien puedes seleccionarlo desde tu equipo."}
 </p>
 </div>
 </div>
 )}
 </button>

 <div className="grid gap-2 rounded-lg border border-border bg-muted p-3 text-xs text-foreground-soft">
 <div className="flex items-center justify-between gap-3">
 <span>Formatos</span>
 <span className="font-medium text-foreground">JPG, JPEG, PNG, WEBP, SVG</span>
 </div>
 <div className="flex items-center justify-between gap-3">
 <span>Peso maximo</span>
 <span className="font-medium text-foreground">3 MB</span>
 </div>
 <div className="flex items-center justify-between gap-3">
 <span>Archivo actual</span>
 <span className="max-w-[160px] truncate text-right font-medium text-foreground">{fileName}</span>
 </div>
 </div>

 {localError ? (
 <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
 {localError}
 </p>
 ) : null}
 </div>

 <div className="flex flex-col gap-2 sm:flex-row">
 <Button
 variant={hasFile ? "secondary" : "primary"}
 className="flex-1 rounded-lg"
 onClick={() => inputRef.current?.click()}
 disabled={isUnavailable}
 >
 {phase === "uploading" ? (
 <LoaderCircle className="mr-2 size-4 animate-spin" />
 ) : (
 <UploadCloud className="mr-2 size-4" />
 )}
 {hasFile ? "Reemplazar archivo" : "Subir archivo"}
 </Button>

 {hasFile ? (
 <Button
 variant="danger"
 className="rounded-lg"
 onClick={() => setState({ isDeleteConfirmOpen: true })}
 disabled={isUnavailable}
 >
 <Trash2 className="mr-2 size-4" />
 Eliminar
 </Button>
 ) : null}
 </div>

 <input
 ref={inputRef}
 type="file"
 hidden
 accept={COMPANY_ASSET_ACCEPT}
 aria-label={`Subir ${title}`}
 onChange={(event) => {
 void handleFileSelection(event.target.files?.item(0) ?? null);
 event.target.value = "";
 }}
 />
 </article>
 <ConfirmDialog
 open={isDeleteConfirmOpen}
 title={`Eliminar ${title.toLowerCase()}`}
 description={`Se eliminara ${title.toLowerCase()} de la configuracion corporativa. Deseas continuar?`}
 confirmLabel="Eliminar"
 variant="danger"
 isLoading={isProcessing}
 onCancel={() => setState({ isDeleteConfirmOpen: false })}
 onConfirm={handleDelete}
 />
 </>
 );
}
