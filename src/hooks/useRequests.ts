"use client";

import { useDeferredValue, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { requestsService } from "@/services/requests.service";
import type { RequestListFilters, RequestScope } from "@/types/requests";

interface UseRequestsOptions {
  scope: RequestScope;
  filters: RequestListFilters;
  statsScope?: RequestScope;
  statsFilters?: RequestListFilters;
  enabled?: boolean;
  includeStats?: boolean;
}

export function useRequests({
  scope,
  filters,
  statsScope,
  statsFilters,
  enabled = true,
  includeStats = true,
}: UseRequestsOptions) {
  const deferredSearch = useDeferredValue(filters.search ?? "");

  const normalizedFilters = useMemo<RequestListFilters>(
    () => ({
      ...filters,
      search: deferredSearch,
    }),
    [deferredSearch, filters],
  );

  const listQuery = useQuery({
    queryKey: ["requests", scope, normalizedFilters],
    queryFn: () => requestsService.list(scope, normalizedFilters),
    enabled,
  });

  const summaryFilters = useMemo<RequestListFilters>(
    () => ({
      ...(statsFilters ?? normalizedFilters),
      page: 1,
      pageSize: 1,
    }),
    [normalizedFilters, statsFilters],
  );

  const statsQuery = useQuery({
    queryKey: ["request-stats", statsScope ?? scope, summaryFilters],
    queryFn: () => requestsService.getStats(statsScope ?? scope, summaryFilters),
    enabled: enabled && includeStats,
    staleTime: 60_000,
  });

  return {
    listQuery,
    statsQuery,
    filters: normalizedFilters,
  };
}
