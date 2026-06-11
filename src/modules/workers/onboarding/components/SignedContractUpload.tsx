"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
 UploadCloud,
 FileText,
 CheckCircle2,
 AlertCircle,
 RefreshCw,
 Download,
 ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FieldFrame } from "@/components/ui/fields";
import { useSignedContractUpload } from "../hooks/useSignedContractUpload";
import { onboardingService } from "../services/onboarding.service";
import { withPdfCacheBust } from "@/lib/pdf-url";

interface SignedContractUploadProps {
 workerId: string;
 contractId: string;
 contractPdfUrl?: string;
 onUploadSuccess: () => void;
}

export function SignedContractUpload({
 workerId,
 contractId,
 contractPdfUrl,
 onUploadSuccess,
}: SignedContractUploadProps) {
 const [file, setFile] = useState<File | null>(null);
 const [signedAt, setSignedAt] = useState<string>(new Date().toISOString().split("T")[0]);
 const [observations, setObservations] = useState("");
 const [dragActive, setDragActive] = useState(false);
 const [latestContractUrl, setLatestContractUrl] = useState("");
 const fileInputRef = useRef<HTMLInputElement>(null);
 const queryClient = useQueryClient();

 const { uploadSignedContract, isUploading, progress, error, isSuccess } =
 useSignedContractUpload();

 const {
 data: contractDownload,
 refetch: refetchContractDownload,
 } = useQuery({
 queryKey: ["contract-download", contractId],
 queryFn: () => onboardingService.getContractDownload(contractId),
 enabled: Boolean(contractId),
 retry: false,
 });

 const generateContractMutation = useMutation({
 mutationFn: () => onboardingService.generateContract(workerId, { contract_id: contractId }),
 onSuccess: (response) => {
 const freshUrl =
 response.data?.pdf_url ||
 response.data?.download_url ||
 response.data?.generated_pdf_url ||
 response.fileUrl ||
 "";

 if (freshUrl) {
 setLatestContractUrl(withPdfCacheBust(freshUrl));
 }

 void refetchContractDownload();
 void queryClient.invalidateQueries({ queryKey: ["contract-download", contractId] });
 void queryClient.invalidateQueries({ queryKey: ["onboarding-status", workerId] });
 },
 });

 const generatedContractUrl =
 latestContractUrl ||
 withPdfCacheBust(
 contractDownload?.data.pdf_url ||
 contractDownload?.data.download_url ||
 contractDownload?.data.generated_pdf_url ||
 contractPdfUrl,
 );

 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type === "dragenter" || e.type === "dragover") {
 setDragActive(true);
 } else if (e.type === "dragleave") {
 setDragActive(false);
 }
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 setFile(e.dataTransfer.files[0]);
 }
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 setFile(e.target.files[0]);
 }
 };

 const triggerFileInput = () => {
 fileInputRef.current?.click();
 };

 const handleDropZoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 triggerFileInput();
 }
 };

 const handleUpload = async () => {
 if (!file || !contractId) return;
 const success = await uploadSignedContract(workerId, file, contractId, signedAt);
 if (success) {
 setTimeout(() => {
 onUploadSuccess();
 }, 1000);
 }
 };

 return (
 <div className="space-y-6">
 <div className="bg-muted border border-border rounded-xl p-4 space-y-2">
 <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
 Gestión del Contrato
 </h4>
 <p className="text-xs text-muted-foreground">
 Descarga la plantilla generada, recaba la firma del trabajador y vuelve a subir el archivo
 firmado para archivar en su expediente.
 </p>

 <div className="mt-3 flex flex-wrap items-center gap-3">
 {generatedContractUrl ? (
 <>
 <a
 href={generatedContractUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-semibold hover:underline"
 aria-label="Ver contrato en una nueva pestaña"
 >
 <ExternalLink className="size-4" />
 Ver contrato
 </a>
 <a
 href={generatedContractUrl}
 download
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-semibold hover:underline"
 aria-label="Descargar contrato en PDF"
 >
 <Download className="size-4" />
 Descargar contrato
 </a>
 </>
 ) : null}

 <Button
 type="button"
 variant="secondary"
 disabled={generateContractMutation.isPending || !contractId}
 onClick={() => generateContractMutation.mutate()}
 className="h-8 gap-1.5 px-3 text-xs"
 >
 <RefreshCw
 className={`size-3.5 ${generateContractMutation.isPending ? "animate-spin" : ""}`}
 />
 {generatedContractUrl ? "Regenerar PDF" : "Generar PDF"}
 </Button>
 </div>

 {generateContractMutation.isError ? (
 <p className="mt-2 text-xs font-medium text-rose-600">
 {generateContractMutation.error instanceof Error
 ? generateContractMutation.error.message
 : "No se pudo generar el contrato."}
 </p>
 ) : null}
 </div>

 {isSuccess ? (
 <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-6 text-center space-y-3">
 <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
 <h4 className="text-sm font-semibold text-emerald-950">
 Contrato firmado subido con éxito
 </h4>
 <p className="text-xs text-emerald-800/80 max-w-sm mx-auto">
 El archivo ha sido guardado e indexado en el expediente del trabajador.
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {/* Form fields for file upload metadata */}
 <div className="grid gap-4 md:grid-cols-2">
 <FieldFrame label="Fecha de Firma del Contrato">
 <Input
 id="signed-at-date"
 type="date"
 value={signedAt}
 onChange={(e) => setSignedAt(e.target.value)}
 />
 </FieldFrame>

 <FieldFrame label="Anotación / Observación de Subida">
 <Input
 id="upload-observation"
 placeholder="Ej. Contrato firmado físicamente en oficina central."
 value={observations}
 onChange={(e) => setObservations(e.target.value)}
 />
 </FieldFrame>
 </div>

 {/* Drag & Drop zone — accesible con teclado */}
 <div
 role="button"
 tabIndex={0}
 aria-label="Zona de carga. Haz clic o arrastra el contrato firmado en formato PDF o imagen."
 onDragEnter={handleDrag}
 onDragOver={handleDrag}
 onDragLeave={handleDrag}
 onDrop={handleDrop}
 onKeyDown={handleDropZoneKeyDown}
 className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[200px] ${
 dragActive
 ? "border-indigo-600 bg-indigo-50/20"
 : "border-border hover:border-slate-300 bg-muted/20"
 }`}
 onClick={triggerFileInput}
 >
 <input
 ref={fileInputRef}
 id="signed-contract-file-input"
 type="file"
 accept=".pdf,image/*"
 className="hidden"
 aria-label="Seleccionar archivo de contrato firmado"
 onChange={handleFileChange}
 />

 {file ? (
 <div className="space-y-2">
 <FileText className="size-12 text-indigo-500 mx-auto" />
 <span className="font-semibold text-foreground text-sm block max-w-xs truncate">
 {file.name}
 </span>
 <span className="text-xs text-muted-foreground block">
 {(file.size / (1024 * 1024)).toFixed(2)} MB
 </span>
 <button
 type="button"
 aria-label="Eliminar archivo seleccionado"
 onClick={(e) => {
 e.stopPropagation();
 setFile(null);
 }}
 className="text-xs text-rose-600 font-semibold hover:underline"
 >
 Remover archivo
 </button>
 </div>
 ) : (
 <div className="space-y-2">
 <UploadCloud className="size-12 text-muted-foreground mx-auto" />
 <span className="font-semibold text-foreground text-sm block">
 Arrastra el contrato firmado aquí
 </span>
 <span className="text-xs text-muted-foreground block">
 Soporta formatos PDF e imágenes (PNG, JPG) hasta 10MB.
 </span>
 <span className="text-xs text-indigo-700 font-semibold hover:underline mt-2 inline-block">
 o busca un archivo en tu ordenador
 </span>
 </div>
 )}
 </div>

 {/* Upload Progress Bar */}
 {isUploading && (
 <div className="space-y-2" role="status" aria-live="polite">
 <div className="flex justify-between text-xs text-muted-foreground">
 <span>Subiendo contrato...</span>
 <span>{progress}%</span>
 </div>
 <div
 className="w-full bg-muted rounded-full h-2 overflow-hidden"
 role="progressbar"
 aria-valuenow={progress}
 aria-valuemin={0}
 aria-valuemax={100}
 aria-label="Progreso de carga del contrato"
 >
 <div
 className="bg-indigo-600 h-full transition-all duration-300"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 )}

 {error && (
 <div
 role="alert"
 className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100"
 >
 <AlertCircle className="size-4 flex-shrink-0" />
 <span>{error}</span>
 </div>
 )}

 <div className="flex justify-end gap-3">
 <Button
 type="button"
 disabled={isUploading || !file}
 onClick={handleUpload}
 className="rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-muted-foreground px-6 py-2 h-11"
 >
 {isUploading ? (
 <>
 <RefreshCw className="mr-2 size-4 animate-spin" />
 Subiendo...
 </>
 ) : (
 "Subir Contrato Firmado"
 )}
 </Button>
 </div>
 </div>
 )}
 </div>
 );
}
