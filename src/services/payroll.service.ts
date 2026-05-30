import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import type { PayrollPeriod } from "@/types";

export const payrollService = {
  periods: () => apiClient<PayrollPeriod[]>(webApiEndpoints.payroll.periods),
};
