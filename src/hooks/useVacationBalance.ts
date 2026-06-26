"use client";

import { useQuery } from "@tanstack/react-query";
import { vacationsService } from "@/services/vacations.service";
import { ApiClientError } from "@/lib/api/client";

interface UseVacationBalanceOptions {
  workerId?: string;
  enabled?: boolean;
}

/**
 * Fetches the vacation balance for the current user (or a specific worker).
 * - workerId omitted → GET /api/vacations/me/balance
 * - workerId provided → GET /api/vacations/workers/:id/balance
 *
 * Retries up to 3 times with exponential backoff to handle backend 429 responses.
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
    // Reintentar ante 429 (rate limit) del backend con backoff exponencial.
    // No reintentar ante 401/403 (sesión inválida).
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 6000),
  });
}
