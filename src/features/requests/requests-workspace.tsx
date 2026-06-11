"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2, FileText } from "lucide-react";
import { toast } from "sonner";
import { ExportReportModal } from "@/components/reports/ExportReportModal";

import {
 EmptyState,
 ErrorState,
 LoadingPanel,
 PermissionState,
} from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { MyRequestsTable } from "@/components/requests/MyRequestsTable";
import {
 NewRequestForm,
 type NewRequestFormInitialData,
 type NewRequestFormPayload,
} from "@/components/requests/NewRequestForm";
import { PendingRequestsTable } from "@/components/requests/PendingRequestsTable";
import { RequestDetailModal } from "@/components/requests/RequestDetailModal";
import { RequestFilters } from "@/components/requests/RequestFilters";
import { RequestReportsPanel } from "@/components/requests/RequestReportsPanel";
import { RequestReviewModal } from "@/components/requests/RequestReviewModal";
import { RequestsLayout } from "@/components/requests/RequestsLayout";
import { RequestTemplatesGrid } from "@/components/requests/RequestTemplatesGrid";
import { useSession } from "@/features/auth/auth-provider";
import { useRequests } from "@/hooks/useRequests";
import { useRequestTypes } from "@/hooks/useRequestTypes";
import { isAdminRequestManager, requestDefaultStats } from "@/lib/utils/requests";
import { requestsService } from "@/services/requests.service";
import type {
 RequestDetail,
 RequestItem,
 RequestListFilters,
 RequestReviewAction,
 RequestSectionKey,
 RequestScope,
} from "@/types/requests";

const tableDefaultFilters: RequestListFilters = {
 search: "",
 status: "all",
 typeId: undefined,
 submittedDatePreset: "all",
 submittedDateFrom: undefined,
 submittedDateTo: undefined,
 startDateFrom: undefined,
 startDateTo: undefined,
 updatedDateFrom: undefined,
 updatedDateTo: undefined,
 sortBy: "newest",
 page: 1,
 pageSize: 10,
};

const pendingDefaultFilters: RequestListFilters = {
 ...tableDefaultFilters,
 status: "pending",
};

const statsFilters: RequestListFilters = {
 page: 1,
 pageSize: 1,
 status: "all",
 sortBy: "newest",
 submittedDatePreset: "all",
};

interface RequestsWorkspaceProps {
 section: RequestSectionKey;
}

type ReviewState =
 | {
 action: RequestReviewAction;
 request: RequestItem;
 }
 | null;

function CardIntro({
 title,
 description,
 action,
}: {
 title: string;
 description: string;
 action?: React.ReactNode;
}) {
 return (
 <div className="shell-card rounded-4xl p-6">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid gap-2">
 <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
 <p className="max-w-3xl text-sm leading-6 text-foreground-soft">{description}</p>
 </div>
 {action ? <div>{action}</div> : null}
 </div>
 </div>
 );
}

function getErrorMessage(error: unknown) {
 return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

function getSuccessMessage(action: RequestReviewAction) {
 return {
 approve: "Solicitud aprobada.",
 observe: "Solicitud observada.",
 reject: "Solicitud rechazada.",
 cancel: "Solicitud cancelada.",
 resubmit: "Solicitud reenviada.",
 }[action];
}

function mapDetailToFormData(request: RequestDetail | null | undefined): NewRequestFormInitialData | null {
 if (!request) return null;

 return {
 requestTypeId: request.requestTypeId,
 startDate: request.startDate,
 endDate: request.endDate,
 reason: request.reason,
 additionalComment:
 typeof request.metadata?.additionalComment === "string"
 ? request.metadata.additionalComment
 : null,
 };
}

const requestColumnsForExport = [
 { key: "code", label: "Código" },
 { key: "typeName", label: "Tipo de Solicitud" },
 { key: "requesterName", label: "Colaborador" },
 { key: "startDate", label: "Fecha Inicio" },
 { key: "endDate", label: "Fecha Fin" },
 { key: "status", label: "Estado" },
 { key: "reason", label: "Motivo" },
];

export function RequestsWorkspace({ section }: RequestsWorkspaceProps) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const queryClient = useQueryClient();
 const { user, status } = useSession();
 const role = user?.role ?? "worker";
 const isManager = isAdminRequestManager(user?.role);
 const mainScope: RequestScope = isManager ? "company" : "my";
 const [myFilters, setMyFilters] = useState<RequestListFilters>(tableDefaultFilters);
 const [pendingFilters, setPendingFilters] = useState<RequestListFilters>(pendingDefaultFilters);
 const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
 const [reviewState, setReviewState] = useState<ReviewState>(null);
 const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
 const [formError, setFormError] = useState<{ key: string; message: string } | null>(null);
 const [isExportModalOpen, setIsExportModalOpen] = useState(false);
 const editingRequestId = section === "new-request" ? searchParams.get("edit") : null;
 const isAuthenticated = status === "authenticated" && Boolean(user);
 const formContextKey = `${section}:${editingRequestId ?? "new"}`;

 const {
 data: requestTypesData,
 error: requestTypesError,
 isError: isRequestTypesError,
 isLoading: isRequestTypesLoading,
 refetch: refetchRequestTypes,
 } = useRequestTypes();
 const {
 data: requestStats,
 isLoading: isStatsLoading,
 } = useQuery({
 queryKey: ["request-stats", mainScope],
 queryFn: () => requestsService.getStats(mainScope, statsFilters),
 enabled: isAuthenticated,
 staleTime: 5 * 60_000,
 refetchOnWindowFocus: false,
 });
 const { listQuery: myRequestsList } = useRequests({
 scope: mainScope,
 filters: myFilters,
 enabled: isAuthenticated && section === "my-requests",
 includeStats: false,
 });
 const { listQuery: pendingRequestsList } = useRequests({
 scope: "pending",
 filters: pendingFilters,
 enabled: isAuthenticated && isManager && section === "pending-requests",
 includeStats: false,
 });
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
 const {
 data: editingRequestData,
 error: editingRequestError,
 isError: isEditingRequestError,
 isLoading: isEditingRequestLoading,
 refetch: refetchEditingRequest,
 } = useQuery({
 queryKey: ["request-detail", editingRequestId],
 queryFn: () => requestsService.getById(editingRequestId as string),
 enabled: Boolean(editingRequestId),
 });

 const invalidateRequestModule = async () => {
 await Promise.all([
 queryClient.invalidateQueries({ queryKey: ["requests"] }),
 queryClient.invalidateQueries({ queryKey: ["request-stats"] }),
 queryClient.invalidateQueries({ queryKey: ["request-detail"] }),
 queryClient.invalidateQueries({ queryKey: ["request-report-preview"] }),
 ]);
 };

 const createMutation = useMutation({
 mutationFn: (payload: NewRequestFormPayload) =>
 requestsService.create({
 requestTypeId: payload.requestTypeId,
 startDate: payload.startDate,
 endDate: payload.endDate,
 reason: payload.reason,
 documents: payload.documents,
 }),
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: ["requests"] });
 void invalidateRequestModule();
 },
 });
 const updateMutation = useMutation({
 mutationFn: ({ requestId, payload }: { requestId: string; payload: NewRequestFormPayload }) =>
 requestsService.update(requestId, {
 requestTypeId: payload.requestTypeId,
 startDate: payload.startDate,
 endDate: payload.endDate,
 reason: payload.reason,
 }),
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: ["requests"] });
 void invalidateRequestModule();
 },
 });
 const reviewMutation = useMutation({
 mutationFn: ({ requestId, action, comment }: { requestId: string; action: RequestReviewAction; comment?: string }) => {
 if (action === "cancel") {
 return requestsService.cancel(requestId);
 }

 if (action === "resubmit") {
 return requestsService.resubmit(requestId, comment ? { reason: comment } : undefined);
 }

 return requestsService.review(requestId, {
 action,
 reason: comment,
 });
 },
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: ["requests"] });
 void invalidateRequestModule();
 },
 });
 const uploadDocumentsMutation = useMutation({
 mutationFn: ({ requestId, files }: { requestId: string; files: File[] }) =>
 requestsService.uploadDocuments(requestId, { documents: files }),
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: ["requests"] });
 void invalidateRequestModule();
 },
 });
 const deleteDocumentMutation = useMutation({
 mutationFn: ({ requestId, documentId }: { requestId: string; documentId: string }) =>
 requestsService.deleteDocument(requestId, documentId),
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: ["requests"] });
 void invalidateRequestModule();
 },
 });

 const requestTypes = requestTypesData ?? [];
 const stats = requestStats ?? requestDefaultStats;
 const detailRequest = detailData ?? null;
 const editingRequest = mapDetailToFormData(editingRequestData);
 const isActionSubmitting = reviewMutation.isPending || deleteDocumentMutation.isPending;

 const openReviewState = (action: RequestReviewAction, request: RequestItem) => {
 setReviewState({ action, request });
 };

 const handleCreateOrUpdateRequest = async (payload: NewRequestFormPayload) => {
 try {
 setFormError(null);

 if (editingRequestId) {
 await updateMutation.mutateAsync({
 requestId: editingRequestId,
 payload,
 });
 toast.success("Solicitud actualizada correctamente.");
 } else {
 await createMutation.mutateAsync(payload);
 toast.success("Solicitud registrada correctamente.");
 }

 await invalidateRequestModule();
 router.push("/dashboard/requests/my");
 } catch (error) {
 setFormError({ key: formContextKey, message: getErrorMessage(error) });
 throw error;
 }
 };

 const handleReviewConfirm = async (comment?: string) => {
 if (!reviewState) return;

 try {
 await reviewMutation.mutateAsync({
 requestId: reviewState.request.id,
 action: reviewState.action,
 comment,
 });
 toast.success(getSuccessMessage(reviewState.action));
 await invalidateRequestModule();
 setReviewState(null);
 } catch (error) {
 toast.error(getErrorMessage(error));
 }
 };

 const handleUploadDocuments = async (requestId: string, files: File[]) => {
 try {
 await uploadDocumentsMutation.mutateAsync({ requestId, files });
 toast.success("Documentos subidos correctamente.");
 await invalidateRequestModule();
 } catch (error) {
 toast.error(getErrorMessage(error));
 throw error;
 }
 };

 const handleDeleteDocument = async (requestId: string, documentId: string) => {
 try {
 setDeletingDocumentId(documentId);
 await deleteDocumentMutation.mutateAsync({ requestId, documentId });
 toast.success("Documento eliminado correctamente.");
 await invalidateRequestModule();
 } catch (error) {
 toast.error(getErrorMessage(error));
 } finally {
 setDeletingDocumentId(null);
 }
 };

 if (status === "loading") {
 return (
 <RequestsLayout
 role={role}
 stats={requestDefaultStats}
 isStatsLoading
 >
 <LoadingPanel title="Cargando el modulo de solicitudes." />
 </RequestsLayout>
 );
 }

 if (section === "pending-requests" && !isManager) {
 return (
 <RequestsLayout role={role} stats={stats}>
 <PermissionState moduleName="Solicitudes pendientes" />
 </RequestsLayout>
 );
 }

 const content = (() => {
 if (section === "my-requests") {
 if (myRequestsList.isLoading && !myRequestsList.data) {
 return <LoadingPanel title="Cargando solicitudes." />;
 }

 if (myRequestsList.isError && !myRequestsList.data) {
 return (
 <ErrorState
 title="No se pudieron cargar las solicitudes"
 description={getErrorMessage(myRequestsList.error)}
 onRetry={() => void myRequestsList.refetch()}
 />
 );
 }

 const listData = myRequestsList.data;

 return (
 <div className="grid gap-5">
 <CardIntro
 title={isManager ? "Solicitudes de la empresa" : "Seguimiento personal"}
 description={
 isManager
 ? "Consulta el flujo global de solicitudes, filtra por estado o tipo y abre el detalle para revisar adjuntos, historial y comentarios."
 : "Revisa el estado de tus solicitudes, filtra por tipo o fecha y abre el detalle para ver adjuntos, historial y comentarios del area."
 }
 action={
 <div className="flex items-center gap-3">
 <Button
 variant="secondary"
 className="rounded-xl border-border hover:bg-muted"
 onClick={() => setIsExportModalOpen(true)}
 >
 <FileText className="mr-2 size-4 text-muted-foreground" />
 Exportar PDF
 </Button>
 <Button onClick={() => router.push("/dashboard/requests/new")}>
 <FilePlus2 className="mr-2 size-4" />
 Nueva solicitud
 </Button>
 </div>
 }
 />

 <RequestFilters
 filters={myFilters}
 requestTypes={requestTypes}
 onChange={(patch) =>
 setMyFilters((current) => ({
 ...current,
 ...patch,
 page: patch.page ?? 1,
 }))
 }
 onReset={() => setMyFilters(tableDefaultFilters)}
 />

 <MyRequestsTable
 items={listData?.items ?? []}
 page={listData?.page ?? myFilters.page ?? 1}
 pageSize={listData?.pageSize ?? myFilters.pageSize ?? 10}
 total={listData?.total ?? 0}
 onPageChange={(page) => setMyFilters((current) => ({ ...current, page }))}
 onPageSizeChange={(pageSize) => setMyFilters((current) => ({ ...current, page: 1, pageSize }))}
 onView={(request) => setDetailRequestId(request.id)}
 onEdit={(request) => router.push(`/dashboard/requests/new?edit=${request.id}`)}
 onCancel={(request) => openReviewState("cancel", request)}
 onResubmit={(request) => openReviewState("resubmit", request)}
 />
 </div>
 );
 }

 if (section === "new-request") {
 if (isRequestTypesLoading && !requestTypes.length) {
 return <LoadingPanel title="Cargando tipos de solicitud." />;
 }

 if (isRequestTypesError && !requestTypes.length) {
 return (
 <ErrorState
 title="No se pudieron cargar los tipos de solicitud"
 description={getErrorMessage(requestTypesError)}
 onRetry={() => void refetchRequestTypes()}
 />
 );
 }

 if (editingRequestId && isEditingRequestLoading && !editingRequestData) {
 return <LoadingPanel title="Cargando la solicitud para edicion." />;
 }

 if (editingRequestId && isEditingRequestError && !editingRequestData) {
 return (
 <ErrorState
 title="No se pudo cargar la solicitud"
 description={getErrorMessage(editingRequestError)}
 onRetry={() => void refetchEditingRequest()}
 />
 );
 }

 return (
 <NewRequestForm
 key={editingRequestId ?? "new-request-form"}
 requestTypes={requestTypes}
 initialRequest={editingRequest}
 isSubmitting={createMutation.isPending || updateMutation.isPending}
 submitError={formError?.key === formContextKey ? formError.message : null}
 onSubmit={handleCreateOrUpdateRequest}
 />
 );
 }

 if (section === "pending-requests") {
 if (pendingRequestsList.isLoading && !pendingRequestsList.data) {
 return <LoadingPanel title="Cargando solicitudes pendientes." />;
 }

 if (pendingRequestsList.isError && !pendingRequestsList.data) {
 return (
 <ErrorState
 title="No se pudieron cargar las solicitudes pendientes"
 description={getErrorMessage(pendingRequestsList.error)}
 onRetry={() => void pendingRequestsList.refetch()}
 />
 );
 }

 const listData = pendingRequestsList.data;

 return (
 <div className="grid gap-5">
 <CardIntro
 title="Bandeja de revision"
 description="Concentra solicitudes pendientes con acciones rapidas para aprobar, observar, rechazar o abrir el detalle completo antes de decidir."
 action={
 <Button
 variant="secondary"
 className="rounded-xl border-border hover:bg-muted"
 onClick={() => setIsExportModalOpen(true)}
 >
 <FileText className="mr-2 size-4 text-muted-foreground" />
 Exportar PDF
 </Button>
 }
 />

 <RequestFilters
 filters={pendingFilters}
 requestTypes={requestTypes}
 onChange={(patch) =>
 setPendingFilters((current) => ({
 ...current,
 ...patch,
 page: patch.page ?? 1,
 }))
 }
 onReset={() => setPendingFilters(pendingDefaultFilters)}
 />

 <PendingRequestsTable
 items={listData?.items ?? []}
 page={listData?.page ?? pendingFilters.page ?? 1}
 pageSize={listData?.pageSize ?? pendingFilters.pageSize ?? 10}
 total={listData?.total ?? 0}
 onPageChange={(page) => setPendingFilters((current) => ({ ...current, page }))}
 onPageSizeChange={(pageSize) =>
 setPendingFilters((current) => ({ ...current, page: 1, pageSize }))
 }
 onView={(request) => setDetailRequestId(request.id)}
 onApprove={(request) => openReviewState("approve", request)}
 onReject={(request) => openReviewState("reject", request)}
 onObserve={(request) => openReviewState("observe", request)}
 />
 </div>
 );
 }

 if (section === "reports") {
 return <RequestReportsPanel requestTypes={requestTypes} scope={mainScope} />;
 }

 if (section === "templates") {
 return <RequestTemplatesGrid />;
 }

 return (
 <EmptyState
 title="Seccion no encontrada"
 description="La vista solicitada no esta disponible en esta version del modulo."
 />
 );
 })();

 return (
 <>
 <RequestsLayout
 role={role}
 stats={stats}
 isStatsLoading={isStatsLoading}
 action={
 section !== "new-request" ? (
 <Button onClick={() => router.push("/dashboard/requests/new")}>
 <FilePlus2 className="mr-2 size-4" />
 Nueva solicitud
 </Button>
 ) : undefined
 }
 >
 {content}
 </RequestsLayout>

 <RequestDetailModal
 isOpen={Boolean(detailRequestId)}
 request={detailRequest}
 isLoading={isDetailLoading}
 isError={isDetailError}
 errorDescription={isDetailError ? getErrorMessage(detailError) : undefined}
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

 <ExportReportModal
 isOpen={isExportModalOpen}
 onClose={() => setIsExportModalOpen(false)}
 reportType="requests"
 activeFilters={section === "pending-requests" ? pendingFilters : myFilters}
 tableData={(section === "pending-requests" ? pendingRequestsList.data?.items : myRequestsList.data?.items)?.map(item => ({
 ...item,
 requesterName: item.requester?.fullName ?? "",
 }))}
 tableColumns={requestColumnsForExport}
 filename={section === "pending-requests" ? "reporte-solicitudes-pendientes-fabryor" : "reporte-solicitudes-fabryor"}
 />
 </>
 );
}
