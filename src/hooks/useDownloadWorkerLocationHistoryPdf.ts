import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
 handleDownloadWorkerLocationHistoryPdf,
 extractBlobErrorCode,
 WORKER_LOCATION_HISTORY_PDF_ERROR_MESSAGES,
} from "@/services/reports.service";

export function useDownloadWorkerLocationHistoryPdf() {
 return useMutation({
 mutationFn: handleDownloadWorkerLocationHistoryPdf,
 onSuccess: () => {
 toast.success("Historial exportado correctamente.");
 },
 onError: async (error: any) => {
 const code = await extractBlobErrorCode(error);
 const message =
 WORKER_LOCATION_HISTORY_PDF_ERROR_MESSAGES[code || ""] ??
 "No se pudo descargar el historial de movimientos.";
 toast.error(message);
 },
 });
}
