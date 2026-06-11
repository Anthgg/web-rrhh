import { useState } from "react";

import type { ReportFilters } from "@/types/report.types";

const initialReportFilters: ReportFilters = {
 dateFrom: null,
 dateTo: null,
 status: null,
 requestType: null,
 areaId: null,
 workerId: null,
};

export function useReportFilters(defaultValue?: ReportFilters) {
 const [filters, setFilters] = useState<ReportFilters>({
 ...initialReportFilters,
 ...defaultValue,
 });

 return {
 filters,
 setFilters,
 resetFilters: () =>
 setFilters({
 ...initialReportFilters,
 ...defaultValue,
 }),
 };
}
