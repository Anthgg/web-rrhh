"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  History,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  X,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Briefcase,
  Building2,
  MapPin,
  Mail,
  Phone,
  Info,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/fields";
import { PageContainer } from "@/components/layout/page-container";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { RequestReviewModal } from "@/components/requests/RequestReviewModal";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { useSession } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatDateRange, formatDateTime, formatFileSize, getInitials } from "@/lib/utils/format";
import { isAdminRequestManager, getRequestDisplayStartDate, getRequestDisplayEndDate, getRequestDisplayDateRange } from "@/lib/utils/requests";
import { requestsService } from "@/services/requests.service";
import { workersService } from "@/services/workers.service";
import { appConfig } from "@/lib/config/app-config";
import type {
  RequestAttachment,
  RequestReviewAction,
  RequestReviewHistoryItem,
} from "@/types/requests";

type TabKey = "summary" | "documents" | "history" | "review" | "audit";

interface RequestDetailViewProps {
  requestId: string;
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

function getAttachmentIcon(attachment: RequestAttachment) {
  const mimeType = attachment.mimeType?.toLowerCase() ?? "";
  const fileName = attachment.name.toLowerCase();

  if (attachment.isImage || mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("spreadsheet") || fileName.match(/\.(xls|xlsx|csv)$/)) return FileSpreadsheet;
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("presentation") ||
    fileName.match(/\.(pdf|doc|docx|ppt|pptx|txt)$/)
  ) {
    return FileText;
  }
  return FileIcon;
}

function getQueuedFileIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon;
  if (file.type.includes("spreadsheet") || file.name.match(/\.(xls|xlsx|csv)$/i)) return FileSpreadsheet;
  if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.type.includes("presentation") ||
    file.name.match(/\.(pdf|doc|docx|ppt|pptx|txt)$/i)
  ) {
    return FileText;
  }
  return FileIcon;
}

function DocumentStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const normalized = status.toLowerCase().replace(/_/g, " ");
  let label = status;
  let classes = "bg-muted text-foreground-soft border border-border";

  if (normalized.includes("firmado subido") || normalized.includes("signed uploaded") || normalized === "signed") {
    label = "Firmado subido";
    classes =
      "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
  } else if (normalized.includes("pendiente de firma") || normalized.includes("pending signature") || normalized === "pending") {
    label = "Pendiente de firma";
    classes =
      "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
  } else if (normalized.includes("validado") || normalized.includes("validated")) {
    label = "Validado";
    classes =
      "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20";
  } else if (normalized.includes("generado") || normalized.includes("generated")) {
    label = "Generado";
    classes =
      "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", classes)}>
      {label}
    </span>
  );
}

const TIMELINE_TONE: Record<string, string> = {
  created: "bg-sky-500",
  submitted: "bg-sky-500",
  updated: "bg-slate-400",
  approved: "bg-emerald-500",
  observed: "bg-indigo-500",
  rejected: "bg-rose-500",
  cancelled: "bg-slate-500",
  resubmitted: "bg-sky-500",
  commented: "bg-slate-400",
  unknown: "bg-slate-400",
};

function SectionTitle({ icon: Icon, children, action }: { icon: typeof FileText; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h4 className="section-title text-lg font-semibold text-foreground">{children}</h4>
      </div>
      {action}
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-soft">{label}</span>
      <span className={cn("text-right text-sm font-semibold", accent ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
  );
}

function TextBlock({ label, value, muted }: { label: string; value?: string | null; muted?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/60 p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">{label}</span>
      <p className={cn("mt-2 text-sm leading-6", value ? "text-foreground" : "text-foreground-soft")}>
        {value || muted || "Sin información registrada."}
      </p>
    </div>
  );
}

function RequestTimeline({ history }: { history: RequestReviewHistoryItem[] }) {
  if (!history.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-6 text-sm text-foreground-soft">
        Aún no hay movimientos de revisión para esta solicitud.
      </div>
    );
  }

  return (
    <ol className="relative ml-1 grid gap-5 border-l border-border pl-6">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              "absolute -left-[1.95rem] top-1 size-3 rounded-full ring-4 ring-card",
              TIMELINE_TONE[entry.action] ?? TIMELINE_TONE.unknown,
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="size-4 text-primary" />
              {entry.actorName}
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-soft">{entry.actionLabel}</span>
          </div>
          <p className="mt-1 text-xs text-foreground-soft">
            {entry.actorRole ? `${entry.actorRole} · ` : ""}
            {formatDateTime(entry.createdAt)}
          </p>
          {entry.comment ? <p className="mt-2 text-sm leading-6 text-foreground">{entry.comment}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function DetailSkeleton() {
  return (
    <PageContainer variant="wide" className="space-y-6">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-28 animate-pulse rounded-4xl bg-muted/60" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <div className="h-10 w-full max-w-md animate-pulse rounded-2xl bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-4xl bg-muted/50" />
          ))}
        </div>
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-4xl bg-muted/50" />
          <div className="h-48 animate-pulse rounded-4xl bg-muted/50" />
        </div>
      </div>
    </PageContainer>
  );
}

function translateRequestType(type: string): string {
  const t = type?.toUpperCase() ?? "";
  const typesMap: Record<string, string> = {
    DESCANSO_MEDICO: "Descanso médico",
    VACACIONES: "Vacaciones",
    PERMISO_PERSONAL: "Permiso personal",
    JUSTIFICACION_INASISTENCIA: "Justificación de inasistencia",
    CAMBIO_HORARIO: "Cambio de horario",
    LICENCIA_PAGADA: "Licencia con goce",
    LICENCIA_SIN_GOCE: "Licencia sin goce",
  };
  return typesMap[t] || type || "No informado";
}

function getStatusDetails(status: string, label?: string) {
  const key = status?.toLowerCase() ?? "";
  let displayLabel = label || status;
  let bg = "";
  let text = "";
  let border = "";
  let Icon = Clock3;

  if (key.includes("approve") || key === "approved") {
    displayLabel = label || "Aprobada";
    bg = "bg-emerald-500/10 dark:bg-emerald-500/20";
    text = "text-emerald-700 dark:text-emerald-400";
    border = "border-emerald-500/20";
    Icon = CheckCircle2;
  } else if (key.includes("reject") || key === "rejected") {
    displayLabel = label || "Rechazada";
    bg = "bg-rose-500/10 dark:bg-rose-500/20";
    text = "text-rose-700 dark:text-rose-400";
    border = "border-rose-500/20";
    Icon = XCircle;
  } else if (key.includes("observe") || key === "observed") {
    displayLabel = label || "Observada";
    bg = "bg-violet-500/10 dark:bg-violet-500/20";
    text = "text-violet-700 dark:text-violet-400";
    border = "border-violet-500/20";
    Icon = Eye;
  } else if (key.includes("pending") || key === "pending" || key === "pending_supervisor" || key === "pending_rrhh") {
    if (key === "pending_supervisor") displayLabel = label || "Pendiente Supervisor";
    else if (key === "pending_rrhh") displayLabel = label || "Pendiente RRHH";
    else displayLabel = label || "Pendiente";
    bg = "bg-amber-500/10 dark:bg-amber-500/20";
    text = "text-amber-700 dark:text-amber-400";
    border = "border-amber-500/20";
    Icon = Clock3;
  } else if (key === "draft") {
    displayLabel = label || "Borrador";
    bg = "bg-slate-500/10 dark:bg-slate-500/20";
    text = "text-slate-700 dark:text-slate-400";
    border = "border-slate-500/20";
    Icon = FileText;
  } else if (key === "cancelled") {
    displayLabel = label || "Cancelada";
    bg = "bg-slate-500/10 dark:bg-slate-500/20";
    text = "text-slate-700 dark:text-slate-400";
    border = "border-slate-500/20";
    Icon = Trash2;
  } else if (key === "expired") {
    displayLabel = label || "Expirada";
    bg = "bg-slate-500/10 dark:bg-slate-500/20";
    text = "text-slate-700 dark:text-slate-400";
    border = "border-slate-500/20";
    Icon = Clock3;
  } else {
    displayLabel = label || status;
    bg = "bg-slate-500/10 dark:bg-slate-500/20";
    text = "text-slate-700 dark:text-slate-400";
    border = "border-slate-500/20";
    Icon = Clock3;
  }

  return { displayLabel, bg, text, border, Icon };
}

function getProfileImageUrl(worker: any) {
  if (!worker) return null;
  const rawUrl = worker.profilePhotoUrl || worker.photoUrl || worker.avatarUrl || worker.user?.profilePhotoUrl;
  if (!rawUrl) return null;
  
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")) {
    return rawUrl;
  }
  
  const cleanPath = rawUrl.startsWith("/") ? rawUrl.slice(1) : rawUrl;
  return `${appConfig.backendBaseUrl}/${cleanPath}`;
}

function formatEmployeeCode(code?: string) {
  if (!code) return "Sin código";
  if (code.length <= 12) return code;
  return `${code.slice(0, 8)}...${code.slice(-4)}`;
}

export function RequestDetailView({ requestId }: RequestDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isAdmin = isAdminRequestManager(user?.role);

  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [reviewState, setReviewState] = useState<RequestReviewAction | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<RequestAttachment | null>(null);

  const {
    data: request,
    error,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["request-detail", requestId],
    queryFn: () => requestsService.getById(requestId),
    enabled: Boolean(requestId),
  });

  const [copiedRequestId, setCopiedRequestId] = useState(false);
  const [copiedRequestCode, setCopiedRequestCode] = useState(false);
  const [copiedWorkerCode, setCopiedWorkerCode] = useState(false);

  const workerId = request?.workerId;
  const { data: workerDetail } = useQuery({
    queryKey: ["worker-detail", workerId],
    queryFn: () => workersService.detail(workerId!),
    enabled: Boolean(workerId),
  });

  const worker = useMemo(() => {
    if (!request) return null;
    const reqWorker = (request as any).worker || request.requester || {};
    const wDetail = (workerDetail || {}) as any;
    return {
      id: request.workerId || reqWorker.id || request.requester?.id || wDetail.id,
      fullName: wDetail.fullName || reqWorker.fullName || request.requester?.fullName || "No informado",
      employeeCode: wDetail.employeeCode || reqWorker.employeeCode || request.requester?.employeeCode || request.workerId || "",
      profilePhotoUrl: wDetail.profilePhotoUrl || wDetail.avatarUrl || reqWorker.profilePhotoUrl || reqWorker.photoUrl || reqWorker.avatarUrl || request.requester?.avatarUrl,
      position: wDetail.position || reqWorker.positionName || reqWorker.position || request.requester?.position || "Cargo pendiente de asignación",
      department: wDetail.department || reqWorker.departmentName || reqWorker.areaName || reqWorker.department || request.requester?.department || "Área no asignada",
      project: wDetail.project || reqWorker.projectName || reqWorker.workLocationName || reqWorker.project || request.requester?.project || "Proyecto no asignado",
      email: wDetail.email || reqWorker.email || request.requester?.email,
      phone: wDetail.phone || reqWorker.phone || request.requester?.phone,
      status: wDetail.status || reqWorker.status || request.requester?.status,
    };
  }, [request, workerDetail]);

  const handleCopyWorkerCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedWorkerCode(true);
    toast.success("Código de trabajador copiado.");
    setTimeout(() => setCopiedWorkerCode(false), 2000);
  };

  const queuedPreviews = useMemo(
    () =>
      queuedFiles.map((file) => ({
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    [queuedFiles],
  );

  useEffect(() => {
    return () => {
      queuedPreviews.forEach((entry) => entry.previewUrl && URL.revokeObjectURL(entry.previewUrl));
    };
  }, [queuedPreviews]);

  const invalidateRequestModule = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["requests"] }),
      queryClient.invalidateQueries({ queryKey: ["request-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["request-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["request-report-preview"] }),
      queryClient.invalidateQueries({ queryKey: ["vacation-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] }),
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] }),
    ]);
  };

  const reviewMutation = useMutation({
    mutationFn: ({ action, comment }: { action: RequestReviewAction; comment?: string }) => {
      if (action === "cancel") return requestsService.cancel(requestId);
      if (action === "resubmit") return requestsService.resubmit(requestId, comment ? { reason: comment } : undefined);
      return requestsService.review(requestId, { action, reason: comment });
    },
    onSuccess: () => void invalidateRequestModule(),
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: (files: File[]) => requestsService.uploadDocuments(requestId, { documents: files }),
    onSuccess: () => void invalidateRequestModule(),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => requestsService.deleteDocument(requestId, documentId),
    onSuccess: () => void invalidateRequestModule(),
  });

  const generateDocumentMutation = useMutation({
    mutationFn: () => requestsService.generateDocument(requestId),
    onSuccess: () => {
      void invalidateRequestModule();
      toast.success("Documento generado correctamente.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const uploadSignedDocumentMutation = useMutation({
    mutationFn: (file: File) => requestsService.uploadSignedDocument(requestId, file),
    onSuccess: () => {
      void invalidateRequestModule();
      toast.success("Documento firmado subido correctamente.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const isActionSubmitting =
    reviewMutation.isPending ||
    deleteDocumentMutation.isPending ||
    generateDocumentMutation.isPending ||
    uploadSignedDocumentMutation.isPending;

  const handleReviewConfirm = async (comment?: string) => {
    if (!reviewState) return;
    try {
      await reviewMutation.mutateAsync({ action: reviewState, comment });
      toast.success(getSuccessMessage(reviewState));
      setReviewState(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUploadDocuments = async () => {
    if (!queuedFiles.length) return;
    try {
      await uploadDocumentsMutation.mutateAsync(queuedFiles);
      toast.success("Documentos subidos correctamente.");
      setQueuedFiles([]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingDocumentId(documentId);
      await deleteDocumentMutation.mutateAsync(documentId);
      toast.success("Documento eliminado correctamente.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const appendFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming).slice(0, 5);
    setQueuedFiles((current) =>
      [...current, ...next]
        .filter((file, index, array) => array.findIndex((e) => e.name === file.name && e.size === file.size) === index)
        .slice(0, 5),
    );
  };

  const backToList = () => router.push(isAdmin ? "/dashboard/requests/pending" : "/dashboard/requests/my");

  if (isLoading) return <DetailSkeleton />;

  if (isError || !request) {
    return (
      <PageContainer variant="wide" className="space-y-6">
        <ErrorState
          title="No pudimos cargar la solicitud"
          description={
            isError ? getErrorMessage(error) : "La solicitud no existe o ya no está disponible en el sistema."
          }
          onRetry={() => void refetch()}
        />
        <div className="flex justify-center">
          <Button variant="secondary" onClick={backToList}>
            <ArrowLeft className="mr-2 size-4" />
            Volver a solicitudes
          </Button>
        </div>
      </PageContainer>
    );
  }

  const canManageDocuments = Boolean(request.canEdit || request.canResubmit);
  const hasReviewActions = isAdmin && request.canReview;
  const isReviewed = ["approved", "rejected", "observed"].includes(request.status);
  const approverLabel = request.approvedBy?.trim() || (isReviewed ? "Aprobador del Sistema" : undefined);
  const additionalComment = typeof request.metadata?.additionalComment === "string" ? request.metadata.additionalComment : null;
  const formalDoc = request.generatedRequestDocument ?? null;
  const { displayLabel: statusLabelText, bg: statusBg, text: statusTextColor, border: statusBorderColor, Icon: StatusIcon } = getStatusDetails(request.status, request.statusLabel);
  const tabs: { key: TabKey; label: string; icon: typeof FileText; count?: number; hidden?: boolean }[] = [
    { key: "summary", label: "Resumen", icon: Layers },
    { key: "documents", label: "Documentos", icon: Paperclip, count: request.attachments.length + (formalDoc ? 1 : 0) },
    { key: "history", label: "Historial", icon: History, count: request.reviewHistory.length },
    { key: "audit", label: "Auditoría", icon: ShieldCheck },
    { key: "review", label: "Revisión", icon: ShieldCheck, hidden: !hasReviewActions },
  ];
  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  const currentTab = visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "summary";

  // Resolve request type key for labor impact card
  const requestTypeKey = request.requestTypeId?.toUpperCase() || request.typeName?.toUpperCase() || "";
  const isMedicalLeave = requestTypeKey.includes("MEDICO") || requestTypeKey.includes("DESCANSO");
  const isVacation = requestTypeKey.includes("VACACION");
  const isPersonalLeave = requestTypeKey.includes("PERMISO") || requestTypeKey.includes("LICENCIA");
  const isJustification = requestTypeKey.includes("JUSTIFIC") || requestTypeKey.includes("INASISTENCIA");
  const isScheduleChange = requestTypeKey.includes("HORARIO") || requestTypeKey.includes("CAMBIO");

  return (
    <PageContainer variant="wide" className="space-y-6">
      {/* ── Return Link ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={backToList}
        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-soft transition hover:text-foreground focus:outline-none"
      >
        <ArrowLeft className="size-4" />
        Volver a solicitudes
      </button>

      {/* ── Header Principal (Hero Card) ───────────────────────── */}
      <Card className="relative overflow-hidden p-6 border border-border/70 dark:border-border/40 bg-gradient-to-br from-card via-card to-primary/[0.02] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none backdrop-blur-md rounded-3xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="grid gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                <FileText className="size-3.5" />
                {request.code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(request.code);
                  setCopiedRequestCode(true);
                  toast.success("Código de solicitud copiado.");
                  setTimeout(() => setCopiedRequestCode(false), 2000);
                }}
                className="p-1.5 rounded-xl border border-border bg-card/50 text-foreground-soft hover:bg-muted hover:text-foreground transition focus:outline-none"
                title="Copiar código de solicitud"
              >
                {copiedRequestCode ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mt-1 flex flex-wrap items-center gap-3">
              {translateRequestType(request.typeName)}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-soft font-medium mt-1">
              <div className="flex items-center gap-1.5">
                <UserRound className="size-4 text-primary/70" />
                <span>{worker?.fullName}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary/70" />
                <span>Rango: {getRequestDisplayDateRange(request)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock3 className="size-4 text-primary/70" />
                <span>Creada: {formatDateTime(request.createdAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border shadow-sm",
                statusBg, statusTextColor, statusBorderColor
              )}>
                <StatusIcon className="size-3.5" />
                {statusLabelText}
              </span>
              {request.requiresBalanceOverride ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-400">
                  <AlertTriangle className="size-3.5" />
                  Excede saldo
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 border-t border-border/50 lg:border-t-0 pt-4 lg:pt-0">
            {hasReviewActions ? (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold rounded-2xl px-5 h-11 transition"
                  onClick={() => setReviewState("approve")}
                  disabled={isActionSubmitting}
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  Aprobar
                </Button>
                <Button
                  className="border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 font-semibold rounded-2xl px-5 h-11 transition"
                  onClick={() => setReviewState("observe")}
                  disabled={isActionSubmitting}
                >
                  <Eye className="mr-2 size-4" />
                  Observar
                </Button>
                <Button 
                  variant="danger" 
                  className="font-semibold rounded-2xl px-5 h-11 transition"
                  onClick={() => setReviewState("reject")} 
                  disabled={isActionSubmitting}
                >
                  <XCircle className="mr-2 size-4" />
                  Rechazar
                </Button>
              </>
            ) : null}

            {request.canEdit ? (
              <Button
                variant="secondary"
                className="font-semibold rounded-2xl px-5 h-11 transition"
                onClick={() => router.push(`/dashboard/requests/new?edit=${request.id}`)}
                disabled={isActionSubmitting}
              >
                Editar
              </Button>
            ) : null}
            {request.canResubmit ? (
              <Button 
                className="font-semibold rounded-2xl px-5 h-11 transition"
                onClick={() => setReviewState("resubmit")} 
                disabled={isActionSubmitting}
              >
                <RotateCcw className="mr-2 size-4" />
                Reenviar
              </Button>
            ) : null}
            {request.canCancel ? (
              <Button
                variant="ghost"
                className="text-rose-700 hover:bg-rose-50 hover:text-rose-700 font-semibold rounded-2xl px-5 h-11 transition"
                onClick={() => setReviewState("cancel")}
                disabled={isActionSubmitting}
              >
                <Trash2 className="mr-2 size-4" />
                Cancelar
              </Button>
            ) : null}

            {formalDoc?.url ? (
              <a
                href={formalDoc.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-primary transition hover:border-primary hover:bg-muted"
              >
                <FileText className="mr-2 size-4" />
                Ver documento
              </a>
            ) : null}
            {formalDoc?.url ? (
              <a
                href={formalDoc.url}
                download
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-primary transition hover:border-primary hover:bg-muted"
              >
                <Download className="mr-2 size-4" />
                Descargar PDF
              </a>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ── Main 12-Column Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Columna Principal: 8 columnas (Contenido y Tabs) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Segmented Control Tabs */}
          <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1">
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = tab.key === currentTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition group focus:outline-none",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-foreground-soft hover:bg-muted hover:text-foreground",
                  )}
                >
                  <TabIcon className="size-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined ? (
                    <span className={cn(
                      "ml-1.5 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-2xs font-bold leading-none min-w-5 h-5",
                      isActive 
                        ? "bg-primary-foreground text-primary" 
                        : "bg-muted-foreground/15 text-foreground-soft group-hover:bg-muted-foreground/25"
                    )}>
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* ── Tab Content: Resumen ─────────────────────────────── */}
          {currentTab === "summary" ? (
            <div className="space-y-6">
              {/* Vacation Overdraft Warnings */}
              {request.vacationBalance ? (
                <Card className="space-y-4 border border-rose-200 dark:border-rose-900/30 p-5 rounded-3xl bg-rose-500/[0.02]">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
                    <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                    Detalle de sobregiro vacacional
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-soft">Saldo al solicitar</p>
                      <p className="mt-1 text-base font-extrabold text-foreground">
                        {parseFloat(request.vacationBalance.availableDaysAtRequest.toFixed(2))} días
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-soft">Días solicitados</p>
                      <p className="mt-1 text-base font-extrabold text-foreground">
                        {parseFloat(request.vacationBalance.requestedDays.toFixed(2))} días
                      </p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-100/50 p-3 dark:border-rose-800/40 dark:bg-rose-900/20 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">Saldo proyectado</p>
                      <p className="mt-1 text-base font-extrabold text-rose-700 dark:text-rose-300">
                        {parseFloat(request.vacationBalance.projectedAvailableDays.toFixed(2))} días
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null}

              {/* Labor Impact Card */}
              <Card className="p-5 border border-border/80 rounded-3xl bg-card shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex size-12 items-center justify-center rounded-2xl shrink-0 shadow-2xs",
                    isMedicalLeave ? "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" :
                    isVacation ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                    isPersonalLeave ? "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400" :
                    isJustification ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                    "bg-primary/10 text-primary"
                  )}>
                    {isMedicalLeave ? <ShieldAlert className="size-6" /> :
                     isVacation ? <CalendarDays className="size-6" /> :
                     isPersonalLeave ? <Clock3 className="size-6" /> :
                     isJustification ? <UserCheck className="size-6" /> :
                     <Info className="size-6" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-foreground-soft">Impacto Laboral Estimado</h4>
                    <p className="text-sm text-foreground font-semibold">
                      Análisis de repercusión de la solicitud para el departamento de Recursos Humanos.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-foreground-soft list-disc list-inside pl-1">
                      {isMedicalLeave ? (
                        <>
                          <li>No se computará como falta o inasistencia injustificada.</li>
                          <li>Requiere la validación física de la evidencia o certificado médico emitido.</li>
                          <li>Corresponde evaluar el pago de subsidio según los días indicados y regulaciones vigentes.</li>
                        </>
                      ) : isVacation ? (
                        <>
                          <li>Se descontará del saldo total de vacaciones disponibles del colaborador.</li>
                          <li>Bloquea el registro de marcaciones de asistencia durante el rango de fechas aprobado.</li>
                          <li>Debe programarse cobertura de funciones y notificar al equipo con anticipación.</li>
                        </>
                      ) : isPersonalLeave ? (
                        <>
                          <li>Se registra como permiso con la etiqueta de goce o sin goce de haber según corresponda.</li>
                          <li>No bloquea las marcaciones de asistencia si se requiere asistencia parcial.</li>
                          <li>Sujeto a límites corporativos mensuales para permisos no programados.</li>
                        </>
                      ) : isJustification ? (
                        <>
                          <li>Regulariza una inasistencia o tardanza previamente reportada.</li>
                          <li>Vincula la justificación directamente con el parte de asistencia diario para eliminar penalizaciones.</li>
                          <li>Evita el descuento salarial correspondiente de ser aprobada de forma formal.</li>
                        </>
                      ) : isScheduleChange ? (
                        <>
                          <li>Modifica el turno de trabajo habitual del trabajador para el rango establecido.</li>
                          <li>Afecta los reportes de control de asistencia para calcular las horas laboradas de forma correcta.</li>
                        </>
                      ) : (
                        <>
                          <li>Registra la solicitud según el tipo indicado.</li>
                          <li>Sujeto a los flujos y políticas generales de aprobación definidos por la empresa.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Content Detail Card */}
              <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-6">
                <SectionTitle icon={MessageSquare}>Detalles del Contenido</SectionTitle>
                
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-foreground-soft">Motivo del Trabajador</span>
                  <div className="relative border-l-4 border-primary/50 pl-4 py-3 italic text-base text-foreground bg-primary/[0.02] dark:bg-primary/[0.04] rounded-r-2xl shadow-2xs">
                    <span className="absolute -top-3 left-1 text-5xl text-primary/10 font-serif leading-none select-none">“</span>
                    <p className="relative z-10 leading-relaxed text-foreground/90">{request.reason || "El trabajador no especificó un motivo formal."}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-foreground-soft">Observaciones RR.HH. / Administrador</span>
                  {request.reviewComment ? (
                    <div className="p-4 rounded-2xl border border-border bg-muted/40 text-sm leading-relaxed text-foreground">
                      {request.reviewComment}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 text-sm italic text-foreground-soft">
                      No hay comentarios u observaciones registradas por los revisores.
                    </div>
                  )}
                  {isReviewed && request.approvedAt && (
                    <p className="text-xs text-foreground-soft mt-1.5 flex items-center gap-1">
                      <UserCheck className="size-3.5 text-emerald-500" />
                      <span>
                        Resuelto por <strong className="font-semibold text-foreground">{approverLabel || "Aprobador del Sistema"}</strong> el {formatDateTime(request.approvedAt)}
                      </span>
                    </p>
                  )}
                </div>

                {additionalComment ? (
                  <div className="space-y-2 border-t border-border/50 pt-5">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-foreground-soft">Comentario adicional del Trabajador</span>
                    <p className="text-sm leading-relaxed text-foreground p-4 bg-muted/40 rounded-2xl">{additionalComment}</p>
                  </div>
                ) : null}
              </Card>

              {/* Timeline Card */}
              <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-5">
                <SectionTitle icon={Clock3}>Línea de tiempo de la solicitud</SectionTitle>
                <RequestTimeline history={request.reviewHistory} />
              </Card>
            </div>
          ) : null}

          {/* ── Tab Content: Documentos ───────────────────────────── */}
          {currentTab === "documents" ? (
            <div className="space-y-6">
              {/* Formal Document Section */}
              <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-4">
                <SectionTitle icon={FileText}>Documento Formal Generado</SectionTitle>
                {formalDoc ? (
                  <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between shadow-2xs">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card border border-border text-primary shadow-3xs">
                        <FileText className="size-6" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-bold text-foreground" title={formalDoc.name}>
                          {formalDoc.name === "generated_request_document" ? "Documento de solicitud firmado" : formalDoc.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xs font-bold uppercase tracking-wider text-foreground-soft bg-muted px-2 py-0.5 rounded border border-border">
                            {formalDoc.documentType || "PDF"}
                          </span>
                          {formalDoc.createdAt && (
                            <span className="text-2xs text-foreground-soft">
                              Generado: {formatDateTime(formalDoc.createdAt)}
                            </span>
                          )}
                          <DocumentStatusBadge status={formalDoc.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {formalDoc.url ? (
                        <a
                          href={formalDoc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-bold text-primary hover:bg-muted hover:border-primary/50 transition focus:outline-none"
                        >
                          <Download className="mr-2 size-3.5" />
                          Abrir / Descargar
                        </a>
                      ) : null}
                      {!formalDoc.status?.toLowerCase().includes("signed") ? (
                        <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition shadow-sm focus:outline-none">
                          <UploadCloud className="mr-2 size-3.5" />
                          Subir firmado
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadSignedDocumentMutation.mutateAsync(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-4 py-8 text-center text-sm text-foreground-soft">
                      <FileIcon className="mx-auto size-10 text-muted-foreground/50 mb-2" />
                      <p className="font-medium text-foreground">Aún no se ha generado el documento formal para esta solicitud.</p>
                      <p className="text-xs text-foreground-soft mt-1">El documento formal recopila los datos y firmas para la aprobación oficial.</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full h-11 justify-center rounded-xl border border-primary/20 text-primary hover:border-primary hover:bg-primary/[0.02]"
                      onClick={() => void generateDocumentMutation.mutateAsync()}
                      disabled={generateDocumentMutation.isPending}
                    >
                      <FileText className="mr-2 size-4" />
                      Generar documento de solicitud
                    </Button>
                  </div>
                )}
              </Card>

              {/* Attachments Section */}
              <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-4">
                <SectionTitle
                  icon={Paperclip}
                  action={
                    <span className="rounded-full bg-muted border border-border px-3 py-1 text-2xs font-bold text-foreground-soft">
                      {request.attachments.length} archivo(s)
                    </span>
                  }
                >
                  Adjuntos del trabajador
                </SectionTitle>

                {!request.attachments.length ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-4 py-8 text-center text-sm text-foreground-soft">
                    <Paperclip className="mx-auto size-10 text-muted-foreground/50 mb-2" />
                    <p className="font-medium text-foreground">Esta solicitud no registra documentos adjuntos o evidencias.</p>
                    <p className="text-xs text-foreground-soft mt-1">El trabajador no adjuntó ningún archivo complementario.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {request.attachments.map((attachment) => {
                      const AttachmentIcon = getAttachmentIcon(attachment);
                      return (
                        <div
                          key={attachment.id}
                          className="flex flex-col justify-between rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 p-4 transition shadow-2xs"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {attachment.isImage && attachment.url ? (
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(attachment)}
                                className="overflow-hidden rounded-xl border border-border bg-card shrink-0 shadow-3xs"
                              >
                                <Image unoptimized width={200} height={200} src={attachment.url} alt={attachment.name} className="size-14 object-cover" />
                              </button>
                            ) : (
                              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground shadow-3xs">
                                <AttachmentIcon className="size-6" />
                              </div>
                            )}
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-sm font-bold text-foreground" title={attachment.name}>
                                {attachment.name === "generated_request_document" ? "Adjunto de solicitud" : attachment.name}
                              </p>
                              <p className="text-2xs text-foreground-soft">
                                {formatFileSize(attachment.fileSize)}
                                {attachment.createdAt ? ` · ${formatDateTime(attachment.createdAt)}` : ""}
                              </p>
                              {attachment.uploadedByName ? (
                                <p className="text-2xs font-semibold text-primary">Subido por: {attachment.uploadedByName}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
                            {attachment.url ? (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-bold text-primary hover:border-primary/50 hover:bg-muted transition focus:outline-none"
                              >
                                <Download className="mr-1.5 size-3" />
                                Abrir
                              </a>
                            ) : null}
                            {canManageDocuments ? (
                              <Button
                                variant="ghost"
                                className="h-8 rounded-lg px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => void handleDeleteDocument(attachment.id)}
                                disabled={deletingDocumentId === attachment.id}
                              >
                                <Trash2 className="mr-1.5 size-3" />
                                Eliminar
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {canManageDocuments ? (
                  <div className="grid gap-4 rounded-2xl border border-dashed border-border bg-card/60 p-5 mt-4">
                    <div className="flex items-center gap-2">
                      <Plus className="size-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-foreground">Agregar más documentos de evidencia</p>
                        <p className="text-xs text-foreground-soft">Formatos: PDF, Word, Excel, JPG, PNG. Máx. 5 archivos.</p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "rounded-2xl border-2 border-dashed px-5 py-8 text-center transition cursor-pointer",
                        dragActive ? "border-primary bg-primary-soft/50" : "border-border bg-muted/30 hover:border-primary/40",
                      )}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        appendFiles(e.dataTransfer.files);
                      }}
                    >
                      <UploadCloud className="mx-auto size-10 text-primary/80 mb-1" />
                      <p className="text-sm font-bold text-foreground">Arrastra archivos aquí o haz clic para buscarlos</p>
                      <Input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        className="mt-4"
                        onChange={(e) => {
                          appendFiles(e.target.files ?? []);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>

                    {queuedPreviews.length ? (
                      <div className="grid gap-3">
                        {queuedPreviews.map(({ file, previewUrl }) => {
                          const QueuedIcon = getQueuedFileIcon(file);
                          return (
                            <div
                              key={`${file.name}-${file.size}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-4 shadow-2xs"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {previewUrl ? (
                                  <Image unoptimized width={100} height={100} src={previewUrl} alt={file.name} className="size-11 rounded-lg border border-border object-cover shrink-0" />
                                ) : (
                                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground">
                                    <QueuedIcon className="size-5" />
                                  </div>
                                )}
                                <div className="min-w-0 space-y-0.5">
                                  <p className="truncate text-sm font-bold text-foreground">{file.name}</p>
                                  <p className="text-2xs text-foreground-soft">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                className="h-8 rounded-lg px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setQueuedFiles((current) => current.filter((e) => !(e.name === file.name && e.size === file.size)))}
                                disabled={uploadDocumentsMutation.isPending}
                              >
                                <Trash2 className="mr-1.5 size-3.5" />
                                Quitar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border/50">
                      <Button 
                        variant="secondary" 
                        className="rounded-xl px-4 text-xs font-bold"
                        onClick={() => setQueuedFiles([])} 
                        disabled={!queuedFiles.length || uploadDocumentsMutation.isPending}
                      >
                        Limpiar cola
                      </Button>
                      <Button 
                        className="rounded-xl px-4 text-xs font-bold"
                        onClick={() => void handleUploadDocuments()} 
                        disabled={!queuedFiles.length || uploadDocumentsMutation.isPending}
                      >
                        Subir documentos
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          ) : null}

          {/* ── Tab Content: Historial ────────────────────────────── */}
          {currentTab === "history" ? (
            <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-6">
              <SectionTitle icon={History}>Historial de revisión</SectionTitle>
              <RequestTimeline history={request.reviewHistory} />
            </Card>
          ) : null}

          {/* ── Tab Content: Auditoría ────────────────────────────── */}
          {currentTab === "audit" ? (
            <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-6">
              <SectionTitle icon={ShieldCheck}>Registro y Auditoría del Sistema</SectionTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <div className="border-b border-border/50 pb-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-foreground-soft">Identificador Interno</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-mono text-xs text-foreground font-semibold break-all">{request.id}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(request.id);
                          setCopiedRequestId(true);
                          toast.success("ID de solicitud copiado.");
                          setTimeout(() => setCopiedRequestId(false), 2000);
                        }}
                        className="p-1 rounded bg-muted text-foreground-soft hover:text-foreground transition focus:outline-none"
                        title="Copiar ID"
                      >
                        {copiedRequestId ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-border/50 pb-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-foreground-soft">Origen de Registro</span>
                    <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted border border-border text-foreground-soft capitalize">
                      {request.source || "API Server"}
                    </span>
                  </div>

                  <div className="border-b border-border/50 pb-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-foreground-soft">Colaborador Solicitante</span>
                    <span className="block text-sm font-semibold text-foreground mt-1">{worker?.fullName}</span>
                    <span className="block text-xs text-foreground-soft font-mono">ID: {worker?.id || "N/D"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-border/50 pb-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-foreground-soft">Fecha de Creación</span>
                    <span className="block text-sm font-semibold text-foreground mt-1">{formatDateTime(request.createdAt)}</span>
                  </div>

                  <div className="border-b border-border/50 pb-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-foreground-soft">Última Modificación</span>
                    <span className="block text-sm font-semibold text-foreground mt-1">
                      {formatDateTime(request.updatedAt || request.createdAt)}
                    </span>
                  </div>

                  <div className="border-b border-border/50 pb-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-foreground-soft">Aprobado / Resuelto por</span>
                    <span className="block text-sm font-semibold text-foreground mt-1">
                      {approverLabel || "Pendiente de resolución"}
                    </span>
                    {request.approvedAt && (
                      <span className="block text-xs text-foreground-soft">Resuelto el {formatDateTime(request.approvedAt)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/30 border border-border p-4 space-y-2 mt-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-foreground-soft flex items-center gap-1.5">
                  <Info className="size-3.5 text-primary" />
                  Información Técnica Adicional
                </h5>
                <p className="text-xs text-foreground-soft leading-relaxed">
                  Esta solicitud ha sido procesada por la plataforma de administración. Los cambios de estado son irreversibles
                  y registran la dirección IP, el actor autenticado y la fecha exacta del servidor para fines de auditoría.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-foreground-soft/80 font-mono">
                  <span>Client Agent: Web Browser (Chrome/Firefox)</span>
                  <span>IP/Device Logs: Verificado por OAuth2</span>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Tab: Revisión */}
          {currentTab === "review" && hasReviewActions ? (
            <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm space-y-6">
              <SectionTitle icon={ShieldCheck}>Revisión de la solicitud</SectionTitle>
              <TextBlock label="Motivo del trabajador" value={request.reason} />
              <TextBlock label="Observaciones internas registradas" value={request.reviewComment} muted="Aún no hay observaciones internas." />
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl px-6 h-11 transition" onClick={() => setReviewState("approve")} disabled={isActionSubmitting}>
                  <CheckCircle2 className="mr-2 size-4" />
                  Aprobar
                </Button>
                <Button
                  className="border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 font-semibold rounded-2xl px-6 h-11 transition"
                  onClick={() => setReviewState("observe")}
                  disabled={isActionSubmitting}
                >
                  <Eye className="mr-2 size-4" />
                  Observar
                </Button>
                <Button variant="danger" className="font-semibold rounded-2xl px-6 h-11 transition" onClick={() => setReviewState("reject")} disabled={isActionSubmitting}>
                  <XCircle className="mr-2 size-4" />
                  Rechazar
                </Button>
              </div>
              <p className="text-xs text-foreground-soft leading-relaxed border-t border-border/50 pt-4 mt-2">
                Las decisiones quedan registradas en el historial con tu usuario, fecha y comentario para mantener la trazabilidad de la auditoría interna.
              </p>
            </Card>
          ) : null}
        </div>

        {/* ── Sidebar: 4 columnas (Perfil y Datos) ───────────────── */}
        <aside className="xl:col-span-4 space-y-6 lg:sticky lg:top-6">
          
          {/* Card del Perfil del Trabajador */}
          <Card className="p-6 border border-border/85 rounded-3xl bg-card shadow-sm space-y-6">
            <SectionTitle icon={UserRound}>Perfil del Trabajador</SectionTitle>
            
            <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-border/40">
              <UserAvatar 
                src={getProfileImageUrl(worker)} 
                fullName={worker?.fullName} 
                size="hero" 
                rounded="2xl"
                className="shadow-md border border-border/40 ring-4 ring-primary/5"
              />
              <div className="space-y-1 w-full min-w-0">
                <p className="truncate text-base font-extrabold text-foreground tracking-tight" title={worker?.fullName}>
                  {worker?.fullName}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-foreground-soft font-bold bg-muted border border-border px-3 py-1 rounded-xl">
                  <Briefcase className="size-3 text-primary/75" />
                  {worker?.position || "Cargo pendiente de asignación"}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-foreground-soft font-bold">
                  <FileText className="size-4 shrink-0 text-primary/75" />
                  <span>Código de Trabajador</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-foreground font-semibold bg-muted px-2 py-0.5 rounded border border-border">
                    {formatEmployeeCode(worker?.employeeCode)}
                  </span>
                  {worker?.employeeCode && (
                    <button
                      onClick={() => handleCopyWorkerCode(worker.employeeCode)}
                      className="p-1 rounded text-foreground-soft hover:bg-muted hover:text-foreground transition focus:outline-none"
                      title="Copiar código de trabajador"
                    >
                      {copiedWorkerCode ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {worker?.email && (
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-foreground-soft font-bold">
                    <Mail className="size-4 shrink-0 text-primary/75" />
                    <span>Correo</span>
                  </div>
                  <a href={`mailto:${worker.email}`} className="text-right text-primary font-semibold truncate hover:underline max-w-[60%]" title={worker.email}>
                    {worker.email}
                  </a>
                </div>
              )}

              {worker?.phone && (
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-foreground-soft font-bold">
                    <Phone className="size-4 shrink-0 text-primary/75" />
                    <span>Teléfono</span>
                  </div>
                  <a href={`tel:${worker.phone}`} className="text-right text-foreground hover:text-primary font-semibold transition">
                    {worker.phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Card de Datos Clave de la Solicitud */}
          <Card className="p-6 border border-border/85 rounded-3xl bg-card shadow-sm space-y-4">
            <SectionTitle icon={CalendarDays}>Datos Clave</SectionTitle>
            
            <div className="grid gap-3 pt-2">
              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Tipo</span>
                <span className="font-semibold text-foreground bg-primary/5 dark:bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/10">
                  {translateRequestType(request.typeName)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Estado</span>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border",
                  statusBg, statusTextColor, statusBorderColor
                )}>
                  {statusLabelText}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Desde</span>
                <span className="font-semibold text-foreground">{getRequestDisplayStartDate(request)}</span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Hasta</span>
                <span className="font-semibold text-foreground">
                  {getRequestDisplayEndDate(request) || "No definido"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Días Solicitados</span>
                <span className="font-extrabold text-primary text-base">
                  {request.daysRequested ? `${request.daysRequested} día(s)` : "No informado"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Creada</span>
                <span className="font-semibold text-foreground-soft text-xs">{formatDateTime(request.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">Actualizada</span>
                <span className="font-semibold text-foreground-soft text-xs">
                  {formatDateTime(request.updatedAt ?? request.createdAt)}
                </span>
              </div>

              {isReviewed && (
                <div className="mt-2 p-3 bg-muted/30 border border-border rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase tracking-wider text-foreground-soft">Revisado por</span>
                    <span className="font-bold text-foreground">{approverLabel || "Sistema"}</span>
                  </div>
                  {request.approvedAt && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold uppercase tracking-wider text-foreground-soft">Fecha</span>
                      <span className="font-semibold text-foreground-soft">{formatDateTime(request.approvedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Card de Accesos Rápidos */}
          <Card className="p-6 border border-border/85 rounded-3xl bg-card shadow-sm space-y-4">
            <SectionTitle icon={Download}>Acciones Rápidas</SectionTitle>
            
            <div className="flex flex-col gap-2.5 pt-2">
              {formalDoc?.url ? (
                <a
                  href={formalDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-primary hover:bg-muted hover:border-primary/50 transition focus:outline-none"
                >
                  <FileText className="size-4 text-primary/80" />
                  Ver documento formal
                </a>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full h-11 justify-center rounded-2xl border border-primary/20 text-primary hover:border-primary/50 hover:bg-primary/[0.01]"
                  onClick={() => void generateDocumentMutation.mutateAsync()}
                  disabled={generateDocumentMutation.isPending}
                >
                  <FileText className="mr-2 size-4" />
                  Generar documento
                </Button>
              )}
              
              <Button
                variant="secondary"
                className="w-full h-11 justify-center rounded-2xl border border-border bg-card text-foreground hover:bg-muted transition"
                onClick={() => setActiveTab("documents")}
              >
                <Paperclip className="mr-2 size-4 text-foreground-soft" />
                Abrir adjuntos ({request.attachments.length})
              </Button>

              <Button
                variant="ghost"
                className="w-full h-11 justify-center rounded-2xl text-foreground-soft hover:bg-muted hover:text-foreground transition"
                onClick={() => {
                  navigator.clipboard.writeText(request.code);
                  toast.success("Código de solicitud copiado.");
                }}
              >
                <Copy className="mr-2 size-4" />
                Copiar código de solicitud
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* ── Review modal ───────────────────────────────────────── */}
      <RequestReviewModal
        key={`${reviewState ?? "closed"}-${request.id}`}
        isOpen={Boolean(reviewState)}
        action={reviewState}
        request={request}
        isSubmitting={reviewMutation.isPending}
        onClose={() => setReviewState(null)}
        onConfirm={handleReviewConfirm}
      />

      {/* ── Image preview ──────────────────────────────────────── */}
      {previewAttachment?.isImage ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <button type="button" className="absolute inset-0" aria-label="Cerrar vista previa" onClick={() => setPreviewAttachment(null)} />
          <div className="relative z-10 max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-sm font-semibold">{previewAttachment.name}</p>
                <p className="text-xs text-slate-300">
                  {previewAttachment.fileSize ? formatFileSize(previewAttachment.fileSize) : formatDate(previewAttachment.createdAt)}
                </p>
              </div>
              <Button variant="ghost" className="size-10 rounded-2xl px-0 text-white hover:bg-card/10 hover:text-white" onClick={() => setPreviewAttachment(null)}>
                <X className="size-5" />
              </Button>
            </div>
            <Image unoptimized width={400} height={400} src={previewAttachment.url} alt={previewAttachment.name} className="max-h-[78vh] w-full object-contain" />
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
