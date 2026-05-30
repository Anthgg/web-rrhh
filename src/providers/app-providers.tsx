"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ApiClientError } from "@/lib/api/client";

interface AppProvidersProps {
  children: React.ReactNode;
  hasSessionCandidate: boolean;
}

export function AppProviders({ children, hasSessionCandidate }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry(failureCount, error) {
              if (error instanceof ApiClientError && error.status === 401) {
                return false;
              }

              return failureCount < 1;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider hasSessionCandidate={hasSessionCandidate}>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: "16px",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
