export type RequestStatus =
  | "draft"
  | "pending"
  | "approved"
  | "observed"
  | "rejected"
  | "cancelled"
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

export interface RequestType {
  id: string;
  code?: string;
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
}

export interface RequestReviewHistoryItem {
  id: string;
  action: RequestTimelineAction;
  actionLabel: string;
  actorName: string;
  actorRole?: string;
  comment?: string;
  createdAt: string;
}

export interface RequestItem {
  id: string;
  code: string;
  workerId?: string;
  requestTypeId?: string;
  typeName: string;
  status: RequestStatus;
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
}

export interface RequestDetail extends RequestItem {
  attachments: RequestAttachment[];
  reviewHistory: RequestReviewHistoryItem[];
  metadata?: Record<string, string | number | boolean | null>;
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
