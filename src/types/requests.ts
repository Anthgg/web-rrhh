export type RequestStatus =
  | "draft"
  | "pending"
  | "pending_supervisor"
  | "pending_rrhh"
  | "observed"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "resubmitted"
  | "unknown";

export type RequestReviewDecision = "approve" | "observe" | "reject";

export type RequestReviewAction = RequestReviewDecision | "cancel" | "resubmit";

export type RequestScope = "my" | "company" | "pending";

export type RequestDatePreset = "all" | "today" | "week" | "month" | "custom";

export type RequestSortOption = "newest" | "oldest" | "status" | "type" | "startDate";

export type RequestSectionKey =
 | "my-requests"
 | "new-request"
 | "pending-requests"
 | "reports"
 | "templates";

export type RequestTemplateStatus = "active" | "inactive";

export type RequestTemplateFormat = "word" | "pdf" | "excel";

export type RequestReportDownloadFormat = "xlsx" | "pdf" | "csv";

export type RequestTimelineAction =
 | "created"
 | "updated"
 | "submitted"
 | "approved"
 | "observed"
 | "rejected"
 | "cancelled"
 | "resubmitted"
 | "commented"
 | "unknown";

/**
 * Canonical leave categories sent as `type` in POST /api/requests.
 * PERSONAL_PERMISSION is a legacy alias — always normalise to UNPAID_LEAVE.
 */
export type LeaveRequestType = "VACATION" | "MEDICAL_LEAVE" | "UNPAID_LEAVE";

/** Map a raw backend code/type to the canonical LeaveRequestType */
export function normalizeLeaveType(raw: unknown): LeaveRequestType | undefined {
  if (typeof raw !== "string") return undefined;
  const up = raw.toUpperCase().trim();
  if (up === "VACATION" || up === "VACACIONES") return "VACATION";
  if (up === "MEDICAL_LEAVE" || up === "DESCANSO_MEDICO" || up === "MEDICAL") return "MEDICAL_LEAVE";
  if (
    up === "UNPAID_LEAVE" ||
    up === "PERSONAL_PERMISSION" ||
    up === "PERMISO_PERSONAL" ||
    up === "UNPAID"
  )
    return "UNPAID_LEAVE";
  return undefined;
}

export interface RequestType {
  id: string;
  code?: string;
  /** Canonical leave category — present only for leave-related request types */
  type?: LeaveRequestType;
  name: string;
  description?: string;
  active: boolean;
  requiresEndDate?: boolean;
  allowsAttachment?: boolean;
}

export interface RequestAttachment {
 id: string;
 name: string;
 url: string;
 mimeType?: string;
 fileSize?: number;
 status?: string;
 createdAt?: string;
 documentType?: string;
 uploadedByName?: string;
 isImage: boolean;
}

export interface RequestUserSummary {
  id?: string;
  fullName: string;
  email?: string;
  department?: string;
  position?: string;
  project?: string;
  avatarUrl?: string;
  employeeCode?: string;
  phone?: string;
  departmentName?: string;
  areaName?: string;
  projectName?: string;
  workLocationName?: string;
  positionName?: string;
  status?: string;
}

export interface RequestReviewHistoryItem {
 id: string;
 action: RequestTimelineAction;
 actionLabel: string;
 actorName: string;
 actorRole?: string;
 actorAvatarUrl?: string;
 comment?: string;
 createdAt: string;
}

export interface VacationBalanceSnapshot {
  availableDaysAtRequest: number;
  requestedDays: number;
  projectedAvailableDays: number;
  exceedsAvailableBalance: boolean;
  requiresManagerOverride: boolean;
}

export interface RequestItem {
  id: string;
  code: string;
  workerId?: string;
  requestTypeId?: string;
  typeName: string;
  status: RequestStatus;
  statusLabel?: string;
  requester: RequestUserSummary;
 reason: string;
 reviewComment?: string;
 approvedBy?: string;
 approvedAt?: string;
 createdAt: string;
 updatedAt?: string;
 submittedAt?: string;
 startDate?: string;
 endDate?: string;
 daysRequested?: number;
 attachmentsCount: number;
 canEdit: boolean;
 canCancel: boolean;
 canReview: boolean;
 canResubmit: boolean;
 source: "api" | "mock";
 requiresBalanceOverride?: boolean;
 vacationBalance?: VacationBalanceSnapshot;
 startCalendarDateTime?: string;
 endCalendarDateTime?: string;
 startCalendarDate?: string;
 endCalendarDate?: string;
 startDisplayDate?: string;
 endDisplayDate?: string;
 startDateKey?: string;
 endDateKey?: string;
 start_date?: string;
 end_date?: string;
}

export interface RequestDetail extends RequestItem {
  attachments: RequestAttachment[];
  reviewHistory: RequestReviewHistoryItem[];
  metadata?: Record<string, string | number | boolean | null>;
  generatedRequestDocument?: RequestAttachment | null;
}

export interface RequestStats {
 total: number;
 pending: number;
 approved: number;
 rejected: number;
 observed: number;
 cancelled: number;
}

export interface RequestListFilters {
 search?: string;
 status?: RequestStatus | "all";
 typeId?: string;
 submittedDatePreset?: RequestDatePreset;
 submittedDateFrom?: string;
 submittedDateTo?: string;
 startDateFrom?: string;
 startDateTo?: string;
 updatedDateFrom?: string;
 updatedDateTo?: string;
 sortBy?: RequestSortOption;
 page?: number;
 pageSize?: number;
}

export interface CreateRequestPayload {
  requestTypeId: string;
  startDate: string;
  endDate?: string;
  reason: string;
  documents?: File[];
}

/**
 * NOTE: The form always sends `requestTypeId` (the UUID from the catalog).
 * The `type`/`code` fields on RequestType are used ONLY for UI decisions:
 * - Showing the vacation balance card
 * - Requiring an end date
 * - Applying status colors and labels
 * Do NOT send both `requestTypeId` and `type` in the same payload.
 */

export interface UpdateRequestPayload {
 requestTypeId?: string;
 startDate?: string;
 endDate?: string;
 reason?: string;
 documents?: File[];
}

export interface ReviewRequestPayload {
 action: RequestReviewDecision;
 reason?: string;
}

export interface ResubmitRequestPayload {
 reason?: string;
 startDate?: string;
 endDate?: string;
}

export interface UploadRequestDocumentsPayload {
 documents: File[];
 documentType?: string;
}

export interface PaginatedRequestsResponse {
 items: RequestItem[];
 total: number;
 page: number;
 pageSize: number;
 totalPages?: number;
 source: "api" | "mock";
}

export interface RequestReportColumn {
 id: string;
 label: string;
 description?: string;
 defaultSelected?: boolean;
}

export interface RequestReportFilters {
 dateFrom?: string;
 dateTo?: string;
 typeId?: string;
 status?: RequestStatus | "all";
 worker?: string;
 department?: string;
 company?: string;
 approver?: string;
 search?: string;
 page?: number;
 pageSize?: number;
}

export interface RequestReportRow {
 id: string;
 values: Record<string, string>;
 source: "api" | "mock";
}

export interface PaginatedRequestReportRowsResponse {
 items: RequestReportRow[];
 total: number;
 page: number;
 pageSize: number;
 totalPages?: number;
 source: "api" | "mock";
}

export interface RequestTemplateItem {
 id: string;
 name: string;
 description: string;
 requestType: string;
 formats: RequestTemplateFormat[];
 updatedAt: string;
 status: RequestTemplateStatus;
 downloadUrl?: string;
}

export interface RequestsNavigationItem {
 key: RequestSectionKey;
 label: string;
 description: string;
 href: string;
 badge?: string;
}
