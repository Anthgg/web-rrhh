import { apiClient } from "@/lib/api/client";

export interface WorkerContractRecord {
  id?: string;
  contract_id?: string;
  contractId?: string;
  contract_type?: string;
  contractType?: string;
  type?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  start_date?: string;
  startDate?: string;
  generated_pdf_url?: string | null;
  generatedPdfUrl?: string | null;
  pdf_url?: string | null;
  pdfUrl?: string | null;
  file_name?: string | null;
  fileName?: string | null;
  signed_file_url?: string | null;
  signedFileUrl?: string | null;
  download_url?: string | null;
  downloadUrl?: string | null;
}

interface ContractListEnvelope {
  success?: boolean;
  data?: WorkerContractRecord[];
}

export interface ContractGenerateResponse {
  success: boolean;
  data?: {
    contract_id?: string;
    worker_id?: string;
    pdf_url?: string | null;
    file_name?: string | null;
    file_path?: string | null;
    generated_pdf_url?: string | null;
    signed_file_url?: string | null;
    download_url?: string | null;
  };
}

export interface ContractDownloadResponse {
  success: boolean;
  data: {
    contract_id: string;
    generated_pdf_url: string | null;
    signed_file_url: string | null;
    download_url: string;
  };
}

const normalizeContractList = (payload: WorkerContractRecord[] | ContractListEnvelope) =>
  Array.isArray(payload) ? payload : payload.data ?? [];

export const workerContractsService = {
  list: async (workerId: string) => {
    const payload = await apiClient<WorkerContractRecord[] | ContractListEnvelope>(
      `/api/workers/${workerId}/contracts`,
    );
    return normalizeContractList(payload);
  },

  generatePdf: (workerId: string, contractId: string) =>
    apiClient<ContractGenerateResponse>(`/api/workers/${workerId}/contracts/generate`, {
      method: "POST",
      body: {
        contract_id: contractId,
      },
    }),

  getDownloadUrl: (contractId: string) =>
    apiClient<ContractDownloadResponse>(`/api/contracts/${contractId}/download`),

  uploadSigned: (workerId: string, contractId: string, file: File, signedAt?: string) => {
    const body = new FormData();
    body.append("file", file);
    body.append("contract_id", contractId);
    if (signedAt) {
      body.append("signed_at", signedAt);
    }

    return apiClient<{ success: boolean; message?: string }>(
      `/api/workers/${workerId}/contracts/signed`,
      {
        method: "POST",
        body,
      },
    );
  },
};
