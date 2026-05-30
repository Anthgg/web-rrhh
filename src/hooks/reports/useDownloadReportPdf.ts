import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { downloadReportPdf, type CustomDataPayload } from "@/services/reports/downloadReportPdf";
import { REPORT_CONFIGS, type ReportPdfType } from "@/constants/reportEndpoints";

export interface UseDownloadReportPdfOptions {
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDownloadReportPdf(
  reportType: ReportPdfType,
  options?: UseDownloadReportPdfOptions
) {
  const config = REPORT_CONFIGS[reportType];

  const mutation = useMutation({
    mutationFn: async (params: {
      filename?: string;
      filters?: Record<string, unknown>;
      reportTitle?: string;
      documentType?: string;
      internalLabel?: string;
      customData?: CustomDataPayload;
    }) => {
      const defaultFilename = `${config.filenamePrefix}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const filename = params.filename || defaultFilename;

      if (options?.onStart) {
        options.onStart();
      } else {
        toast.loading("Generando reporte oficial PDF...", { id: "download-pdf-toast" });
      }

      await downloadReportPdf({
        endpoint: config.endpoint,
        filename,
        filters: params.filters,
        reportTitle: params.reportTitle,
        documentType: params.documentType,
        internalLabel: params.internalLabel,
        customData: params.customData,
      });
    },
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      } else {
        toast.success("PDF corporativo generado y descargado con éxito.", { id: "download-pdf-toast" });
      }
    },
    onError: (error: Error) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        toast.error(error.message || "Error al descargar el PDF corporativo.", { id: "download-pdf-toast" });
      }
    },
  });

  return {
    download: (params?: {
      filename?: string;
      filters?: Record<string, unknown>;
      reportTitle?: string;
      documentType?: string;
      internalLabel?: string;
      customData?: CustomDataPayload;
    }) => mutation.mutate(params || {}),
    isDownloading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
