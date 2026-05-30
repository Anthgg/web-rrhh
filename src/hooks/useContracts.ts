import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workerContractsService } from "@/services/workerContracts.service";
import { getClientAccessToken } from "@/lib/auth/client-token";

export const contractKeys = {
  all: (workerId: string) => ["worker-contracts", workerId] as const,
};

// 1. Hook para listar contratos
export const useContracts = (workerId: string) => {
  return useQuery({
    queryKey: contractKeys.all(workerId),
    queryFn: () => workerContractsService.list(workerId),
    enabled: Boolean(workerId),
  });
};

// 2. Hook para Generar/Regenerar el PDF
export const useGenerateContractPdf = (workerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) => workerContractsService.generatePdf(workerId, contractId),
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
    mutationFn: ({ contractId, file, signedAt }: UploadSignedParams) =>
      workerContractsService.uploadSigned(workerId, contractId, file, signedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all(workerId) });
    },
  });
};
