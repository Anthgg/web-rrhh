import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "@/services/reportsApi";
import type { ReportPreviewRequest } from "@/types/report.types";

export function useReportPreview(payload: ReportPreviewRequest | null) {
  return useQuery({
    queryKey: ["report-preview", payload],
    queryFn: () => reportsApi.getPreview(payload as ReportPreviewRequest),
    enabled: Boolean(payload),
    refetchOnWindowFocus: false,
  });
}
