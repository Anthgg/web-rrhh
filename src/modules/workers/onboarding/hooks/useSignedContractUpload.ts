import { useState } from "react";
import { onboardingService } from "../services/onboarding.service";

export function useSignedContractUpload() {
 const [isUploading, setIsUploading] = useState(false);
 const [progress, setProgress] = useState(0);
 const [error, setError] = useState<string | null>(null);
 const [isSuccess, setIsSuccess] = useState(false);

 const uploadSignedContract = async (
 workerId: string,
 file: File,
 contractId: string,
 signedAt: string,
 ) => {
 if (!file) {
 setError("Por favor, selecciona un archivo.");
 return false;
 }

 setIsUploading(true);
 setProgress(0);
 setError(null);
 setIsSuccess(false);

 const interval = setInterval(() => {
 setProgress((prev) => {
 if (prev >= 90) {
 clearInterval(interval);
 return 90;
 }
 return prev + 10;
 });
 }, 150);

 try {
 const formData = new FormData();
 formData.append("file", file);
 formData.append("contract_id", contractId);
 formData.append("signed_at", signedAt);
 await onboardingService.uploadSignedContract(workerId, formData);

 clearInterval(interval);
 setProgress(100);
 setIsSuccess(true);
 return true;
 } catch (err: unknown) {
 clearInterval(interval);
 setError(err instanceof Error ? err.message : "Ocurrio un error al subir el contrato firmado.");
 setProgress(0);
 return false;
 } finally {
 setIsUploading(false);
 }
 };

 return { uploadSignedContract, isUploading, progress, error, isSuccess, setError };
}
