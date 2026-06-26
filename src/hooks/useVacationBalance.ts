"use client";

import { useQuery } from "@tanstack/react-query";
import { vacationsService } from "@/services/vacations.service";

interface UseVacationBalanceOptions {
  workerId?: string;
  enabled?: boolean;
}

/**
 * Fetches the vacation balance for the current user (or a specific worker).
 * - workerId omitted → GET /api/vacations/me/balance
 * - workerId provided → GET /api/vacations/workers/:id/balance
 */
export function useVacationBalance({ workerId, enabled = true }: UseVacationBalanceOptions = {}) {
  return useQuery({
    queryKey: ["vacation-balance", workerId ?? "me"],
    queryFn: () =>
      workerId
        ? vacationsService.getWorkerBalance(workerId)
        : vacationsService.getMyBalance(),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
