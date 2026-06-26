import { formatDate, formatDateTime } from "@/lib/utils/format";
import { requestStatusLabels } from "@/lib/utils/requests";
import type { RequestReportColumn, RequestReportRow } from "@/types/requests";

type ReportRecord = Record<string, unknown>;

type RequestReportColumnDefinition = {
 label: string;
 getValue: (row: RequestReportRow) => string;
};

const emptyValue = "-";

const legacyColumnKeyMap: Record<string, string> = {
 Trabajador: "worker_name",
 "Tipo de Solicitud": "type",
 "Tipo de solicitud": "type",
 Estado: "status",
 "Fecha Inicio": "start_date",
 "Fecha inicio": "start_date",
 "Fecha Fin": "end_date",
 "Fecha fin": "end_date",
 "Fecha Creación": "created_at",
 "Fecha Creacion": "created_at",
 "Fecha de creación": "created_at",
 "Fecha de creacion": "created_at",
 "Aprobado Por": "approver",
 "Aprobado por": "approver",
 "Días Solicitados": "days_requested",
 "Dias Solicitados": "days_requested",
 "Días solicitados": "days_requested",
 "Dias solicitados": "days_requested",
 Motivo: "reason",
 "Área/Departamento": "department",
 "Area/Departamento": "department",
 Puesto: "position",
 Cargo: "position",
};

const columnAliasMap: Record<string, string> = {
 workerName: "worker_name",
 worker_name: "worker_name",
 fullName: "worker_name",
 full_name: "worker_name",
 requestType: "type",
 request_type: "type",
 typeName: "type",
 type_name: "type",
 request_type_name: "type",
 startDate: "start_date",
 start_date: "start_date",
 fecha_inicio: "start_date",
 endDate: "end_date",
 end_date: "end_date",
 fecha_fin: "end_date",
 createdAt: "created_at",
 created_at: "created_at",
 createdDate: "created_at",
 created_date: "created_at",
 approvedBy: "approver",
 approved_by: "approver",
 approverName: "approver",
 approver_name: "approver",
 requestedDays: "days_requested",
 requested_days: "days_requested",
 daysRequested: "days_requested",
 days_requested: "days_requested",
 days: "days_requested",
 areaDepartment: "department",
 area_department: "department",
 areaName: "department",
 area_name: "department",
 departmentName: "department",
 department_name: "department",
 jobTitle: "position",
 job_title: "position",
 positionName: "position",
 position_name: "position",
 requestCode: "code",
 request_code: "code",
 code: "code",
 dni: "dni",
 workerComment: "worker_comment",
 worker_comment: "worker_comment",
 reviewComment: "review_comment",
 review_comment: "review_comment",
 approvedAt: "approved_at",
 approved_at: "approved_at",
 attachments: "attachments",
};

function isRecord(value: unknown): value is ReportRecord {
 return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getObjectValue(source: unknown, path: string) {
 if (!isRecord(source)) return null;

 return path.split(".").reduce<unknown>((current, segment) => {
 if (!isRecord(current)) return null;
 return current[segment] ?? null;
 }, source);
}

function valueToString(value: unknown) {
 if (value === null || value === undefined || value === "") return null;
 if (typeof value === "string") return value.trim() || null;
 if (typeof value === "number" || typeof value === "boolean") return String(value);
 return null;
}

function firstValue(row: RequestReportRow, paths: string[]) {
 for (const path of paths) {
 const fromValues = valueToString(row.values?.[path]);
 if (fromValues) return fromValues;

 const fromRow = valueToString(getObjectValue(row, path));
 if (fromRow) return fromRow;
 }

 return emptyValue;
}

function formatStatus(value: string) {
 if (!value || value === emptyValue) return emptyValue;
 const normalizedStatus = value.trim().toLowerCase();
 return requestStatusLabels[normalizedStatus as keyof typeof requestStatusLabels] ?? value;
}

function formatDateValue(value: string, withTime = false) {
  if (!value || value === emptyValue) return emptyValue;
  
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match && !withTime) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return emptyValue;
  const formatted = withTime ? formatDateTime(value) : formatDate(value);
  return formatted === "Invalid Date" || formatted === value ? emptyValue : formatted;
}

export const requestReportColumnMap: Record<string, RequestReportColumnDefinition> = {
 code: {
 label: "Codigo de solicitud",
 getValue: (row) => firstValue(row, ["code", "requestCode", "request_code", "id"]),
 },
 worker_name: {
 label: "Trabajador",
 getValue: (row) =>
 firstValue(row, [
 "worker_name",
 "workerName",
 "worker.fullName",
 "worker.full_name",
 "user.fullName",
 "user.full_name",
 "fullName",
 "full_name",
 ]),
 },
 dni: {
 label: "DNI",
 getValue: (row) => firstValue(row, ["dni", "worker.dni", "user.dni", "documentNumber", "document_number"]),
 },
 department: {
 label: "Area/Departamento",
 getValue: (row) =>
 firstValue(row, [
 "department",
 "areaDepartment",
 "area_department",
 "areaName",
 "area_name",
 "departmentName",
 "department_name",
 "area.name",
 "department.name",
 ]),
 },
 position: {
 label: "Puesto",
 getValue: (row) =>
 firstValue(row, [
 "position",
 "positionName",
 "position_name",
 "jobTitle",
 "job_title",
 "position.name",
 "worker.position.name",
 ]),
 },
 type: {
 label: "Tipo de solicitud",
 getValue: (row) =>
 firstValue(row, [
 "type",
 "requestType",
 "request_type",
 "typeName",
 "type_name",
 "type.name",
 "request_type_name",
 ]),
 },
 created_at: {
 label: "Fecha creacion",
 getValue: (row) =>
 formatDateValue(firstValue(row, ["created_at", "createdAt", "createdDate", "created_date"]), true),
 },
  start_date: {
  label: "Fecha inicio",
  getValue: (row) => {
    const disp = firstValue(row, ["startDisplayDate", "start_display_date"]);
    if (disp && disp !== emptyValue) return disp;
    const val = firstValue(row, ["startCalendarDate", "start_calendar_date", "startDateKey", "start_date_key", "startDate", "start_date", "fecha_inicio"]);
    return formatDateValue(val);
  },
  },
  end_date: {
  label: "Fecha fin",
  getValue: (row) => {
    const disp = firstValue(row, ["endDisplayDate", "end_display_date"]);
    if (disp && disp !== emptyValue) return disp;
    const val = firstValue(row, ["endCalendarDate", "end_calendar_date", "endDateKey", "end_date_key", "endDate", "end_date", "fecha_fin"]);
    return formatDateValue(val);
  },
  },
 days_requested: {
 label: "Dias solicitados",
 getValue: (row) =>
 firstValue(row, ["days_requested", "requestedDays", "requested_days", "daysRequested", "days"]),
 },
 status: {
 label: "Estado",
 getValue: (row) =>
 formatStatus(firstValue(row, ["statusLabel", "status_label", "statusName", "status_name", "status"])),
 },
 reason: {
 label: "Motivo",
 getValue: (row) => firstValue(row, ["reason", "reason_text", "motive", "motivo", "description"]),
 },
 worker_comment: {
 label: "Comentario del trabajador",
 getValue: (row) => firstValue(row, ["worker_comment", "workerComment", "comment", "worker.comment"]),
 },
 review_comment: {
 label: "Respuesta de RR.HH.",
 getValue: (row) => firstValue(row, ["review_comment", "reviewComment", "review.comment", "response"]),
 },
 approver: {
 label: "Aprobado por",
 getValue: (row) =>
 firstValue(row, [
 "approver",
 "approvedBy",
 "approved_by",
 "approverName",
 "approver_name",
 "approver.fullName",
 "approver.full_name",
 ]),
 },
 approved_at: {
 label: "Fecha de aprobacion",
 getValue: (row) => formatDateValue(firstValue(row, ["approved_at", "approvedAt"]), true),
 },
 attachments: {
 label: "Documentos adjuntos",
 getValue: (row) => firstValue(row, ["attachments", "documentsCount", "documents_count"]),
 },
};

export function getCanonicalKey(key: string): string {
  const clean = key.trim();
  
  if (["code", "requestCode", "request_code"].includes(clean)) return "code";
  
  if ([
    "worker_name", "workerName", "worker.fullName", "full_name", "fullName", 
    "Trabajador", "worker.full_name", "user.fullName", "user.full_name"
  ].includes(clean)) return "worker_name";
  
  if (["dni", "DNI", "worker.dni", "user.dni", "documentNumber", "document_number"].includes(clean)) return "dni";
  
  if ([
    "department", "department_name", "area_department", "areaDepartment", 
    "area.name", "department.name", "areaName", "area_name", 
    "Área/Departamento", "Area/Departamento"
  ].includes(clean)) return "department";
  
  if ([
    "position", "job_title", "position.name", "jobTitle", "job_title", 
    "positionName", "position_name", "Puesto", "Cargo", "worker.position.name"
  ].includes(clean)) return "position";
  
  if ([
    "type", "request_type", "requestType", "type.name", "typeName", 
    "type_name", "request_type_name", "Tipo de Solicitud", "Tipo de solicitud"
  ].includes(clean)) return "type";
  
  if ([
    "created_at", "createdAt", "createdDate", "created_date", 
    "Fecha Creación", "Fecha Creacion", "Fecha de creación", "Fecha de creacion"
  ].includes(clean)) return "created_at";
  
  if (["start_date", "startDate", "fecha_inicio", "Fecha Inicio", "Fecha inicio"].includes(clean)) return "start_date";
  
  if (["end_date", "endDate", "fecha_fin", "Fecha Fin", "Fecha fin"].includes(clean)) return "end_date";
  
  if ([
    "days_requested", "requested_days", "requestedDays", "days", 
    "Días Solicitados", "Dias Solicitados", "Días solicitados", "Dias solicitados"
  ].includes(clean)) return "days_requested";
  
  if (["status", "Estado", "statusLabel", "status_label", "statusName", "status_name"].includes(clean)) return "status";
  
  if (["reason", "Motivo", "reason_text", "motive", "motivo", "description"].includes(clean)) return "reason";
  
  if (["worker_comment", "workerComment", "Comentario del trabajador", "comment", "worker.comment"].includes(clean)) return "worker_comment";
  
  if (["review_comment", "reviewComment", "Respuesta de RR.HH.", "review.comment", "response"].includes(clean)) return "review_comment";
  
  if ([
    "approver", "approved_by", "approvedBy", "approver.fullName", 
    "approver.full_name", "approverName", "approver_name", "Aprobado Por", "Aprobado por"
  ].includes(clean)) return "approver";
  
  if (["approved_at", "approvedAt", "Fecha de aprobacion"].includes(clean)) return "approved_at";
  
  if (["attachments", "Documentos adjuntos", "documentsCount", "documents_count"].includes(clean)) return "attachments";
  
  return clean;
}

export function resolveRequestReportColumnKey(column: string, availableColumns?: RequestReportColumn[]) {
  const canonicalTarget = getCanonicalKey(column);
  
  if (availableColumns?.length) {
    const matched = availableColumns.find((item) => getCanonicalKey(item.id) === canonicalTarget);
    if (matched) return matched.id;
  }
  
  return canonicalTarget;
}

export function normalizeRequestReportColumnSelection(
  columns: string[],
  availableColumns?: RequestReportColumn[],
) {
  const normalized = columns.map((column) => resolveRequestReportColumnKey(column, availableColumns));
  return Array.from(new Set(normalized));
}

export function getRequestReportColumnDefinition(column: RequestReportColumn) {
  const resolvedKey = resolveRequestReportColumnKey(column.id);
  return {
    ...column,
    label: requestReportColumnMap[resolvedKey]?.label ?? column.label,
  };
}

export function buildRequestReportPreviewRow(row: RequestReportRow, columns: string[]) {
  return Object.fromEntries(
    columns.map((column) => {
      const resolvedKey = resolveRequestReportColumnKey(column);
      const value = requestReportColumnMap[resolvedKey]?.getValue(row) ?? firstValue(row, [column, resolvedKey]);
      return [column, value || emptyValue];
    }),
  );
}
