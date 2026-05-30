import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { ReportRecord } from "@/types";

export const reportsService = {
  list: () => apiClient<ReportRecord[]>(webApiEndpoints.reports),
};
