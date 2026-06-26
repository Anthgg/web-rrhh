"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, RefreshCw, Palmtree, ClipboardList } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VacationBalanceCard } from "@/components/attendance/VacationBalanceCard";
import { MyRequestsTable } from "@/components/requests/MyRequestsTable";
import { RequestDetailModal } from "@/components/requests/RequestDetailModal";
import { RequestReviewModal } from "@/components/requests/RequestReviewModal";
import { useVacationBalance } from "@/hooks/useVacationBalance";
import { useRequestTypes } from "@/hooks/useRequestTypes";
import { useRequests } from "@/hooks/useRequests";
import { useSession } from "@/features/auth/auth-provider";
import { requestsService } from "@/services/requests.service";
import type { RequestItem, RequestListFilters, RequestReviewAction } from "@/types/requests";
import { getApiErrorMessage } from "@/lib/api/error-handlers";

type ReviewState = {
  action: RequestReviewAction;
  request: RequestItem;
} | null;

export default function VacationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(user);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  // 1. Fetch Vacation Balance
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useVacationBalance();

  // 2. Fetch Request Types to locate the VACATION type ID
  const {
    data: requestTypes = [],
    isLoading: isTypesLoading,
  } = useRequestTypes();

  const vacationType = useMemo(() => {
    return requestTypes.find(
      (t) => t.code === "VACATION" || t.type === "VACATION"
    );
  }, [requestTypes]);

  const vacationTypeId = vacationType?.id;

  // 3. Fetch Vacation Requests
  const requestsFilters = useMemo<RequestListFilters>(() => ({
    page,
    pageSize,
    status: "all",
    typeId: vacationTypeId,
    sortBy: "newest",
    search: "",
    submittedDatePreset: "all",
  }), [page, pageSize, vacationTypeId]);

  const { listQuery: requestsQuery } = useRequests({
    scope: "my",
    filters: requestsFilters,
    enabled: isAuthenticated && !!vacationTypeId,
    includeStats: false,
  });

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    refetch: refetchRequests,
  } = requestsQuery;

  // 4. Fetch Request Details (for modal)
  const {
    data: detailData,
    error: detailError,
    isError: isDetailError,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["request-detail", detailRequestId],
    queryFn: () => requestsService.getById(detailRequestId as string),
    enabled: Boolean(detailRequestId),
  });

  // 5. Review / Cancel / Resubmit mutation
  const reviewMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
      comment,
    }: {
      requestId: string;
      action: RequestReviewAction;
      comment?: string;
    }) => {
      if (action === "cancel") {
        return requestsService.cancel(requestId);
      }
      if (action === "resubmit") {
        return requestsService.resubmit(requestId, comment ? { reason: comment } : undefined);
      }
      return requestsService.review(requestId, { action, reason: comment });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void queryClient.invalidateQueries({ queryKey: ["vacation-balance"] });
      setReviewState(null);
      setDetailRequestId(null);
    },
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: ({ requestId, files }: { requestId: string; files: File[] }) =>
      requestsService.uploadDocuments(requestId, { documents: files }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void refetchDetail();
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: ({ requestId, documentId }: { requestId: string; documentId: string }) =>
      requestsService.deleteDocument(requestId, documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void refetchDetail();
    },
  });

  const handleReviewConfirm = async (comment?: string) => {
    if (!reviewState) return;
    try {
      await reviewMutation.mutateAsync({
        requestId: reviewState.request.id,
        action: reviewState.action,
        comment,
      });
    } catch {
      // Handled by UI/mutation state
    }
  };

  const handleUploadDocuments = async (requestId: string, files: File[]) => {
    await uploadDocumentsMutation.mutateAsync({ requestId, files });
  };

  const handleDeleteDocument = async (requestId: string, docId: string) => {
    setDeletingDocumentId(docId);
    try {
      await deleteDocumentMutation.mutateAsync({ requestId, documentId: docId });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const openReviewState = (action: RequestReviewAction, request: RequestItem) => {
    setReviewState({ action, request });
  };

  const handleRefresh = () => {
    void refetchBalance();
    void refetchRequests();
  };

  const detailRequest = detailData ?? null;
  const isActionSubmitting = reviewMutation.isPending || deleteDocumentMutation.isPending;

  return (
    <PageContainer>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Control vacacional"
          title="Mis Vacaciones"
          description="Consulta tu saldo de días de vacaciones y haz seguimiento a tu historial de solicitudes."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                title="Actualizar datos"
                className="h-10 w-10 rounded-xl p-0 flex items-center justify-center"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Link href="/dashboard/requests/new?type=vacation">
                <Button className="h-10 gap-2 rounded-xl px-4">
                  <FilePlus2 className="size-4" />
                  Solicitar vacaciones
                </Button>
              </Link>
            </div>
          }
        />

        {/* Balance Section */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Palmtree className="size-5 text-blue-500" />
              Saldo Vacacional
            </h2>
          </div>
          <VacationBalanceCard
            balance={balance}
            isLoading={isBalanceLoading}
            isError={isBalanceError}
          />
        </div>

        {/* Requests History Section */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-t border-border/60 pt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="size-5 text-indigo-500" />
              Historial de Solicitudes de Vacaciones
            </h2>
          </div>

          {isTypesLoading || isRequestsLoading ? (
            <Card className="flex items-center justify-center p-12 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin mr-2" />
              Cargando historial de solicitudes...
            </Card>
          ) : isRequestsError ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-rose-200 bg-rose-50 text-rose-700">
              <p className="font-semibold">Error al cargar el historial</p>
              <p className="text-xs text-rose-500 mt-1">Por favor reintente o consulte al administrador.</p>
              <Button onClick={() => void refetchRequests()} className="mt-3" variant="secondary">
                Reintentar
              </Button>
            </Card>
          ) : (
            <MyRequestsTable
              items={requestsData?.items ?? []}
              page={page}
              pageSize={pageSize}
              total={requestsData?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onView={(item) => setDetailRequestId(item.id)}
              onEdit={(item) => router.push(`/dashboard/requests/new?edit=${item.id}`)}
              onCancel={(item) => openReviewState("cancel", item)}
              onResubmit={(item) => openReviewState("resubmit", item)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <RequestDetailModal
        isOpen={Boolean(detailRequestId)}
        request={detailRequest}
        isLoading={isDetailLoading}
        isError={isDetailError}
        errorDescription={isDetailError ? getApiErrorMessage(detailError) : undefined}
        isSubmitting={isActionSubmitting}
        isUploadingDocuments={uploadDocumentsMutation.isPending}
        deletingDocumentId={deletingDocumentId}
        onRetry={() => void refetchDetail()}
        onClose={() => setDetailRequestId(null)}
        onEdit={(request) => router.push(`/dashboard/requests/new?edit=${request.id}`)}
        onCancel={(request) => openReviewState("cancel", request)}
        onResubmit={(request) => openReviewState("resubmit", request)}
        onApprove={(request) => openReviewState("approve", request)}
        onReject={(request) => openReviewState("reject", request)}
        onObserve={(request) => openReviewState("observe", request)}
        onUploadDocuments={handleUploadDocuments}
        onDeleteDocument={handleDeleteDocument}
      />

      <RequestReviewModal
        key={`${reviewState?.action ?? "closed"}-${reviewState?.request.id ?? "none"}`}
        isOpen={Boolean(reviewState)}
        action={reviewState?.action ?? null}
        request={reviewState?.request ?? null}
        isSubmitting={reviewMutation.isPending}
        onClose={() => setReviewState(null)}
        onConfirm={handleReviewConfirm}
      />
    </PageContainer>
  );
}
