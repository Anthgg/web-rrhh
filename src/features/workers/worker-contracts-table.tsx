"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { RequestModalShell } from "@/components/requests/request-modal-shell";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { type WorkerContractRecord } from "@/services/workerContracts.service";
import { withPdfCacheBust } from "@/lib/pdf-url";
import {
  useContracts,
  useGenerateContractPdf,
  useUploadSignedContract,
} from "@/hooks/useContracts";

interface WorkerContractsTableProps {
  workerId: string;
}

const getContractId = (contract: WorkerContractRecord) =>
  contract.contract_id || contract.contractId || contract.id || "";

// Formateador hoistado a nivel de módulo — se crea una sola vez
const DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const getContractType = (contract: WorkerContractRecord) =>
  contract.contract_type || contract.contractType || contract.type || "Contrato laboral";

const getCreatedDate = (contract: WorkerContractRecord) =>
  contract.created_at || contract.createdAt || contract.start_date || contract.startDate || "";

const getGeneratedUrl = (contract: WorkerContractRecord) =>
  contract.pdf_url ||
  contract.pdfUrl ||
  contract.download_url ||
  contract.downloadUrl ||
  contract.generated_pdf_url ||
  contract.generatedPdfUrl ||
  "";

const getSignedUrl = (contract: WorkerContractRecord) =>
  contract.signed_file_url || contract.signedFileUrl || "";

const formatDate = (value: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMATTER.format(date);
};

const formatStatus = (contract: WorkerContractRecord) => {
  if (getSignedUrl(contract)) return "Firmado";
  if (getGeneratedUrl(contract)) return "PDF generado";
  return contract.status || "Pendiente";
};

export function WorkerContractsTable({ workerId }: WorkerContractsTableProps) {
  const [uploadContract, setUploadContract] = useState<WorkerContractRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signedAt, setSignedAt] = useState<string>("");
  const [latestPdfUrls, setLatestPdfUrls] = useState<Record<string, string>>({});

  const contractsQuery = useContracts(workerId);
  const generateMutation = useGenerateContractPdf(workerId);
  const uploadMutation = useUploadSignedContract(workerId);

  const contracts = useMemo(() => contractsQuery.data ?? [], [contractsQuery.data]);
  const uploadContractId = uploadContract ? getContractId(uploadContract) : "";

  const handleGeneratePdf = (contractId: string) => {
    generateMutation.mutate(contractId, {
      onSuccess: (response) => {
        const freshUrl =
          response.data?.pdf_url ||
          response.data?.download_url ||
          response.data?.generated_pdf_url ||
          "";

        if (freshUrl) {
          setLatestPdfUrls((current) => ({
            ...current,
            [contractId]: withPdfCacheBust(freshUrl),
          }));
        }

        toast.success("Contrato PDF generado correctamente.");
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo generar el contrato."),
    });
  };

  const handleUploadSigned = () => {
    if (selectedFile && uploadContractId) {
      uploadMutation.mutate(
        { contractId: uploadContractId, file: selectedFile, signedAt: signedAt || undefined },
        {
          onSuccess: () => {
            toast.success("Contrato firmado subido correctamente.");
            setUploadContract(null);
            setSelectedFile(null);
            setSignedAt("");
          },
          onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo subir el contrato firmado."),
        }
      );
    }
  };

  if (contractsQuery.isLoading) {
    return <LoadingPanel title="Cargando contratos del trabajador." />;
  }

  if (contractsQuery.isError) {
    return (
      <ErrorState
        title="No pudimos cargar contratos"
        description={
          contractsQuery.error instanceof Error
            ? contractsQuery.error.message
            : "Intenta actualizar el historial contractual."
        }
        onRetry={() => void contractsQuery.refetch()}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Historial contractual</h3>
          <p className="text-xs text-ink-soft">
            Genera, visualiza y archiva contratos laborales formales.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={contractsQuery.isRefetching}
          onClick={() => void contractsQuery.refetch()}
          className="h-9 gap-1.5 px-3 text-xs"
        >
          <RefreshCw className={`size-3.5 ${contractsQuery.isRefetching ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Tipo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Fecha
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.length ? (
                contracts.map((contract) => {
                  const contractId = getContractId(contract);
                  const generatedUrl = latestPdfUrls[contractId] || withPdfCacheBust(getGeneratedUrl(contract));
                  const isGenerating =
                    generateMutation.isPending && generateMutation.variables === contractId;

                  return (
                    <tr key={contractId} className="align-middle">
                      <td className="p-4 text-sm font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-indigo-600" />
                          {getContractType(contract)}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-ink-soft">
                        {formatDate(getCreatedDate(contract))}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatStatus(contract)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {generatedUrl ? (
                            <>
                              <a
                                href={generatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                              >
                                <ExternalLink className="size-3.5" />
                                Ver contrato
                              </a>
                              <a
                                href={generatedUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-border bg-white px-3 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                              >
                                <Download className="size-3.5" />
                                Descargar PDF
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={isGenerating}
                                onClick={() => handleGeneratePdf(contractId)}
                                className="h-9 gap-1.5 px-3 text-xs"
                              >
                                {isGenerating ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                <RefreshCw className="size-3.5" />
                                )}
                                Regenerar
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              disabled={isGenerating}
                              onClick={() => handleGeneratePdf(contractId)}
                              className="h-9 gap-1.5 px-3 text-xs"
                            >
                              {isGenerating ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <FileText className="size-3.5" />
                              )}
                              Generar PDF
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setUploadContract(contract)}
                            className="h-9 gap-1.5 px-3 text-xs"
                          >
                            <UploadCloud className="size-3.5" />
                            Subir firmado
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-soft">
                    Este trabajador no tiene contratos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RequestModalShell
        isOpen={Boolean(uploadContract)}
        title="Subir contrato firmado"
        subtitle="Adjunta el PDF escaneado o firmado digitalmente para archivarlo en el expediente."
        onClose={() => {
          if (uploadMutation.isPending) return;
          setUploadContract(null);
          setSelectedFile(null);
          setSignedAt("");
        }}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={uploadMutation.isPending}
              onClick={() => {
                setUploadContract(null);
                setSelectedFile(null);
                setSignedAt("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || !uploadContractId || uploadMutation.isPending}
              onClick={handleUploadSigned}
              className="gap-2"
            >
              {uploadMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Subir documento
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Contrato
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {uploadContract ? getContractType(uploadContract) : "Contrato laboral"}
            </p>
          </div>

          <label className="grid cursor-pointer gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center hover:border-indigo-400 hover:bg-indigo-50/40">
            <UploadCloud className="size-8 text-indigo-600" />
            <span className="text-sm font-semibold text-ink">
              {selectedFile ? selectedFile.name : "Selecciona el contrato firmado"}
            </span>
            <span className="text-xs text-ink-soft">PDF o imagen escaneada</span>
            <Input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="grid gap-1.5">
          <label
            htmlFor="signed-contract-upload-date"
            className="text-sm font-medium text-ink"
          >
              Fecha de firma (Opcional)
          </label>
          <Input
            id="signed-contract-upload-date"
            type="date"
            value={signedAt}
            onChange={(e) => setSignedAt(e.target.value)}
            disabled={uploadMutation.isPending}
          />
          </div>
        </div>
      </RequestModalShell>
    </div>
  );
}
