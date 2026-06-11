import {
 compareAsc,
 compareDesc,
 endOfDay,
 endOfMonth,
 endOfWeek,
 isValid,
 parseISO,
 startOfDay,
 startOfMonth,
 startOfWeek,
 format,
} from "date-fns";

import type { UserRole } from "@/types";
import type {
 RequestDatePreset,
 RequestItem,
 RequestListFilters,
 RequestReviewDecision,
 RequestScope,
 RequestSortOption,
 RequestStatus,
 RequestStats,
} from "@/types/requests";

export const requestStatusLabels: Record<RequestStatus, string> = {
 draft: "Borrador",
 pending: "Pendiente",
 approved: "Aprobado",
 observed: "Observado",
 rejected: "Rechazado",
 cancelled: "Cancelada",
 resubmitted: "Reenviada",
 unknown: "No definida",
};

export const requestReviewDecisionLabels: Record<RequestReviewDecision, string> = {
 approve: "Aprobar",
 observe: "Observar",
 reject: "Rechazar",
};

export const requestSortLabels: Record<RequestSortOption, string> = {
 newest: "Más recientes",
 oldest: "Más antiguas",
 status: "Estado",
 type: "Tipo de solicitud",
 startDate: "Fecha de inicio",
};

export const requestDatePresetLabels: Record<RequestDatePreset, string> = {
 all: "Todas",
 today: "Hoy",
 week: "Esta semana",
 month: "Este mes",
 custom: "Rango personalizado",
};

export const requestStatusOptions: Array<{ value: RequestStatus | "all"; label: string }> = [
 { value: "all", label: "Todas" },
 { value: "pending", label: "Pendientes" },
 { value: "approved", label: "Aprobadas" },
 { value: "rejected", label: "Rechazadas" },
 { value: "observed", label: "Observadas" },
 { value: "cancelled", label: "Canceladas" },
 { value: "resubmitted", label: "Reenviadas" },
];

export const requestPageSizeOptions = [10, 20, 50] as const;

export const requestDefaultStats: RequestStats = {
 total: 0,
 pending: 0,
 approved: 0,
 rejected: 0,
 observed: 0,
 cancelled: 0,
};

export function isAdminRequestManager(role?: UserRole | null) {
 return role === "admin" || role === "super_admin" || role === "hr" || role === "supervisor";
}

export function getRequestScopeLabel(scope: RequestScope) {
 if (scope === "my") return "Mis solicitudes";
 if (scope === "pending") return "Pendientes de revisión";
 return "Todas las solicitudes";
}

function formatDateToQuery(value: Date) {
 return format(value, "yyyy-MM-dd");
}

function parseDate(value?: string) {
 if (!value) return null;
 const parsed = parseISO(value);
 return isValid(parsed) ? parsed : null;
}

function resolveSubmittedDateRange(preset: RequestDatePreset | undefined) {
 const now = new Date();

 if (preset === "today") {
 return {
 from: formatDateToQuery(startOfDay(now)),
 to: formatDateToQuery(endOfDay(now)),
 };
 }

 if (preset === "week") {
 return {
 from: formatDateToQuery(startOfWeek(now, { weekStartsOn: 1 })),
 to: formatDateToQuery(endOfWeek(now, { weekStartsOn: 1 })),
 };
 }

 if (preset === "month") {
 return {
 from: formatDateToQuery(startOfMonth(now)),
 to: formatDateToQuery(endOfMonth(now)),
 };
 }

 return {
 from: undefined,
 to: undefined,
 };
}

export function buildRequestQueryFilters(filters: RequestListFilters) {
 const presetRange =
 filters.submittedDatePreset && filters.submittedDatePreset !== "all" && filters.submittedDatePreset !== "custom"
 ? resolveSubmittedDateRange(filters.submittedDatePreset)
 : { from: undefined, to: undefined };

 return {
 page: filters.page,
 limit: filters.pageSize,
 search: filters.search?.trim() || undefined,
 status: filters.status && filters.status !== "all" ? filters.status : undefined,
 requestTypeId: filters.typeId || undefined,
 submittedDatePreset:
 filters.submittedDatePreset && filters.submittedDatePreset !== "all"
 ? filters.submittedDatePreset
 : undefined,
 submittedDateFrom: filters.submittedDateFrom || presetRange.from,
 submittedDateTo: filters.submittedDateTo || presetRange.to,
 startDateFrom: filters.startDateFrom || undefined,
 startDateTo: filters.startDateTo || undefined,
 updatedDateFrom: filters.updatedDateFrom || undefined,
 updatedDateTo: filters.updatedDateTo || undefined,
 sortBy: filters.sortBy || undefined,
 };
}

function isDateInsideRange(value: string | undefined, from?: string, to?: string) {
 if (!from && !to) return true;

 const date = parseDate(value);
 if (!date) return false;

 const fromDate = from ? parseDate(from) : null;
 const toDate = to ? parseDate(to) : null;

 if (fromDate && compareAsc(date, fromDate) < 0) return false;
 if (toDate && compareAsc(date, toDate) > 0) return false;
 return true;
}

function sortRequestItems(items: RequestItem[], sortBy: RequestSortOption | undefined) {
 const cloned = [...items];

 if (sortBy === "oldest") {
 return cloned.sort((left, right) => compareAsc(parseDate(left.createdAt) ?? 0, parseDate(right.createdAt) ?? 0));
 }

 if (sortBy === "status") {
 return cloned.sort((left, right) => requestStatusLabels[left.status].localeCompare(requestStatusLabels[right.status]));
 }

 if (sortBy === "type") {
 return cloned.sort((left, right) => left.typeName.localeCompare(right.typeName));
 }

 if (sortBy === "startDate") {
 return cloned.sort((left, right) =>
 compareAsc(parseDate(left.startDate) ?? parseDate(left.createdAt) ?? 0, parseDate(right.startDate) ?? parseDate(right.createdAt) ?? 0),
 );
 }

 return cloned.sort((left, right) => compareDesc(parseDate(left.createdAt) ?? 0, parseDate(right.createdAt) ?? 0));
}

export function applyRequestClientFilters(items: RequestItem[], filters: RequestListFilters) {
 const normalizedFilters = buildRequestQueryFilters(filters);
 const searchValue = normalizedFilters.search?.toLowerCase();

 const filtered = items.filter((item) => {
 if (
 searchValue &&
 ![
 item.code,
 item.typeName,
 item.requester.fullName,
 item.reason,
 ]
 .join(" ")
 .toLowerCase()
 .includes(searchValue)
 ) {
 return false;
 }

 if (normalizedFilters.status && item.status !== normalizedFilters.status) {
 return false;
 }

 if (filters.typeId && item.requestTypeId !== filters.typeId) {
 return false;
 }

 if (
 !isDateInsideRange(
 item.submittedAt ?? item.createdAt,
 normalizedFilters.submittedDateFrom,
 normalizedFilters.submittedDateTo,
 )
 ) {
 return false;
 }

 if (!isDateInsideRange(item.startDate, normalizedFilters.startDateFrom, normalizedFilters.startDateTo)) {
 return false;
 }

 if (!isDateInsideRange(item.updatedAt, normalizedFilters.updatedDateFrom, normalizedFilters.updatedDateTo)) {
 return false;
 }

 return true;
 });

 return sortRequestItems(filtered, filters.sortBy);
}
