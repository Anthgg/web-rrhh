"use client";

import { useQuery } from "@tanstack/react-query";

import { requestsService } from "@/services/requests.service";

export function useRequestTypes() {
  return useQuery({
    queryKey: ["request-types"],
    queryFn: () => requestsService.getTypes(),
    staleTime: 5 * 60_000,
  });
}
