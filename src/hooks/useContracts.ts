import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workerContractsService } from "@/services/workerContracts.service";
import { getClientAccessToken } from "@/lib/auth/client-token";
import { isUuid } from "@/lib/api/worker-ids";

export const contractKeys = {
  all: (workerId: string) => ["worker-contracts", workerId] as const,
};

export const isWorkerUuid = isUuid;

// Helper to safely extract error codes from unknown error payloads
function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const details = record.details as Record<string, unknown> | undefined;
    const innerDetails = details?.details as Record<string, unknown> | undefined;
    const code = record.code ?? details?.code ?? innerDetails?.code ?? record.message;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

// Helper to determine if we should retry a query based on error code
const shouldRetry = (failureCount: number, error: unknown) => {
  const code = getErrorCode(error);
  if (
    code === "INVALID_WORKER_ID" ||
    code === "INVALID_USER_ID" ||
    code === "INVALID_CONTRACT_ID"
  ) {
    return false;
  }
  return failureCount < 3;
};

// Helper to map error code to descriptive messages
export function getContractErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  if (code === "INVALID_WORKER_ID" || code === "INVALID_WORKER_UUID") {
    return "El perfil del trabajador está incompleto o el ID no es válido.";
  }
  if (code === "INVALID_USER_ID") {
    return "El identificador de usuario no es válido.";
  }
  if (code === "INVALID_CONTRACT_ID") {
    return "El contrato no tiene un identificador válido.";
  }
  return error instanceof Error ? error.message : "La solicitud no pudo completarse.";
}

// 1. Hook para listar contratos
export const useContracts = (workerId: string) => {
  return useQuery({
    queryKey: contractKeys.all(workerId),
    queryFn: async () => {
      if (!isUuid(workerId)) {
        throw new Error("INVALID_WORKER_ID");
      }
      try {
        return await workerContractsService.list(workerId);
      } catch (error: unknown) {
        const code = getErrorCode(error);
        if (code === "INVALID_WORKER_ID") {
          throw new Error("INVALID_WORKER_ID");
        }
        throw error;
      }
    },
    enabled: isUuid(workerId),
    retry: shouldRetry,
  });
};

// 2. Hook para Generar/Regenerar el PDF
export const useGenerateContractPdf = (workerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      if (!isUuid(workerId)) {
        throw new Error("INVALID_WORKER_ID");
      }
      try {
        return await workerContractsService.generatePdf(workerId, contractId);
      } catch (error: unknown) {
        const code = getErrorCode(error);
        if (code === "INVALID_WORKER_ID") {
          throw new Error("INVALID_WORKER_ID");
        }
        if (code === "INVALID_CONTRACT_ID") {
          throw new Error("INVALID_CONTRACT_ID");
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalida la caché para forzar un refetch de la tabla
      queryClient.invalidateQueries({ queryKey: contractKeys.all(workerId) });
    },
  });
};

// 3. Hook para Descargar el PDF
export const useDownloadContractPdf = () => {
  return useMutation({
    mutationFn: async (contractId: string) => {
      const accessToken = getClientAccessToken();
      const response = await fetch(`/api/contracts/${contractId}/download`, {
        method: "GET",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => null);
        const code = errPayload?.code || errPayload?.details?.code;
        if (code === "INVALID_CONTRACT_ID") {
          throw new Error("INVALID_CONTRACT_ID");
        }
        throw new Error(`Error en la descarga: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "contrato.pdf";

      if (contentDisposition && contentDisposition.includes("filename=")) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    },
  });
};

// 4. Hook para Subir el contrato físico firmado
interface UploadSignedParams {
  contractId: string;
  file: File;
  signedAt?: string;
}

export const useUploadSignedContract = (workerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, file, signedAt }: UploadSignedParams) => {
      if (!isUuid(workerId)) {
        throw new Error("INVALID_WORKER_ID");
      }
      try {
        return await workerContractsService.uploadSigned(workerId, contractId, file, signedAt);
      } catch (error: unknown) {
        const code = getErrorCode(error);
        if (code === "INVALID_WORKER_ID") {
          throw new Error("INVALID_WORKER_ID");
        }
        if (code === "INVALID_CONTRACT_ID") {
          throw new Error("INVALID_CONTRACT_ID");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all(workerId) });
    },
  });
};
