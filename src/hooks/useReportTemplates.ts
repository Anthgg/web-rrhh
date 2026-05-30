import { useQuery } from "@tanstack/react-query";

import { reportTemplatesApi } from "@/services/reportTemplatesApi";

export function useReportTemplates(module?: string) {
  return useQuery({
    queryKey: ["report-templates", module || "all"],
    queryFn: () => reportTemplatesApi.list(module),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
