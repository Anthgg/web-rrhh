import type {
 DashboardEvent,
 DashboardMetric,
 DashboardSummary,
 DocumentRecord,
 PaginatedResponse,
 ReportRecord,
 PayrollPeriod,
 RequestRecord,
 RoleDefinition,
 SessionData,
 BirthdayWorker,
 UserProfile,
 UserRole,
 VisualPreferences,
 WorkerRecord,
 CrewWorkerItem,
 ProfileEditableFields,
 ProfileActivityItem,
 NormalizedProfileSecurity,
} from "@/types";
import type {
 RequestAttachment,
 RequestDetail,
 RequestItem,
 PaginatedRequestReportRowsResponse,
 RequestReportColumn,
 RequestReportRow,
 RequestReviewHistoryItem,
 RequestTemplateFormat,
 RequestTemplateItem,
 RequestTemplateStatus,
 RequestType as RequestTypeOption,
 RequestStatus as RequestModuleStatus,
 RequestTimelineAction,
} from "@/types/requests";
import type {
 ChartConfig,
 ReportChartResponse,
 ReportColumnKey,
 ReportPreviewResponse,
 ReportSummaryResponse,
 ReportTemplate,
} from "@/types/report.types";
import { isUuid } from "@/lib/api/worker-ids";
import { backendBaseUrl } from "@/lib/api/endpoints";

type LooseRecord = Record<string, unknown>;

const asRecord = (value: unknown): LooseRecord | null =>
 value && typeof value === "object" ? (value as LooseRecord) : null;

const readPath = (source: unknown, path: string): unknown => {
 return path.split(".").reduce<unknown>((accumulator, segment) => {
 const record = asRecord(accumulator);
 return record?.[segment];
 }, source);
};

const firstValue = (source: unknown, paths: string[]) => {
 for (const path of paths) {
 const value = readPath(source, path);
 if (value !== undefined && value !== null && value !== "") {
 return value;
 }
 }

 return undefined;
};

const asString = (value: unknown, fallback = "") => {
 if (typeof value === "string") return value;
 if (typeof value === "number") return String(value);
 return fallback;
};

const asBoolean = (value: unknown) => {
 if (typeof value === "boolean") return value;
 if (typeof value === "string") {
 if (value.toLowerCase() === "true") return true;
 if (value.toLowerCase() === "false") return false;
 }

 return null;
};

const asNumber = (value: unknown) => {
 if (typeof value === "number" && Number.isFinite(value)) return value;
 if (typeof value === "string" && value.trim() !== "") {
 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : null;
 }

 return null;
};


const asArray = (value: unknown) => (Array.isArray(value) ? value : []);

const cleanAvatarUrl = (url: unknown): string | null => {
 if (typeof url !== "string") return null;
 const trimmed = url.trim();
 if (!trimmed) return null;

 const lower = trimmed.toLowerCase();
 if (
 lower === "undefined" ||
 lower === "null" ||
 lower === "initials" ||
 lower === "fullname" ||
 lower === "email" ||
 lower === "documentnumber"
 ) {
 return null;
 }

 if (lower.includes("@") && lower.includes(".")) {
 return null;
 }
 if (/^\d+$/.test(trimmed)) {
 return null;
 }

 if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:") && !trimmed.startsWith("//")) {
 const baseUrl = backendBaseUrl.replace(/\/$/, "");
 const path = trimmed.replace(/^\//, "");
 return `${baseUrl}/${path}`;
 }

 return trimmed;
};

const DEFAULT_VISUAL_PREFERENCES: VisualPreferences = {
 theme: "system",
 density: "comfortable",
 accentColor: "green",
};

const allowedPreferenceValues = {
 theme: ["light", "dark", "system"],
 density: ["comfortable", "compact"],
 accentColor: ["green", "blue", "purple", "gray"],
} as const;

const isAllowedPreferenceValue = <K extends keyof VisualPreferences>(
 key: K,
 value: string,
): value is VisualPreferences[K] =>
 (allowedPreferenceValues[key] as readonly string[]).includes(value);

export function normalizeVisualPreferences(source: unknown): VisualPreferences | null {
 const record =
 asRecord(
 firstValue(source, [
 "preferences",
 "visualPreferences",
 "visual_preferences",
 "data.preferences",
 "data.visualPreferences",
 "data.visual_preferences",
 "data",
 ]),
 ) ?? asRecord(source);

 if (!record) return null;

 const rawTheme = asString(firstValue(record, ["theme"]));
 const rawDensity = asString(firstValue(record, ["density"]));
 const rawAccentColor = asString(firstValue(record, ["accentColor", "accent_color"]));

 if (!rawTheme && !rawDensity && !rawAccentColor) return null;

 return {
 theme: isAllowedPreferenceValue("theme", rawTheme) ? rawTheme : DEFAULT_VISUAL_PREFERENCES.theme,
 density: isAllowedPreferenceValue("density", rawDensity) ? rawDensity : DEFAULT_VISUAL_PREFERENCES.density,
 accentColor: isAllowedPreferenceValue("accentColor", rawAccentColor)
 ? rawAccentColor
 : DEFAULT_VISUAL_PREFERENCES.accentColor,
 };
}

const normalizeDateString = (value: unknown) => {
 const rawValue = asString(value);
 if (!rawValue) return "";

 const isoDate = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

 const date = new Date(rawValue);
 if (Number.isNaN(date.getTime())) return "";
 return date.toISOString().slice(0, 10);
};

const normalizeStatus = <T extends string>(
 value: unknown,
 allowedStatuses: readonly T[],
): T | "unknown" => {
 const normalized = asString(value).toLowerCase();
 return allowedStatuses.includes(normalized as T) ? (normalized as T) : "unknown";
};

export function normalizeRole(value: unknown): UserRole {
 const roleSource = asRecord(value);
 const normalized = asString(
 roleSource
 ? firstValue(roleSource, ["code", "name", "role", "label", "displayName", "display_name"])
 : value,
 )
 .toLowerCase()
 .trim();

 if (["super_admin", "super-admin", "superadmin", "root"].includes(normalized)) {
 return "super_admin";
 }
 if (["admin", "administrator", "administrador", "administrador del sistema"].includes(normalized)) return "admin";
 if (["rrhh", "rr.hh.", "hr", "human_resources", "human-resources", "recursos humanos"].includes(normalized)) return "hr";
 if (["supervisor", "lead"].includes(normalized)) return "supervisor";
 if (["worker", "trabajador", "colaborador", "employee"].includes(normalized)) return "worker";
 return "unknown";
}

export function normalizeUser(source: unknown): UserProfile {
 const record = asRecord(firstValue(source, ["data"])) ?? asRecord(source) ?? {};
 const roleValue =
 firstValue(record, [
 "role.code",
 "role.name",
 "role.label",
 "role",
 "rol.code",
 "rol.name",
 "rol",
 "system_role.code",
 "system_role.name",
 "systemRole.code",
 "systemRole.name",
 "role_code",
 "role_name",
 "data.role.code",
 "data.role.name",
 "data.role",
 ]) ??
 asArray(firstValue(record, ["roles", "data.roles"]))[0];
 const isActiveValue = asBoolean(
 firstValue(record, ["is_active", "isActive", "active", "profile.is_active", "profile.isActive"]),
 );

 const firstName = asString(firstValue(record, ["firstName", "first_name", "nombres"]));
 const lastName = asString(firstValue(record, ["lastName", "last_name", "apellidos"]));
 const fullName =
 asString(
 firstValue(record, [
 "fullName",
 "full_name",
 "name",
 "nombre_completo",
 "user.fullName",
 "user.full_name",
 ]),
 ) ||
 [firstName, lastName].filter(Boolean).join(" ") ||
 "No informado";

 const normalizedStatus = normalizeStatus(
 firstValue(record, ["status", "estado", "employment_status"]),
 ["active", "inactive", "on-leave"],
 );
 const normalizedRole = normalizeRole(roleValue);
 const { roleName, roleCode } = normalizeUserRole(record);
 const workerRecord = asRecord(firstValue(record, ["worker"])) ?? null;
 const rawWorkerId = firstValue(record, [
 "workerId",
 "worker_id",
 "worker.id",
 "worker.worker_id",
 "employeeId",
 "employee_id",
 "profile.worker_id",
 "data.worker_id",
 ]);
 const workerId = isUuid(rawWorkerId) ? rawWorkerId : undefined;
 const rawWorkerRecordId = workerRecord ? firstValue(workerRecord, ["id", "worker_id", "workerId"]) : null;
 const safeWorkerRecordId = isUuid(rawWorkerRecordId) ? rawWorkerRecordId : undefined;
 const finalWorkerId = workerId || safeWorkerRecordId;

 const worker = finalWorkerId
 ? {
 id: finalWorkerId,
 personal_id:
 asString(firstValue(record, ["worker.personal_id", "worker.personalId"])) ||
 undefined,
 department_id:
 asString(firstValue(record, ["worker.department_id", "worker.departmentId", "worker.internal_department_id", "worker.internalDepartmentId", "department_id", "departmentId", "internal_department_id"])) ||
 undefined,
 area_id:
 asString(firstValue(record, ["worker.area_id", "worker.areaId", "area_id", "areaId"])) ||
 undefined,
 position_id:
 asString(firstValue(record, ["worker.position_id", "worker.positionId", "worker.job_position_id", "worker.jobPositionId", "position_id", "positionId", "job_position_id"])) ||
 undefined,
 work_location_id:
 asString(firstValue(record, ["worker.work_location_id", "worker.workLocationId", "worker.work_location.id", "work_location_id", "workLocationId"])) ||
 undefined,
 crew_id:
 asString(firstValue(record, ["worker.crew_id", "worker.crewId", "worker.crew.id", "crew_id", "crewId"])) ||
 undefined,
 supervisor_id:
 asString(firstValue(record, ["worker.supervisor_id", "worker.supervisorId", "worker.supervisor.id", "supervisor_id", "supervisorId"])) ||
 undefined,
 position:
 asString(firstValue(record, ["worker.position", "worker.job_position_name", "worker.position_name"])) ||
 undefined,
 area_name:
 asString(firstValue(record, ["worker.area_name", "worker.area", "worker.department_name"])) ||
 undefined,
 department_name:
 asString(firstValue(record, ["worker.department_name", "worker.department"])) ||
 undefined,
 company_name:
 asString(firstValue(record, ["worker.company_name", "worker.company"])) ||
 undefined,
 address:
 asString(firstValue(record, ["worker.address", "worker.direccion", "address", "direccion"])) ||
 undefined,
 worker_type:
 asString(firstValue(record, ["worker.worker_type", "worker.workerType", "worker.type", "worker.tipo_trabajador", "worker_type", "workerType"])) ||
 undefined,
 branch_name:
 asString(firstValue(record, ["worker.branch_name", "worker.branch", "worker.sede_name"])) ||
 undefined,
 work_location_name:
 asString(firstValue(record, ["worker.work_location_name", "worker.workLocationName", "worker.work_location.name"])) ||
 undefined,
 crew_name:
 asString(firstValue(record, ["worker.crew_name", "worker.crew.name"])) ||
 undefined,
 supervisor_name:
 asString(firstValue(record, ["worker.supervisor_name", "worker.supervisor.name"])) ||
 undefined,
 status:
 asString(firstValue(record, ["worker.status", "worker.employment_status", "worker.labor_status"])) ||
 undefined,
 hire_date:
 asString(firstValue(record, ["worker.hire_date", "worker.hireDate", "worker.entry_date"])) ||
 undefined,
 attendance_radius:
 asNumber(firstValue(record, ["worker.attendance_radius", "worker.attendanceRadius", "worker.allowed_radius_meters", "attendance_radius", "attendanceRadius"])) ??
 undefined,
 emergency_contact_name:
 asString(firstValue(record, ["worker.emergency_contact_name", "worker.emergencyContactName", "emergencyContactName", "emergency_contact_name"])) ||
 undefined,
 emergency_contact_phone:
 asString(firstValue(record, ["worker.emergency_contact_phone", "worker.emergencyContactPhone", "emergencyContactPhone", "emergency_contact_phone"])) ||
 undefined,
 emergency_contact_relationship:
 asString(firstValue(record, ["worker.emergency_contact_relationship", "worker.emergencyContactRelationship", "emergencyContactRelationship", "emergency_contact_relationship"])) ||
 undefined,
 }
 : null;
 const supervisedCrewRecord = asRecord(firstValue(record, ["supervised_crew", "supervisedCrew"])) ?? null;
 const supervisedCrew = supervisedCrewRecord
 ? {
 id: asString(firstValue(record, ["supervised_crew.id", "supervisedCrew.id"]), ""),
 name: asString(firstValue(record, ["supervised_crew.name", "supervisedCrew.name"]), "Cuadrilla"),
 work_location_name:
 asString(
 firstValue(record, [
 "supervised_crew.work_location_name",
 "supervisedCrew.work_location_name",
 "supervisedCrew.workLocationName",
 ]),
 ) || undefined,
 }
 : null;
 const workerSource = firstValue(record, ["worker", "employee", "personal", "labor_record", "laborRecord"]);
 const position =
 asString(
 firstValue(record, [
 "position",
 "cargo",
 "jobTitle",
 "job_position_name",
 "position_name",
 "position.name",
 "job_position.name",
 "profile.position",
 "worker.position",
 "worker.cargo",
 "worker.jobTitle",
 "worker.job_position_name",
 "worker.position_name",
 "worker.position.name",
 "worker.job_position.name",
 "employee.position",
 "employee.job_position_name",
 ]),
 "",
 ) || "No informado";
 const project =
 asString(
 firstValue(record, [
 "project",
 "obra",
 "projectName",
 "project_name",
 "work_location_name",
 "workLocationName",
 "work_location.name",
 "workLocation.name",
 "current_location_name",
 "currentLocationName",
 "worker.project",
 "worker.obra",
 "worker.projectName",
 "worker.project_name",
 "worker.work_location_name",
 "worker.workLocationName",
 "worker.work_location.name",
 "worker.current_location_name",
 "employee.project",
 "employee.work_location_name",
 ]),
 ) || undefined;
 const department =
 asString(
 firstValue(record, [
 "department",
 "area",
 "department_name",
 "area_name",
 "internal_department_name",
 "department.name",
 "area.name",
 "worker.department",
 "worker.area",
 "worker.department_name",
 "worker.area_name",
 "worker.internal_department_name",
 "worker.department.name",
 "worker.area.name",
 "employee.department",
 "employee.area_name",
 ]),
 ) || undefined;
 const explicitHasWorkerRecord = asBoolean(
 firstValue(record, ["hasWorkerRecord", "has_worker_record", "linkedWorker", "linked_worker"]),
 );
 const hasWorkerRecord =
 explicitHasWorkerRecord ??
 Boolean(workerId || workerSource || position !== "No informado" || project || department);
 const permissionsByModule = asArray(firstValue(record, ["permissions_by_module", "permissionsByModule"]))
 .map((entry) => {
 const item = asRecord(entry);
 if (!item) return null;
 return {
 module: asString(firstValue(item, ["module", "name"]), "No informado"),
 access: asString(firstValue(item, ["access", "level"]), "restricted"),
 moduleLabel: asString(firstValue(item, ["moduleLabel", "module_label", "label"])) || undefined,
 accessLabel: asString(firstValue(item, ["accessLabel", "access_label", "levelLabel", "level_label"])) || undefined,
 };
 })
 .filter(Boolean) as UserProfile["permissionsByModule"];
 const securityRecord = asRecord(firstValue(record, ["security"])) ?? null;
 const activity = asArray(firstValue(record, ["activity", "audit_logs", "logs"]))
 .map((entry) => {
 const item = asRecord(entry);
 if (!item) return null;
 return {
 id: asString(firstValue(item, ["id", "uuid"])) || `${asString(firstValue(item, ["action", "event"]), "event")}-${asString(firstValue(item, ["created_at", "createdAt", "date"]), "unknown")}`,
 action: asString(firstValue(item, ["action", "event"]), "Evento"),
 actionLabel: asString(firstValue(item, ["actionLabel", "action_label", "eventLabel", "event_label"])) || undefined,
 scope: asString(firstValue(item, ["scope"])) || undefined,
 description: asString(firstValue(item, ["description", "message"])) || undefined,
 created_at: asString(firstValue(item, ["created_at", "createdAt", "date"])) || undefined,
 actor_name: asString(firstValue(item, ["actor_name", "actorName", "actor.fullName", "actor.name"])) || undefined,
 };
 })
 .filter(Boolean) as UserProfile["activity"];

 return {
 id: asString(firstValue(record, ["id", "userId", "user_id", "_id", "uuid"]), "No informado"),
 fullName,
 email: asString(
 firstValue(record, [
 "email",
 "correo",
 "correo_electronico",
 "username",
 "user.email",
 "personal_email",
 "profile.email",
 ]),
 "No informado",
 ),
 role: normalizedRole,
 roleName: roleName || null,
 roleCode: roleCode || null,
 workerId: workerId || null,
 hasWorkerRecord,
 worker,
 supervisedCrew,
 position,
 project: (project || null) as any,
 department: (department || null) as any,
 phone: (asString(firstValue(record, ["phone", "telefono", "phoneNumber", "phone_number", "worker.phone", "worker.telefono"])) || null) as any,
 documentNumber:
 (asString(firstValue(record, ["document_number", "documentNumber", "document", "dni", "personal_id", "worker.personal_id"])) || null) as any,
 personalId: (asString(firstValue(record, ["personalId", "personal_id", "worker.personalId", "worker.personal_id"])) || null) as any,
 birthDate:
 (normalizeDateString(
 firstValue(record, [
 "birthDate", "birth_date", "date_of_birth", "fecha_nacimiento",
 "worker.birthDate", "worker.birth_date", "worker.date_of_birth", "worker.fecha_nacimiento"
 ]),
 ) || null) as any,
 avatarUrl:
 (cleanAvatarUrl(
 firstValue(record, [
 "avatarUrl",
 "avatar_url",
 "profilePhotoUrl",
 "profile_photo_url",
 "photoUrl",
 "photo_url",
 "imageUrl",
 "image_url",
 "picture",
 "pictureUrl",
 "picture_url",
 ]),
 ) || null) as any,
 preferences: normalizeVisualPreferences(record),
 forcePasswordChange:
 asBoolean(
 firstValue(record, [
 "forcePasswordChange",
 "force_password_change",
 "security.forcePasswordChange",
 "security.force_password_change",
 ]),
 ) ?? null,
 gender: (asString(firstValue(record, ["gender", "genero", "sexo", "worker.gender", "worker.genero", "worker.sexo"])) || null) as any,
 genderLabel: (asString(firstValue(record, ["genderLabel", "gender_label", "genero_label", "worker.genderLabel", "worker.gender_label", "worker.genero_label"])) || null) as any,
 civilStatus: (asString(firstValue(record, ["civilStatus", "civil_status", "estado_civil", "estadoCivil", "worker.civilStatus", "worker.civil_status", "worker.estado_civil", "worker.estadoCivil"])) || null) as any,
 civilStatusLabel: (asString(firstValue(record, ["civilStatusLabel", "civil_status_label", "estado_civil_label", "worker.civilStatusLabel", "worker.civil_status_label", "worker.estado_civil_label"])) || null) as any,
 nationality: (asString(firstValue(record, ["nationality", "nacionalidad", "worker.nationality", "worker.nacionalidad"])) || null) as any,
 secondaryPhone: (asString(firstValue(record, ["secondaryPhone", "secondary_phone", "worker.secondaryPhone", "worker.secondary_phone"])) || null) as any,
 personalEmail: (asString(firstValue(record, ["personalEmail", "personal_email", "worker.personalEmail", "worker.personal_email"])) || null) as any,
 address: (asString(firstValue(record, ["address", "direccion", "homeAddress", "home_address", "worker.address", "worker.direccion"])) || null) as any,
 province: (asString(firstValue(record, ["province", "provinceName", "province_name", "provincia", "worker.province", "worker.province_name", "worker.provincia"])) || null) as any,
 district: (asString(firstValue(record, ["district", "districtName", "district_name", "distrito", "worker.district", "worker.district_name", "worker.distrito"])) || null) as any,
 departmentGeo: (asString(firstValue(record, ["departmentGeo", "department_geo", "departmentGeoName", "region", "region_name", "departamento", "worker.departmentGeo", "worker.department_geo", "worker.region", "worker.region_name", "worker.departamento"])) || null) as any,
 
 emergencyContactName: (asString(firstValue(record, [
 "emergencyContactName",
 "emergency_contact_name",
 "contacto_emergencia",
 "contactoEmergencia",
 "worker.emergency_contact_name",
 "worker.emergencyContactName",
 "worker.contacto_emergencia",
 "worker.contactoEmergencia",
 "emergency_contact.name",
 "worker.emergency_contact.name"
 ])) || null) as any,
 emergencyContactPhone: (asString(firstValue(record, [
 "emergencyContactPhone",
 "emergency_contact_phone",
 "telefono_emergencia",
 "telefonoEmergencia",
 "worker.emergency_contact_phone",
 "worker.emergencyContactPhone",
 "worker.telefono_emergencia",
 "worker.telefonoEmergencia",
 "emergency_contact.phone",
 "worker.emergency_contact.phone"
 ])) || null) as any,
 emergencyContactRelationship: (asString(firstValue(record, [
 "emergencyContactRelationship",
 "emergency_contact_relationship",
 "parentesco",
 "worker.emergency_contact_relationship",
 "worker.emergencyContactRelationship",
 "worker.parentesco",
 "emergency_contact.relationship",
 "worker.emergency_contact.relationship"
 ])) || null) as any,

 positionName: asString(firstValue(record, [
 "positionName",
 "position_name",
 "position.name",
 "worker.position",
 "worker.position_name",
 "worker.job_position_name"
 ])) || null,
 areaName: asString(firstValue(record, [
 "areaName",
 "area_name",
 "worker.area_name",
 "worker.areaName",
 "department"
 ])) || null,
 companyName: asString(firstValue(record, [
 "companyName",
 "company_name",
 "worker.company_name",
 "worker.companyName"
 ])) || null,
 departmentName: asString(firstValue(record, [
 "departmentName",
 "department_name",
 "worker.department_name",
 "worker.departmentName"
 ])) || null,
 workLocationName: asString(firstValue(record, [
 "workLocationName",
 "work_location_name",
 "worker.work_location_name",
 "worker.workLocationName",
 "project",
 "worker.project"
 ])) || null,
 crewName: asString(firstValue(record, [
 "crewName",
 "crew_name",
 "worker.crew_name",
 "worker.crewName"
 ])) || null,
 laborStatus: asString(firstValue(record, [
 "laborStatus",
 "labor_status",
 "worker.labor_status",
 "worker.status",
 "worker.laborStatus"
 ])) || null,
 shiftName: asString(firstValue(record, [
 "shiftName",
 "shift_name",
 "shift",
 "turn",
 "turno",
 "worker.shift_name",
 "worker.shift",
 "worker.turno"
 ])) || null,
 modality: asString(firstValue(record, [
 "modality",
 "modalidad",
 "worker.modality",
 "worker.modalidad"
 ])) || null,
 costCenter: asString(firstValue(record, [
 "costCenter",
 "cost_center",
 "centroCosto",
 "centro_costo",
 "centro_costos",
 "worker.cost_center",
 "worker.centro_costo"
 ])) || null,

 status:
 normalizedStatus !== "unknown"
 ? normalizedStatus
 : isActiveValue === null
 ? "unknown"
 : isActiveValue
 ? "active"
 : "inactive",
 permissions: asArray(firstValue(record, ["permissions", "permisos"])).map((item) =>
 asString(item),
 ),
 permissionsByModule,
 security: securityRecord
 ? {
 email_verified: asBoolean(firstValue(securityRecord, ["email_verified", "emailVerified"])),
 password_change_required: asBoolean(firstValue(securityRecord, ["password_change_required", "passwordChangeRequired"])),
 active_sessions: asNumber(firstValue(securityRecord, ["active_sessions", "activeSessions"])),
 failed_login_attempts: asNumber(firstValue(securityRecord, ["failed_login_attempts", "failedLoginAttempts"])),
 }
 : null,
 activity,
 createdAt: (asString(firstValue(record, ["createdAt", "created_at", "fecha_creacion", "fechaCreacion"])) || null) as any,
 lastLoginAt: (asString(firstValue(record, ["lastLoginAt", "last_login_at", "ultimo_acceso"])) || null) as any,
 };
}

export function normalizeSession(payload: unknown): SessionData {
 const root = asRecord(payload) ?? {};
 const dataWrapper = asRecord(root["data"]) ?? null;

 const userNode =
 asRecord(root["user"]) ??
 asRecord(root["profile"]) ??
 (dataWrapper
 ? asRecord(dataWrapper["user"]) ?? asRecord(dataWrapper["profile"]) ?? dataWrapper
 : null) ??
 root;

 const workerNode =
 asRecord(root["worker"]) ??
 asRecord(userNode["worker"]) ??
 (dataWrapper ? asRecord(dataWrapper["worker"]) : null) ??
 null;

 // Merge workerNode into userNode so normalizeUser can find it nested
 const mergedUserNode = {
 ...userNode,
 ...(workerNode ? { worker: workerNode } : {}),
 ...(dataWrapper?.preferences ? { preferences: dataWrapper.preferences } : {}),
 ...(root.preferences ? { preferences: root.preferences } : {}),
 };

 return {
 user: normalizeUser(mergedUserNode),
 source: "api",
 };
}

// ─── Profile contract normalizer (GET /api/profile/current) ─────────────────

/**
 * Resolves the backend response for GET /api/profile/current robustly.
 * Supports all known response shapes:
 * data.profile, data.user, data.worker, data.security, data.activity,
 * root.profile, root.user, root.worker, root.security,
 * root.audit_logs, root.logs
 */
export function normalizeCurrentUserProfile(response: unknown): UserProfile {
 const root = ((response as any)?.data ?? response) as Record<string, any>;

 const profileNode =
 root?.profile ??
 root?.data?.profile ??
 root?.user ??
 root?.data?.user ??
 root;

 const workerNode =
 profileNode?.worker ??
 root?.worker ??
 root?.data?.worker ??
 null;

 const securityNode =
 profileNode?.security ??
 root?.security ??
 root?.data?.security ??
 null;

 const rawActivity =
 profileNode?.activity ??
 root?.activity ??
 root?.logs ??
 root?.audit_logs ??
 root?.data?.activity ??
 root?.data?.logs ??
 root?.data?.audit_logs ??
 [];

 // Normalize security — never return undefined, always null if absent
 const security = securityNode
 ? {
 emailVerified:
 asBoolean(
 firstValue(securityNode, ["emailVerified", "email_verified"])
 ) ?? null,
 email_verified:
 asBoolean(
 firstValue(securityNode, ["emailVerified", "email_verified"])
 ) ?? null,
 passwordChangeRequired:
 asBoolean(
 firstValue(securityNode, ["passwordChangeRequired", "password_change_required"])
 ) ?? null,
 password_change_required:
 asBoolean(
 firstValue(securityNode, ["passwordChangeRequired", "password_change_required"])
 ) ?? null,
 activeSessions:
 asNumber(
 firstValue(securityNode, ["activeSessions", "active_sessions"])
 ) ?? null,
 active_sessions:
 asNumber(
 firstValue(securityNode, ["activeSessions", "active_sessions"])
 ) ?? null,
 failedLoginAttempts:
 asNumber(
 firstValue(securityNode, ["failedLoginAttempts", "failed_login_attempts"])
 ) ?? null,
 failed_login_attempts:
 asNumber(
 firstValue(securityNode, ["failedLoginAttempts", "failed_login_attempts"])
 ) ?? null,
 }
 : null;

 // Normalize activity items
 const activity: ProfileActivityItem[] = asArray(rawActivity)
 .map((entry) => {
 const item = asRecord(entry);
 if (!item) return null;
 return {
 id:
 asString(firstValue(item, ["id", "uuid"])) ||
 `event-${asString(firstValue(item, ["created_at", "createdAt", "date"]), "unknown")}`,
 action: asString(firstValue(item, ["action", "event"])) || null,
 actionLabel: asString(firstValue(item, ["actionLabel", "action_label", "eventLabel", "event_label"])) || null,
 scope: asString(firstValue(item, ["scope"])) || null,
 description: asString(firstValue(item, ["description", "message"])) || null,
 createdAt: asString(firstValue(item, ["createdAt", "created_at", "date"])) || null,
 actorName: asString(firstValue(item, ["actorName", "actor_name", "actor.fullName", "actor.name"])) || null,
 } satisfies ProfileActivityItem;
 })
 .filter((item): item is ProfileActivityItem => item !== null);

 // Normalize worker fields — prefer camelCase aliases from new contract
 const crewName =
 asString(
 firstValue(workerNode ?? {}, ["crewName", "crew_name", "crew.name"])
 ) || null;
 const workLocationName =
 asString(
 firstValue(workerNode ?? {}, ["workLocationName", "work_location_name", "work_location.name"])
 ) ||
 asString(firstValue(profileNode as LooseRecord, ["workLocationName", "work_location_name"])) ||
 null;
 const supervisorName =
 asString(
 firstValue(workerNode ?? {}, ["supervisorName", "supervisor_name", "supervisor.name"])
 ) || null;
 const hireDate =
 asString(
 firstValue(workerNode ?? {}, ["hireDate", "hire_date", "entry_date"])
 ) || null;
 const laborStatus =
 asString(
 firstValue(workerNode ?? {}, ["laborStatus", "labor_status", "status"])
 ) || null;
 const branchName =
 asString(
 firstValue(workerNode ?? {}, ["sede_name", "branchName", "branch_name"])
 ) || null;
 const workerType =
 asString(
 firstValue(workerNode ?? {}, ["tipo_trabajador", "workerType", "worker_type"])
 ) || null;
 const shiftName =
 asString(
 firstValue(workerNode ?? {}, ["turno", "shiftName", "shift_name", "shift"])
 ) || null;
 const modality =
 asString(
 firstValue(workerNode ?? {}, ["modalidad", "modality"])
 ) || null;
 const costCenter =
 asString(
 firstValue(workerNode ?? {}, ["centro_costo", "centro_costos", "costCenter", "cost_center"])
 ) || null;
 const attendanceRadius =
 asNumber(
 firstValue(workerNode ?? {}, ["attendanceRadius", "attendance_radius", "allowed_radius_meters"])
 ) || null;
 const lastLoginAt =
 asString(
 firstValue(profileNode as LooseRecord, ["lastLoginAt", "last_login_at", "ultimo_acceso"])
 ) || null;

 // Helper to resolve profile or worker values
 const pickProfileValue = (pNode: any, wNode: any, keys: string[]): any => {
 for (const key of keys) {
 const value = readPath(pNode, key) ?? readPath(wNode, key);
 if (value !== undefined && value !== null && value !== "") {
 return value;
 }
 }
 return null;
 };

 const isUuidString = (val: unknown): boolean => {
 if (typeof val !== "string") return false;
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
 };

 const filterUuid = (val: any) => (isUuidString(val) ? null : val);

 const genderMap = {
 male: "Masculino",
 female: "Femenino",
 other: "Otro",
 };

 const civilStatusMap = {
 single: "Soltero(a)",
 married: "Casado(a)",
 divorced: "Divorciado(a)",
 widowed: "Viudo(a)",
 cohabiting: "Conviviente",
 };

 const personalId =
 asString(pickProfileValue(profileNode, workerNode, ["personalId", "personal_id", "documentNumber", "document_number"])) ||
 null;

 const birthDate = normalizeDateString(
 pickProfileValue(profileNode, workerNode, ["birthDate", "birth_date", "date_of_birth", "fecha_nacimiento"])
 ) || null;

 const rawGender = pickProfileValue(profileNode, workerNode, ["genderLabel", "gender_label", "gender", "genero", "sexo"]);
 const rawGenderLabel = pickProfileValue(profileNode, workerNode, ["genderLabel", "gender_label", "genero_label"]);
 const genderLabel = rawGenderLabel ?? (rawGender ? (genderMap[String(rawGender).toLowerCase() as keyof typeof genderMap] ?? rawGender) : null);
 const gender = genderLabel ?? rawGender ?? null;

 const rawCivilStatus = pickProfileValue(profileNode, workerNode, ["civilStatusLabel", "civil_status_label", "civilStatus", "civil_status", "estado_civil", "estadoCivil"]);
 const rawCivilStatusLabel = pickProfileValue(profileNode, workerNode, ["civilStatusLabel", "civil_status_label", "estado_civil_label"]);
 const civilStatusLabel = rawCivilStatusLabel ?? (rawCivilStatus ? (civilStatusMap[String(rawCivilStatus).toLowerCase() as keyof typeof civilStatusMap] ?? rawCivilStatus) : null);
 const civilStatus = civilStatusLabel ?? rawCivilStatus ?? null;

 const nationality = pickProfileValue(profileNode, workerNode, ["nationality", "nacionalidad", "nationalityName", "nationality_name"]);
 const address = pickProfileValue(profileNode, workerNode, ["address", "direccion", "homeAddress", "home_address"]);
 const phone = pickProfileValue(profileNode, workerNode, ["phone", "telefono", "phoneNumber", "phone_number"]);
 const secondaryPhone = pickProfileValue(profileNode, workerNode, ["secondaryPhone", "secondary_phone", "telefono_secundario", "telefonoSecundario"]);
 const personalEmail = pickProfileValue(profileNode, workerNode, ["personalEmail", "personal_email", "correo_personal", "correoPersonal"]);

 const departmentGeo = filterUuid(pickProfileValue(profileNode, workerNode, ["departmentGeo", "department_geo", "department", "region", "region_name", "departamento"]));
 const province = filterUuid(pickProfileValue(profileNode, workerNode, ["province", "provinceName", "province_name", "provincia"]));
 const district = filterUuid(pickProfileValue(profileNode, workerNode, ["district", "districtName", "district_name", "distrito"]));

 const emergencyContactName = pickProfileValue(profileNode, workerNode, ["emergencyContactName", "emergency_contact_name", "contacto_emergencia", "contactoEmergencia", "emergency_contact.name"]);
 const emergencyContactPhone = pickProfileValue(profileNode, workerNode, ["emergencyContactPhone", "emergency_contact_phone", "telefono_emergencia", "telefonoEmergencia", "emergency_contact.phone"]);
 const emergencyContactRelationship = pickProfileValue(profileNode, workerNode, ["emergencyContactRelationship", "emergency_contact_relationship", "parentesco", "emergency_contact.relationship"]);

 // Merge worker into profileNode if it was resolved from root/sibling
 const mergedProfileNode = {
 ...profileNode,
 ...(workerNode ? { worker: workerNode } : {}),
 };

 // Use existing normalizeUser for the base fields, then override with
 // resolved nodes from the extended contract
 const baseUser = normalizeUser(mergedProfileNode);

 // Build worker object with all new fields from workerNode
 const resolvedWorker = baseUser.worker
 ? {
 ...baseUser.worker,
 crew_name: crewName ?? baseUser.worker.crew_name ?? null,
 supervisor_name: supervisorName ?? baseUser.worker.supervisor_name ?? null,
 hire_date: hireDate ?? baseUser.worker.hire_date ?? null,
 status: laborStatus ?? baseUser.worker.status ?? null,
 branch_name: branchName ?? baseUser.worker.branch_name ?? null,
 worker_type: workerType ?? baseUser.worker.worker_type ?? null,
 }
 : workerNode
 ? {
 id: asString(firstValue(workerNode, ["id", "worker_id"])) || "unknown",
 crew_name: crewName,
 supervisor_name: supervisorName,
 hire_date: hireDate,
 status: laborStatus,
 branch_name: branchName,
 worker_type: workerType,
 work_location_name: workLocationName,
 }
 : null;

 return {
 ...baseUser,
 worker: resolvedWorker as UserProfile["worker"],
 // Override security with fully resolved version
 security,
 // Override activity with fully normalized version
 activity: activity.length > 0
 ? activity.map((item) => ({
 id: item.id,
 action: item.action ?? "",
 actionLabel: item.actionLabel ?? undefined,
 scope: item.scope ?? undefined,
 description: item.description ?? undefined,
 created_at: item.createdAt ?? undefined,
 actor_name: item.actorName ?? undefined,
 }))
 : baseUser.activity ?? [],

 // Override key fields with resolved values — use null (not undefined) to prevent undefined in UI
 phone: phone ?? baseUser.phone ?? null,
 documentNumber: personalId ?? baseUser.documentNumber ?? null,
 birthDate: birthDate ?? baseUser.birthDate ?? null,
 avatarUrl: baseUser.avatarUrl ?? null,
 gender: gender ?? baseUser.gender ?? null,
 civilStatus: civilStatus ?? baseUser.civilStatus ?? null,
 nationality: nationality ?? baseUser.nationality ?? null,
 secondaryPhone: secondaryPhone ?? baseUser.secondaryPhone ?? null,
 personalEmail: personalEmail ?? baseUser.personalEmail ?? null,
 address: address ?? baseUser.address ?? null,
 province: province ?? baseUser.province ?? null,
 district: district ?? baseUser.district ?? null,
 departmentGeo: departmentGeo ?? baseUser.departmentGeo ?? null,
 emergencyContactName: emergencyContactName ?? baseUser.emergencyContactName ?? null,
 emergencyContactPhone: emergencyContactPhone ?? baseUser.emergencyContactPhone ?? null,
 emergencyContactRelationship: emergencyContactRelationship ?? baseUser.emergencyContactRelationship ?? null,
 createdAt: baseUser.createdAt ?? null,

 workLocationName: workLocationName ?? baseUser.workLocationName ?? null,
 crewName: crewName ?? baseUser.crewName ?? null,
 laborStatus: laborStatus ?? baseUser.laborStatus ?? null,
 shiftName: shiftName ?? baseUser.shiftName ?? null,
 modality: modality ?? baseUser.modality ?? null,
 costCenter: costCenter ?? baseUser.costCenter ?? null,
 lastLoginAt: lastLoginAt ?? baseUser.lastLoginAt ?? null,
 personalId: personalId ?? baseUser.personalId ?? null,
 genderLabel: genderLabel ?? baseUser.genderLabel ?? null,
 civilStatusLabel: civilStatusLabel ?? baseUser.civilStatusLabel ?? null,
 supervisorName: supervisorName ?? baseUser.worker?.supervisor_name ?? null,
 hireDate: hireDate ?? baseUser.worker?.hire_date ?? null,
 workerType: workerType ?? baseUser.worker?.worker_type ?? null,
 branchName: branchName ?? baseUser.worker?.branch_name ?? null,
 attendanceRadius: attendanceRadius ?? baseUser.worker?.attendance_radius ?? null,
 };
}

// ─── PATCH diff helper ───────────────────────────────────────────────────────

/**
 * Builds a PATCH payload with only the fields that changed.
 * Fields set to empty string are sent as null (explicit clear).
 * If no fields changed, returns an empty object.
 */
export function buildProfilePatchPayload(
 initialValues: Partial<ProfileEditableFields>,
 currentValues: Partial<ProfileEditableFields>,
): Partial<ProfileEditableFields> {
 const payload: Partial<ProfileEditableFields> = {};

 (Object.keys(currentValues) as Array<keyof ProfileEditableFields>).forEach((key) => {
 const previous = initialValues[key] ?? null;
 const current = currentValues[key] ?? null;
 // Normalize empty strings to null for comparison
 const prevNorm = previous === "" ? null : previous;
 const currNorm = current === "" ? null : current;

 if (currNorm !== prevNorm) {
 payload[key] = currNorm as any;
 }
 });

 return payload;
}

const normalizeMetricAccent = (value: unknown): DashboardMetric["accent"] => {
 const normalized = asString(value).toLowerCase();

 if (normalized === "teal" || normalized === "amber" || normalized === "slate") {
 return normalized;
 }

 return "slate";
};

const normalizeDashboardMetric = (entry: unknown): DashboardMetric | null => {
 const record = asRecord(entry);
 if (!record) return null;

 const value = firstValue(record, ["value", "count", "total", "amount"]);
 if (value === undefined || value === null || value === "") return null;

 const id = asString(firstValue(record, ["id", "key", "name", "label"]));
 const label = asString(firstValue(record, ["label", "title", "name", "key"]));

 if (!id || !label) return null;

 return {
 id,
 label,
 value: asString(value),
 trend: asString(firstValue(record, ["trend", "description", "subtitle"])),
 accent: normalizeMetricAccent(firstValue(record, ["accent", "color", "tone"])),
 };
};

const metricFromPath = (
 source: unknown,
 id: string,
 label: string,
 paths: string[],
 accent: DashboardMetric["accent"],
 trend = "Dato backend",
) => {
 const value = firstValue(source, paths);
 if (value === undefined || value === null || value === "") return null;

 return {
 id,
 label,
 value: asString(value),
 trend,
 accent,
 };
};

const normalizeDashboardEvent = (entry: unknown): DashboardEvent | null => {
 const record = asRecord(entry);
 if (!record) return null;

 const id = asString(firstValue(record, ["id", "_id", "requestId", "request_id"]));
 const title = asString(firstValue(record, ["title", "titulo", "subject", "type", "tipo"]));

 if (!id || !title) return null;

 return {
 id,
 title,
 description: asString(firstValue(record, ["description", "descripcion", "detail", "comment"])),
 timestamp: asString(firstValue(record, ["timestamp", "createdAt", "created_at", "date", "fecha"])),
 status: normalizeStatus(firstValue(record, ["status", "estado"]), [
 "draft",
 "pending",
 "approved",
 "observed",
 "rejected",
 "cancelled",
 "available",
 "missing",
 "expired",
 "active",
 "inactive",
 "on-leave",
 ]),
 };
};

const normalizeBreakdownArray = (value: unknown) =>
 asArray(value)
 .map((entry) => {
 const record = asRecord(entry);
 if (!record) return null;

 const parsedValue = asNumber(firstValue(record, ["value", "count", "total"]));
 const label = asString(firstValue(record, ["label", "name", "status", "estado"]));

 if (!label || parsedValue === null) return null;

 return {
 label,
 value: parsedValue,
 color: asString(firstValue(record, ["color", "hex"]), "#64748b"),
 };
 })
 .filter((entry): entry is { label: string; value: number; color: string } => Boolean(entry));

const normalizeBreakdownObject = (value: unknown) => {
 const record = asRecord(value);
 if (!record) return [];

 return Object.entries(record)
 .map(([label, rawValue]) => {
 const parsedValue = asNumber(rawValue);
 if (parsedValue === null) return null;

 return {
 label,
 value: parsedValue,
 color: "#64748b",
 };
 })
 .filter((entry): entry is { label: string; value: number; color: string } => Boolean(entry));
};

const normalizeSnapshotArray = (value: unknown) =>
 asArray(value)
 .map((entry) => {
 const record = asRecord(entry);
 if (!record) return null;

 const parsedValue = asNumber(firstValue(record, ["value", "count", "total"]));
 const label = asString(firstValue(record, ["label", "name", "project", "status", "estado"]));

 if (!label || parsedValue === null) return null;

 return {
 label,
 value: parsedValue,
 };
 })
 .filter((entry): entry is { label: string; value: number } => Boolean(entry));

const normalizeSnapshotObject = (value: unknown) => {
 const record = asRecord(value);
 if (!record) return [];

 return Object.entries(record)
 .map(([label, rawValue]) => {
 const parsedValue = asNumber(rawValue);
 if (parsedValue === null) return null;

 return {
 label,
 value: parsedValue,
 };
 })
 .filter((entry): entry is { label: string; value: number } => Boolean(entry));
};

export function normalizeDashboardSummary(payload: unknown): DashboardSummary | null {
 const source =
 firstValue(payload, ["data.summary", "data.dashboard", "summary", "dashboard", "data"]) ?? payload;

 const explicitMetrics = asArray(firstValue(source, ["metrics", "cards", "kpis"]))
 .map(normalizeDashboardMetric)
 .filter((entry): entry is DashboardMetric => Boolean(entry));

 const inferredMetrics = [
 metricFromPath(
 source,
 "active-workers",
 "Trabajadores activos",
 ["activeWorkers"],
 "teal",
 ),
 metricFromPath(
 source,
 "active-users",
 "Usuarios activos",
 ["activeUsers"],
 "teal",
 ),
 metricFromPath(
 source,
 "inactive-users",
 "Usuarios inactivos",
 ["inactiveUsers"],
 "slate",
 ),
 metricFromPath(
 source,
 "blocked-devices",
 "Dispositivos bloqueados",
 ["blockedDevices"],
 "amber",
 ),
 metricFromPath(
 source,
 "contracts-expiring-30-days",
 "Contratos por vencer (30 dias)",
 ["contractsExpiring30Days"],
 "slate",
 ),
 metricFromPath(
 source,
 "attendance-today",
 "Asistencia hoy",
 ["attendanceToday", "attendance_today", "todayAttendance", "attendance.today"],
 "teal",
 ),
 metricFromPath(
 source,
 "pending-requests",
 "Solicitudes pendientes",
 ["pendingRequests", "pending_requests", "requestsPending", "requests.pending"],
 "amber",
 ),
 metricFromPath(
 source,
 "contracts-expiring",
 "Contratos por vencer",
 ["contractsExpiring", "contracts_expiring", "expiringContracts"],
 "slate",
 ),
 metricFromPath(
 source,
 "documents-pending",
 "Documentos pendientes",
 ["documentsPending", "documents_pending", "pendingDocuments"],
 "amber",
 ),
 metricFromPath(
 source,
 "late-workers",
 "Trabajadores tardios",
 ["lateWorkers", "late_workers", "workersLate"],
 "slate",
 ),
 ].filter((entry): entry is DashboardMetric => Boolean(entry));

 const upcomingActions = asArray(
 firstValue(source, ["upcomingActions", "recentActions", "pendingRequests.items", "pending_requests.items"]),
 )
 .map(normalizeDashboardEvent)
 .filter((entry): entry is DashboardEvent => Boolean(entry));

 const requestBreakdownSource = firstValue(source, [
 "requestBreakdown",
 "requestsByStatus",
 "requests_by_status",
 "pendingRequests.byStatus",
 ]);
 const requestBreakdown = Array.isArray(requestBreakdownSource)
 ? normalizeBreakdownArray(requestBreakdownSource)
 : normalizeBreakdownObject(requestBreakdownSource);

 const workforceSnapshotSource = firstValue(source, [
 "workforceSnapshot",
 "workerStatus",
 "worker_status",
 "workersByStatus",
 "projectSummary",
 "project_summary",
 ]);
 const workforceSnapshot = Array.isArray(workforceSnapshotSource)
 ? normalizeSnapshotArray(workforceSnapshotSource)
 : normalizeSnapshotObject(workforceSnapshotSource);
 const metrics = explicitMetrics.length ? explicitMetrics : inferredMetrics;

 if (
 !metrics.length &&
 !upcomingActions.length &&
 !requestBreakdown.length &&
 !workforceSnapshot.length
 ) {
 return null;
 }

 return {
 metrics,
 upcomingActions,
 requestBreakdown,
 workforceSnapshot,
 source: "api",
 };
}

export function normalizeTokens(payload: unknown) {
 const accessToken = asString(
 firstValue(payload, [
 "accessToken",
 "token",
 "data.accessToken",
 "data.token",
 ]),
 );

 const refreshToken = asString(
 firstValue(payload, [
 "refreshToken",
 "data.refreshToken",
 ]),
 );

 if (!accessToken) return null;

 return {
 accessToken,
 refreshToken: refreshToken || null,
 };
}

export function normalizePaginated<T>(
 payload: unknown,
 mapper: (entry: unknown) => T,
): PaginatedResponse<T> {
 const collection =
 (Array.isArray(payload) ? payload : undefined) ??
 (firstValue(payload, [
 "items",
 "results",
 "rows",
 "requests",
 "documents",
 "users",
 "workers",
 "data.items",
 "data.results",
 "data.rows",
 "data.requests",
 "data.documents",
 "data.users",
 "data.workers",
 "data",
 ]) as
 | unknown[]
 | undefined) ??
 [];

 const page =
 Number(firstValue(payload, ["page", "pagination.page", "data.pagination.page", "meta.page"])) || 1;
 const pageSize =
 Number(
 firstValue(payload, [
 "pageSize",
 "perPage",
 "limit",
 "pagination.limit",
 "data.pagination.limit",
 "meta.pageSize",
 ]),
 ) ||
 collection.length ||
 10;
 const total =
 Number(
 firstValue(payload, [
 "total",
 "totalItems",
 "count",
 "pagination.total",
 "data.pagination.total",
 "meta.total",
 ]),
 ) || collection.length;

 return {
 items: collection.map(mapper),
 total,
 page,
 pageSize,
 source: "api",
 };
}

const requestStatusAliases: Record<string, RequestModuleStatus> = {
 resubmitted: "resubmitted",
 resent: "resubmitted",
 reenviado: "resubmitted",
 reenviada: "resubmitted",
 observed: "observed",
 observado: "observed",
 observada: "observed",
 approved: "approved",
 aprobado: "approved",
 aprobada: "approved",
 rejected: "rejected",
 rechazado: "rejected",
 rechazada: "rejected",
 cancelled: "cancelled",
 canceled: "cancelled",
 cancelado: "cancelled",
 cancelada: "cancelled",
 pending: "pending",
 pendiente: "pending",
 draft: "draft",
 borrador: "draft",
};

const requestActionLabels: Record<RequestTimelineAction, string> = {
 created: "Creada",
 updated: "Actualizada",
 submitted: "Enviada",
 approved: "Aprobada",
 observed: "Observada",
 rejected: "Rechazada",
 cancelled: "Cancelada",
 resubmitted: "Reenviada",
 commented: "Comentada",
 unknown: "Movimiento",
};

function normalizeRequestStatus(value: unknown): RequestModuleStatus {
 const normalized = asString(value).trim().toLowerCase();
 return requestStatusAliases[normalized] ?? "unknown";
}

function normalizeRequestTimelineAction(value: unknown): RequestTimelineAction {
 const normalized = asString(value).trim().toLowerCase();

 if (normalized.includes("create")) return "created";
 if (normalized.includes("update") || normalized.includes("edit")) return "updated";
 if (normalized.includes("submit") || normalized.includes("send")) return "submitted";
 if (normalized.includes("approve")) return "approved";
 if (normalized.includes("observ")) return "observed";
 if (normalized.includes("reject")) return "rejected";
 if (normalized.includes("cancel")) return "cancelled";
 if (normalized.includes("resubmit") || normalized.includes("resent") || normalized.includes("reenvi")) {
 return "resubmitted";
 }
 if (normalized.includes("comment")) return "commented";

 return "unknown";
}

function normalizeRequestUserSummary(source: unknown): RequestItem["requester"] {
 const record = asRecord(source) ?? {};
 const firstName = asString(firstValue(record, ["firstName", "first_name", "nombres"]));
 const lastName = asString(firstValue(record, ["lastName", "last_name", "apellidos"]));
 const fullName =
 asString(
 firstValue(record, [
 "fullName",
 "full_name",
 "name",
 "requestedBy",
 "requesterName",
 "workerName",
 "worker_name",
 "employeeName",
 "user.name",
 ]),
 ) ||
 [firstName, lastName].filter(Boolean).join(" ") ||
 "No informado";

 return {
 id:
 asString(firstValue(record, ["id", "userId", "user_id", "workerId", "worker_id", "worker_id"])) ||
 undefined,
 fullName,
 email: asString(firstValue(record, ["email", "correo", "user.email"])) || undefined,
 department: asString(firstValue(record, ["department", "area", "department_name"])) || undefined,
 position:
 asString(firstValue(record, ["position", "cargo", "jobTitle", "job_position_name"])) || undefined,
 project: asString(firstValue(record, ["project", "obra", "projectName", "project_name"])) || undefined,
 avatarUrl: cleanAvatarUrl(
 firstValue(record, [
 "avatarUrl",
 "avatar_url",
 "profilePhotoUrl",
 "profile_photo_url",
 "profilePhoto",
 "profile_photo",
 "user.avatarUrl",
 "user.profilePhotoUrl",
 ])
 ) || undefined,
 };
}

function looksLikeTechnicalIdentifier(value: string) {
 const normalized = value.trim();
 if (!normalized) return false;

 const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const mongoLike = /^[0-9a-f]{24}$/i;
 const longOpaqueToken = /^[A-Za-z0-9_-]{20,}$/;

 return uuidLike.test(normalized) || mongoLike.test(normalized) || longOpaqueToken.test(normalized);
}

function normalizeApproverLabel(source: unknown) {
 const record = asRecord(source) ?? {};
 const explicitName = asString(
 firstValue(record, [
 "approved_by_name",
 "approvedByName",
 "approverName",
 "reviewerName",
 "approved_by_user.full_name",
 "approved_by_user.fullName",
 "approved_by_user.name",
 "approvedByUser.fullName",
 "approvedByUser.full_name",
 "approvedByUser.name",
 "approvedByUser.user.fullName",
 "approvedByUser.user.name",
 "approver.fullName",
 "approver.full_name",
 "approver.name",
 "reviewer.fullName",
 "reviewer.full_name",
 "reviewer.name",
 ]),
 ).trim();

 if (explicitName && !looksLikeTechnicalIdentifier(explicitName)) {
 return explicitName;
 }

 const nestedApprover =
 firstValue(source, ["approved_by_user", "approvedByUser", "approver", "reviewer"]) ?? undefined;

 if (nestedApprover && typeof nestedApprover === "object") {
 const approverSummary = normalizeRequestUserSummary(nestedApprover);
 if (approverSummary.fullName && approverSummary.fullName !== "No informado") {
 return approverSummary.fullName;
 }
 }

 const fallbackValue = asString(firstValue(record, ["approved_by", "approvedBy", "approver"]));

 if (!fallbackValue || looksLikeTechnicalIdentifier(fallbackValue)) {
 return undefined;
 }

 return fallbackValue;
}

function resolveRequestAttachments(source: unknown, record: LooseRecord) {
 return normalizeRequestAttachments(
 firstValue(source, [
 "data.documents",
 "documents",
 "data.request.documents",
 "request.documents",
 "data.attachments",
 "attachments",
 "data.request.attachments",
 "request.attachments",
 "data.files",
 "files",
 "data.request.files",
 "request.files",
 "data.request_documents",
 "request_documents",
 "data.requestDocuments",
 "requestDocuments",
 ]) ??
 firstValue(record, [
 "documents",
 "attachments",
 "files",
 "request_documents",
 "requestDocuments",
 ]),
 );
}

function resolveRequestAttachmentsCount(record: LooseRecord, attachments: RequestAttachment[]) {
 const explicitCount = asNumber(
 firstValue(record, [
 "attachmentsCount",
 "attachments_count",
 "attachmentCount",
 "attachment_count",
 "documentsCount",
 "documents_count",
 "documentCount",
 "document_count",
 "filesCount",
 "files_count",
 "fileCount",
 "file_count",
 "totalDocuments",
 "total_documents",
 "totalAttachments",
 "total_attachments",
 ]),
 );

 if (explicitCount !== null) {
 return explicitCount;
 }

 const nestedCollection = firstValue(record, [
 "documents",
 "attachments",
 "files",
 "request_documents",
 "requestDocuments",
 ]);

 if (Array.isArray(nestedCollection)) {
 return nestedCollection.length;
 }

 const hasAttachments =
 asBoolean(
 firstValue(record, [
 "hasDocuments",
 "has_documents",
 "hasAttachments",
 "has_attachments",
 "hasFiles",
 "has_files",
 ]),
 ) ?? false;

 if (attachments.length > 0) {
 return attachments.length;
 }

 return hasAttachments ? 1 : 0;
}

function normalizeRequestAttachments(source: unknown): RequestAttachment[] {
 const attachments: RequestAttachment[] = [];

 for (const entry of asArray(source)) {
 const record = asRecord(entry);
 if (!record) continue;

 const url = asString(
 firstValue(record, ["file_url", "url", "link", "href", "downloadUrl", "download_url"]),
 );
 const name =
 asString(
 firstValue(record, [
 "name",
 "fileName",
 "file_name",
 "title",
 "label",
 "original_name",
 ]),
 ) ||
 (url ? url.split("/").pop() ?? "Adjunto" : "Adjunto");
 const mimeType =
 asString(firstValue(record, ["mime_type", "mimeType", "contentType", "content_type"])) || undefined;

 attachments.push({
 id: asString(firstValue(record, ["id", "_id", "uuid", "documentId", "fileId"]), name),
 name,
 url,
 mimeType,
 fileSize: asNumber(firstValue(record, ["file_size", "size", "fileSize"])) ?? undefined,
 status: asString(firstValue(record, ["status", "estado"])) || undefined,
 createdAt:
 asString(firstValue(record, ["created_at", "createdAt", "uploaded_at"])) || undefined,
 documentType:
 asString(firstValue(record, ["document_type", "documentType", "type"])) || undefined,
 uploadedByName:
 asString(firstValue(record, ["uploaded_by_name", "uploadedByName"])) || undefined,
 isImage: Boolean(mimeType?.startsWith("image/")),
 });
 }

 return attachments;
}

export function normalizeRequestDocuments(payload: unknown): RequestAttachment[] {
 return normalizeRequestAttachments(
 firstValue(payload, ["data.documents", "documents", "data.items", "items", "data"]) ?? payload,
 );
}

function normalizeRequestReviewHistory(source: unknown): RequestReviewHistoryItem[] {
 const history: RequestReviewHistoryItem[] = [];

 asArray(source).forEach((entry, index) => {
 const record = asRecord(entry);
 if (!record) return;

 const action = normalizeRequestTimelineAction(
 firstValue(record, ["action", "decision", "status", "event", "type"]),
 );
 const actorSource = firstValue(record, ["actor", "reviewer", "user", "employee", "worker"]) ?? record;
 const actor = normalizeRequestUserSummary(actorSource);

 history.push({
 id:
 asString(firstValue(record, ["id", "_id", "uuid", "historyId", "history_id"])) ||
 `history-${index}`,
 action,
 actionLabel: requestActionLabels[action],
 actorName: actor.fullName,
 actorRole: asString(firstValue(record, ["actorRole", "role", "reviewerRole"])) || undefined,
 actorAvatarUrl: actor.avatarUrl,
 comment:
 asString(
 firstValue(record, ["comment", "comments", "observation", "observacion", "note"]),
 ) || undefined,
 createdAt: asString(firstValue(record, ["createdAt", "created_at", "date", "timestamp", "fecha"])),
 });
 });

 return history;
}

function normalizeRequestMetadata(source: unknown): RequestDetail["metadata"] {
 const record = asRecord(source);
 if (!record) return undefined;

 const metadata = Object.entries(record).reduce<Record<string, string | number | boolean | null>>(
 (accumulator, [key, value]) => {
 if (
 value === null ||
 typeof value === "string" ||
 typeof value === "number" ||
 typeof value === "boolean"
 ) {
 accumulator[key] = value;
 }

 return accumulator;
 },
 {},
 );

 return Object.keys(metadata).length ? metadata : undefined;
}

export function normalizeRequestItem(source: unknown): RequestItem {
 const payloadRecord = asRecord(source) ?? {};
 const record =
 asRecord(firstValue(source, ["data.request", "request", "data"])) ?? payloadRecord;
 const status = normalizeRequestStatus(firstValue(record, ["status", "estado", "request_status"]));
 const requesterSource =
 firstValue(record, ["requester", "worker", "employee", "user", "requestedByUser"]) ?? record;
 const attachments = resolveRequestAttachments(source, record);
 const id = asString(firstValue(record, ["id", "_id", "uuid", "requestId", "request_id"]), "No informado");

 return {
 id,
 code:
 asString(firstValue(record, ["code", "requestCode", "request_code", "correlative", "serial"])) ||
 `SOL-${id.slice(0, 8).toUpperCase()}`,
 workerId:
 asString(firstValue(record, ["workerId", "worker_id", "worker.id"])) || undefined,
 requestTypeId:
 asString(
 firstValue(record, [
 "requestTypeId",
 "request_type_id",
 "typeId",
 "type_id",
 "type.id",
 "requestType.id",
 ]),
 ) || undefined,
 typeName: asString(
 firstValue(record, [
 "type_name",
 "typeName",
 "type.name",
 "requestType.name",
 "request_type.name",
 "type",
 "tipo",
 "category",
 ]),
 "No informado",
 ),
 status,
 requester: normalizeRequestUserSummary(requesterSource),
 reason: asString(firstValue(record, ["reason", "motivo", "title", "titulo", "subject"]), "Sin motivo"),
 reviewComment:
 asString(firstValue(record, ["hr_comment", "reviewComment", "review_comment", "comment"])) ||
 undefined,
 approvedBy: normalizeApproverLabel(record),
 approvedAt:
 asString(firstValue(record, ["approved_at", "approvedAt"])) || undefined,
 submittedAt:
 asString(firstValue(record, ["created_at", "createdAt", "submittedAt", "submitted_at", "fecha_envio"])) ||
 undefined,
 createdAt: asString(
 firstValue(record, ["createdAt", "created_at", "submittedAt", "submitted_at", "fecha"]),
 ),
 updatedAt:
 asString(firstValue(record, ["updatedAt", "updated_at", "modifiedAt", "modified_at", "approved_at"])) ||
 undefined,
 startDate:
 asString(firstValue(record, ["startDate", "start_date", "fechaInicio", "requestedStartDate"])) ||
 undefined,
 endDate:
 asString(firstValue(record, ["endDate", "end_date", "fechaFin", "requestedEndDate"])) || undefined,
 daysRequested:
 asNumber(firstValue(record, ["days_requested", "daysRequested", "days"])) ?? undefined,
 attachmentsCount: resolveRequestAttachmentsCount(record, attachments),
 canEdit:
 asBoolean(firstValue(record, ["canEdit", "editable"])) ??
 ["draft", "pending", "observed"].includes(status),
 canCancel:
 asBoolean(firstValue(record, ["canCancel", "cancelable"])) ?? status === "pending",
 canReview:
 asBoolean(firstValue(record, ["canReview", "reviewable"])) ??
 ["pending", "observed"].includes(status),
 canResubmit:
 asBoolean(firstValue(record, ["canResubmit", "resubmittable"])) ?? status === "observed",
 source: "api",
 };
}

export function normalizeRequestDetail(source: unknown): RequestDetail {
 const payloadRecord = asRecord(source) ?? {};
 const record =
 asRecord(firstValue(source, ["data.request", "request", "data"])) ?? payloadRecord;
 const attachments = resolveRequestAttachments(source, record);
 const baseItem = normalizeRequestItem(source);
 const reviewHistory = normalizeRequestReviewHistory(
 firstValue(source, [
 "data.history",
 "data.reviewHistory",
 "data.review_history",
 "history",
 "reviewHistory",
 "review_history",
 "timeline",
 "reviews",
 ]),
 );
 const reviewedEntry =
 reviewHistory.find((entry) => entry.action === baseItem.status) ??
 reviewHistory.find((entry) => ["approved", "rejected", "observed"].includes(entry.action));

 return {
 ...baseItem,
 approvedBy:
 baseItem.approvedBy ??
 (reviewedEntry?.actorName && reviewedEntry.actorName !== "No informado"
 ? reviewedEntry.actorName
 : undefined),
 attachments,
 reviewHistory,
 metadata: normalizeRequestMetadata(
 firstValue(record, ["metadata", "meta", "extra", "payload", "details"]),
 ),
 };
}

export function normalizeRequestTypes(payload: unknown): RequestTypeOption[] {
 const collectionValue =
 (Array.isArray(payload) ? payload : undefined) ??
 firstValue(payload, [
 "items",
 "results",
 "types",
 "requestTypes",
 "data.items",
 "data.types",
 "data.requestTypes",
 ]);
 const collection = asArray(collectionValue);

 const requestTypes: RequestTypeOption[] = [];

 for (const entry of collection) {
 const record = asRecord(entry);
 if (!record) continue;

 const name = asString(firstValue(record, ["name", "label", "title", "type", "tipo"]));
 if (!name) continue;

 requestTypes.push({
 id: asString(firstValue(record, ["id", "_id", "uuid", "code", "typeId"]), name),
 code: asString(firstValue(record, ["code", "slug", "key"])) || undefined,
 name,
 description:
 asString(firstValue(record, ["description", "descripcion", "detail", "details"])) || undefined,
 active:
 asBoolean(firstValue(record, ["active", "isActive", "enabled", "estado_activo"])) ?? true,
 requiresEndDate:
 asBoolean(firstValue(record, ["requiresEndDate", "requires_end_date", "hasEndDate"])) ??
 undefined,
 allowsAttachment:
 asBoolean(firstValue(record, ["allowsAttachment", "allows_attachment", "supportsFiles"])) ??
 undefined,
 });
 }

 return requestTypes;
}

function normalizeRequestReportValue(value: unknown) {
 if (value === null || value === undefined) return "-";
 if (typeof value === "string") return value;
 if (typeof value === "number" || typeof value === "boolean") return String(value);
 return "-";
}

function buildRequestReportValues(source: unknown) {
 const record = asRecord(source) ?? {};
 const worker = normalizeRequestUserSummary(
 firstValue(record, ["worker", "employee", "requester", "user", "requestedByUser"]) ?? record,
 );
 const attachments = normalizeRequestAttachments(firstValue(record, ["documents", "attachments", "files"]));
 const company = asString(firstValue(record, ["company", "company_name", "empresa"])) || "";
 const site = asString(firstValue(record, ["site", "site_name", "sede"])) || "";
 const locationLabel =
 company && site ? `${company} · ${site}` : company || site || "-";

 return {
 code:
 normalizeRequestReportValue(
 firstValue(record, ["code", "requestCode", "request_code", "correlative", "serial"]),
 ) || "-",
 worker_name: worker.fullName,
 dni: normalizeRequestReportValue(firstValue(record, ["dni", "document_number", "documentNumber"])),
 department: normalizeRequestReportValue(
 firstValue(record, ["department", "area", "department_name", "worker_department"]),
 ),
 position: normalizeRequestReportValue(
 firstValue(record, ["position", "cargo", "jobTitle", "job_position_name"]),
 ),
 company: locationLabel,
 type: normalizeRequestReportValue(
 firstValue(record, [
 "type_name",
 "typeName",
 "type.name",
 "requestType.name",
 "request_type.name",
 "type",
 ]),
 ),
 created_at: normalizeRequestReportValue(
 firstValue(record, ["created_at", "createdAt", "submitted_at", "submittedAt"]),
 ),
 start_date: normalizeRequestReportValue(firstValue(record, ["start_date", "startDate", "fechaInicio"])),
 end_date: normalizeRequestReportValue(firstValue(record, ["end_date", "endDate", "fechaFin"])),
 days_requested: normalizeRequestReportValue(
 firstValue(record, ["days_requested", "daysRequested", "days"]),
 ),
 status: normalizeRequestReportValue(firstValue(record, ["status", "estado"])),
 reason: normalizeRequestReportValue(firstValue(record, ["reason", "motivo", "title", "subject"])),
 worker_comment: normalizeRequestReportValue(
 firstValue(record, ["worker_comment", "workerComment", "additional_comment", "additionalComment"]),
 ),
 review_comment: normalizeRequestReportValue(
 firstValue(record, ["hr_comment", "reviewComment", "review_comment", "comment"]),
 ),
 approver: normalizeRequestReportValue(normalizeApproverLabel(record)),
 approved_at: normalizeRequestReportValue(firstValue(record, ["approved_at", "approvedAt"])),
 attachments: attachments.length ? `${attachments.length} archivo(s)` : "Sin adjuntos",
 };
}

export function normalizeRequestReportPreview(payload: unknown): PaginatedRequestReportRowsResponse {
 const paginated = normalizePaginated(payload, (entry): RequestReportRow => {
 const record = asRecord(entry) ?? {};
 const id =
 asString(firstValue(record, ["id", "_id", "uuid", "requestId", "request_id"])) ||
 `report-row-${Math.random().toString(36).slice(2, 10)}`;

 return {
 id,
 values: buildRequestReportValues(record),
 source: "api",
 };
 });

 return {
 ...paginated,
 totalPages:
 Number(
 firstValue(payload, ["totalPages", "pagination.totalPages", "data.pagination.totalPages"]),
 ) || undefined,
 };
}

export function normalizeRequestReportColumns(payload: unknown): RequestReportColumn[] {
 const collectionValue =
 (Array.isArray(payload) ? payload : undefined) ??
 firstValue(payload, [
 "items",
 "results",
 "columns",
 "data.items",
 "data.results",
 "data.columns",
 "data",
 ]);

 return asArray(collectionValue)
 .map((entry, index) => {
 if (typeof entry === "string") {
 return {
 id: entry,
 label: entry,
 };
 }

 const record = asRecord(entry);
 if (!record) return null;

 const id =
 asString(firstValue(record, ["id", "key", "name", "field", "value"]), `column-${index}`);
 const label = asString(firstValue(record, ["label", "title", "name"]), id);

 return {
 id,
 label,
 description:
 asString(firstValue(record, ["description", "detail", "helpText"])) || undefined,
 defaultSelected:
 asBoolean(firstValue(record, ["defaultSelected", "default", "selected"])) ?? undefined,
 };
 })
 .filter((entry): entry is RequestReportColumn => Boolean(entry));
}

function normalizeRequestTemplateStatus(value: unknown): RequestTemplateStatus {
 const booleanValue = asBoolean(value);
 if (booleanValue !== null) {
 return booleanValue ? "active" : "inactive";
 }

 return asString(value).toLowerCase() === "inactive" ? "inactive" : "active";
}

function normalizeRequestTemplateFormats(source: unknown): RequestTemplateFormat[] {
 const values = asArray(source)
 .map((entry) => asString(entry).toLowerCase())
 .filter(Boolean);

 if (!values.length) {
 const singleValue = asString(source).toLowerCase();
 if (singleValue) {
 values.push(singleValue);
 }
 }

 const normalized = values.reduce<RequestTemplateFormat[]>((accumulator, value) => {
 const format =
 value.includes("xls") || value.includes("excel")
 ? "excel"
 : value.includes("doc") || value.includes("word")
 ? "word"
 : value.includes("pdf")
 ? "pdf"
 : null;

 if (format && !accumulator.includes(format)) {
 accumulator.push(format);
 }

 return accumulator;
 }, []);

 return normalized.length ? normalized : ["pdf"];
}

export function normalizeRequestTemplates(payload: unknown): RequestTemplateItem[] {
 const collectionValue =
 (Array.isArray(payload) ? payload : undefined) ??
 firstValue(payload, [
 "items",
 "results",
 "templates",
 "data.items",
 "data.results",
 "data.templates",
 "data",
 ]);

 return asArray(collectionValue).reduce<RequestTemplateItem[]>((accumulator, entry, index) => {
 const record = asRecord(entry);
 if (!record) return accumulator;

 const name = asString(firstValue(record, ["name", "title", "label", "nombre", "titulo"]), "");
 if (!name) return accumulator;

 accumulator.push({
 id:
 asString(firstValue(record, ["id", "_id", "uuid", "templateId", "template_id", "plantillaId", "plantilla_id"])) ||
 `template-${index}`,
 name,
 description:
 asString(firstValue(record, ["description", "detail", "summary", "descripcion", "detalle"])) ||
 "Plantilla lista para descarga.",
 requestType:
 asString(firstValue(record, ["request_type", "requestType", "type_name", "typeName", "tipo", "tipoSolicitud", "tipo_solicitud"])) ||
 "General",
 formats: normalizeRequestTemplateFormats(
 firstValue(record, ["formats", "available_formats", "availableFormats", "format", "formatos", "formato"]),
 ),
 updatedAt:
 asString(firstValue(record, ["updated_at", "updatedAt", "created_at", "createdAt", "fecha", "fechaActualizacion", "fecha_actualizacion"])) ||
 new Date().toISOString(),
 status: normalizeRequestTemplateStatus(firstValue(record, ["status", "active", "isActive", "estado", "activo"])),
 downloadUrl:
 asString(firstValue(record, ["download_url", "downloadUrl", "file_url", "fileUrl", "url", "urlDescarga", "archivo"])) ||
 undefined,
 });

 return accumulator;
 }, []);
}

export function normalizeReportPreview(payload: unknown): ReportPreviewResponse {
 const record = asRecord(payload) ?? {};
 const rows = asArray(firstValue(record, ["data", "rows", "items"])).map((entry) => {
 const rowRecord = asRecord(entry) ?? {};
 return Object.fromEntries(
 Object.entries(rowRecord).map(([key, value]) => [key, value === undefined ? null : (value as string | number | null)]),
 );
 });

 return {
 success: asBoolean(firstValue(record, ["success"])) ?? true,
 data: rows,
 total: asNumber(firstValue(record, ["total", "data.total", "pagination.total"])) ?? rows.length,
 previewLimit:
 asNumber(firstValue(record, ["previewLimit", "preview_limit", "limit"])) ?? rows.length,
 selectedColumns: asArray(
 firstValue(record, ["selectedColumns", "selected_columns", "columns"]),
 ).map((entry) => asString(entry) as ReportColumnKey),
 };
}

export function normalizeReportSummary(payload: unknown): ReportSummaryResponse {
 const record = asRecord(payload) ?? {};
 const data = asRecord(firstValue(record, ["data"])) ?? record;

 return {
 success: asBoolean(firstValue(record, ["success"])) ?? true,
 data: {
 totalRequests: asNumber(firstValue(data, ["totalRequests", "total_requests", "total"])) ?? 0,
 approved: asNumber(firstValue(data, ["approved"])) ?? 0,
 pending: asNumber(firstValue(data, ["pending"])) ?? 0,
 rejected: asNumber(firstValue(data, ["rejected"])) ?? 0,
 observed: asNumber(firstValue(data, ["observed"])) ?? 0,
 mostRequestedType:
 asString(firstValue(data, ["mostRequestedType", "most_requested_type"])) || null,
 workerWithMostRequests:
 asString(firstValue(data, ["workerWithMostRequests", "worker_with_most_requests"])) || null,
 },
 };
}

export function normalizeReportChart(payload: unknown): ReportChartResponse {
 const record = asRecord(payload) ?? {};
 const data = asRecord(firstValue(record, ["data"])) ?? record;
 const datasets = asArray(firstValue(data, ["datasets"])).map((entry) => {
 const datasetRecord = asRecord(entry) ?? {};

 return {
 label: asString(firstValue(datasetRecord, ["label"]), "Serie"),
 data: asArray(firstValue(datasetRecord, ["data"])).map((value) => asNumber(value) ?? 0),
 };
 });

 return {
 success: asBoolean(firstValue(record, ["success"])) ?? true,
 data: {
 title: asString(firstValue(data, ["title"]), "Grafico de solicitudes"),
 labels: asArray(firstValue(data, ["labels"])).map((entry) => asString(entry)),
 datasets,
 summary:
 (asRecord(firstValue(data, ["summary"])) as Record<string, string | number | null> | null) ??
 undefined,
 },
 };
}

export function normalizeReportTemplates(payload: unknown): ReportTemplate[] {
 const collectionValue =
 (Array.isArray(payload) ? payload : undefined) ??
 firstValue(payload, [
 "items",
 "results",
 "templates",
 "template",
 "data.items",
 "data.templates",
 "data.template",
 "data",
 ]);

 return asArray(collectionValue).reduce<ReportTemplate[]>((accumulator, entry, index) => {
 const record = asRecord(entry);
 if (!record) return accumulator;

 const name = asString(firstValue(record, ["name", "title", "label"]));
 if (!name) return accumulator;

 // Soporte para columns serializado como string JSON
 let columnsArr: unknown[] = [];
 const rawColumns = firstValue(record, ["columns", "selectedColumns", "selected_columns"]);
 if (typeof rawColumns === "string") {
 try {
 columnsArr = JSON.parse(rawColumns) as unknown[];
 } catch {
 columnsArr = [];
 }
 } else if (Array.isArray(rawColumns)) {
 columnsArr = rawColumns;
 }
 const columns = columnsArr
 .map((column) => asString(column))
 .filter(Boolean) as ReportColumnKey[];

 // Soporte para filters serializado como string JSON
 let filtersObj: Record<string, unknown> = {};
 const rawFilters = firstValue(record, ["filters"]);
 if (typeof rawFilters === "string") {
 try {
 filtersObj = JSON.parse(rawFilters) as Record<string, unknown>;
 } catch {
 filtersObj = {};
 }
 } else if (rawFilters && typeof rawFilters === "object") {
 filtersObj = rawFilters as Record<string, unknown>;
 }

 // Soporte para chartConfig serializado como string JSON
 let chartConfigObj: Record<string, unknown> | null = null;
 const rawChartConfig = firstValue(record, ["chartConfig", "chart_config"]);
 if (typeof rawChartConfig === "string") {
 try {
 chartConfigObj = JSON.parse(rawChartConfig) as Record<string, unknown>;
 } catch {
 chartConfigObj = null;
 }
 } else if (rawChartConfig && typeof rawChartConfig === "object") {
 chartConfigObj = rawChartConfig as Record<string, unknown>;
 }

 const reportType = asString(firstValue(record, ["reportType", "report_type", "type"]), "requests_excel");
 let moduleVal = asString(firstValue(record, ["module", "modulo"]), "");
 if (!moduleVal) {
 if (reportType.startsWith("requests")) moduleVal = "requests";
 else if (reportType.startsWith("attendance")) moduleVal = "attendance";
 else if (reportType.startsWith("payroll")) moduleVal = "payroll";
 else if (reportType.startsWith("workers")) moduleVal = "workers";
 else if (reportType.startsWith("monthly")) moduleVal = "monthly-summary";
 else if (reportType.startsWith("vacations")) moduleVal = "vacations";
 else if (reportType.startsWith("documents")) moduleVal = "documents";
 else moduleVal = "requests";
 }

 accumulator.push({
 id:
 asString(firstValue(record, ["id", "_id", "uuid", "templateId", "template_id"])) ||
 `report-template-${index}`,
 name,
 description: asString(firstValue(record, ["description", "detail", "summary"])) || undefined,
 module: moduleVal,
 reportType,
 filters: {
 dateFrom: asString(filtersObj.dateFrom ?? filtersObj.date_from ?? firstValue(record, ["filters.dateFrom", "filters.date_from", "dateFrom"])) || null,
 dateTo: asString(filtersObj.dateTo ?? filtersObj.date_to ?? firstValue(record, ["filters.dateTo", "filters.date_to", "dateTo"])) || null,
 status:
 (asString(filtersObj.status ?? firstValue(record, ["filters.status", "status"])) as ReportTemplate["filters"]["status"]) ||
 null,
 requestType:
 asString(filtersObj.requestType ?? filtersObj.request_type ?? filtersObj.typeId ?? firstValue(record, ["filters.requestType", "filters.request_type", "requestType"])) ||
 null,
 areaId: asString(filtersObj.areaId ?? filtersObj.area_id ?? firstValue(record, ["filters.areaId", "filters.area_id", "areaId"])) || null,
 workerId:
 asString(filtersObj.workerId ?? filtersObj.worker_id ?? firstValue(record, ["filters.workerId", "filters.worker_id", "workerId"])) || null,
 },
 columns,
 chartConfig: chartConfigObj
 ? {
 groupBy:
 (asString(chartConfigObj.groupBy ?? chartConfigObj.group_by) as ChartConfig["groupBy"]) ||
 "worker",
 metric:
 (asString(chartConfigObj.metric) as ChartConfig["metric"]) ||
 "total_requests",
 limit: asNumber(chartConfigObj.limit) ?? undefined,
 }
 : undefined,
 isDefault:
 asBoolean(firstValue(record, ["isDefault", "is_default", "default"])) ?? false,
 createdAt: asString(firstValue(record, ["createdAt", "created_at"])) || undefined,
 updatedAt: asString(firstValue(record, ["updatedAt", "updated_at"])) || undefined,
 ownerType:
 (asString(firstValue(record, ["ownerType", "owner_type"])) as ReportTemplate["ownerType"]) ||
 undefined,
 });

 return accumulator;
 }, []);
}

export function normalizeRequestRecord(source: unknown): RequestRecord {
 const record = asRecord(source) ?? {};
 const status = normalizeStatus(firstValue(record, ["status", "estado"]), [
 "draft",
 "pending",
 "approved",
 "observed",
 "rejected",
 "cancelled",
 ]);

 return {
 id: asString(firstValue(record, ["id", "_id", "uuid", "requestId", "request_id"]), "No informado"),
 type: asString(firstValue(record, ["type", "tipo", "category", "type_name"]), "No informado"),
 title: asString(firstValue(record, ["title", "titulo", "subject", "reason", "type_name"]), "No informado"),
 description: asString(firstValue(record, ["description", "descripcion", "detail", "reason"]), "No informado"),
 status,
 requestedBy: asString(
 firstValue(record, ["requestedBy", "requesterName", "usuario", "user.name", "worker_name"]),
 "No informado",
 ),
 requesterId: asString(
 firstValue(record, ["requesterId", "request_id", "userId", "user_id", "user.id", "worker_id"]),
 ),
 project: asString(firstValue(record, ["project", "obra", "projectName", "project_name"])) || undefined,
 createdAt: asString(firstValue(record, ["createdAt", "created_at", "fecha"])),
 startDate: asString(firstValue(record, ["startDate", "start_date", "fechaInicio"])) || undefined,
 endDate: asString(firstValue(record, ["endDate", "end_date", "fechaFin"])) || undefined,
 approver: normalizeApproverLabel(record),
 comment: asString(
 firstValue(record, ["comment", "observation", "observacion", "hr_comment"]),
 ) || undefined,
 canEdit: Boolean(firstValue(record, ["canEdit"])) || status === "observed",
 canCancel:
 Boolean(firstValue(record, ["canCancel"])) ||
 status === "pending" ||
 status === "observed",
 canReview: Boolean(firstValue(record, ["canReview"])) || status === "pending",
 };
}

export function normalizeDocumentRecord(source: unknown): DocumentRecord {
 const record = asRecord(source) ?? {};
 const status = normalizeStatus(firstValue(record, ["status", "estado"]), [
 "available",
 "missing",
 "expired",
 "pending",
 ]);

 return {
 id: asString(firstValue(record, ["id", "_id", "uuid", "documentId", "document_id"]), "No informado"),
 title: asString(firstValue(record, ["title", "name", "titulo"]), "No informado"),
 category: asString(firstValue(record, ["category", "tipo", "type"]), "No informado"),
 ownerName: asString(firstValue(record, ["ownerName", "user.name", "trabajador", "employeeName"]), "No informado"),
 project: asString(firstValue(record, ["project", "obra", "projectName"])) || undefined,
 status,
 updatedAt: asString(firstValue(record, ["updatedAt", "updated_at", "fechaActualizacion"])),
 url: asString(firstValue(record, ["url", "link", "documentUrl"])) || undefined,
 };
}

export function normalizeWorkerRecord(source: unknown): WorkerRecord {
 const payload = firstValue(source, ["data"]) ?? source;
 const user = normalizeUser(payload);
 const workerIdCandidates = [
 "worker_id",
 "workerId",
 "id",
 "uuid",
 "worker.id",
 "worker.uuid",
 "employee.id",
 "employee.uuid",
 "user.worker_id",
 "user.workerId",
 ];
 const rawWorkerId = workerIdCandidates
 .map((path) => firstValue(payload, [path]))
 .find((val) => isUuid(val));
 const workerId = rawWorkerId || (isUuid(user.workerId) ? user.workerId : undefined) || (isUuid(user.worker?.id) ? user.worker.id : undefined);

 const rawUserId = firstValue(payload, [
 "user_id",
 "userId",
 "user.id",
 "user.uuid",
 "account_id",
 "accountId",
 ]);
 const userId = isUuid(rawUserId) ? rawUserId : (isUuid(user.id) ? user.id : undefined);

 const documentNumber =
 asString(
 firstValue(payload, [
 "document_number",
 "documentNumber",
 "dni",
 "personal_id",
 "personalId",
 "employee_id",
 "employeeId",
 "worker.personal_id",
 "worker.personalId",
 ]),
 ) ||
 user.documentNumber ||
 undefined;

 const safeWorkerId = workerId || "";
 const safeUserId = userId || undefined;
 const rawPayload = payload as any;

 const roleName =
 asString(firstValue(payload, [
 "roleName",
 "role_name",
 "role.name",
 "role.label",
 "systemRole.name",
 "systemRole.label",
 "worker.roleName",
 "worker.role_name",
 "user.roleName",
 "user.role_name",
 "user.role.name",
 ])) ||
 (typeof rawPayload?.role === "string" ? rawPayload.role : null) ||
 null;

 const roleCode =
 asString(firstValue(payload, [
 "roleCode",
 "role_code",
 "role.code",
 "systemRole.code",
 "worker.roleCode",
 "worker.role_code",
 "user.roleCode",
 "user.role_code",
 "user.role.code",
 ])) ||
 null;

 const positionName =
 asString(firstValue(payload, [
 "positionName",
 "position_name",
 "position.name",
 "position",
 "cargo",
 "jobPosition",
 "job_position",
 "jobPosition.name",
 "job_position.name",
 "job_position_name",
 "worker.positionName",
 "worker.position_name",
 "worker.position.name",
 "worker.position",
 "worker.cargo",
 "worker.jobPosition",
 "worker.job_position",
 "worker.job_position_name",
 "worker.job_position.name",
 "user.position",
 "user.worker.position",
 "user.worker.positionName",
 "user.worker.position_name",
 ])) ||
 null;

 const areaName =
 asString(firstValue(payload, [
 "areaName",
 "area_name",
 "area.name",
 "area",
 "worker.areaName",
 "worker.area_name",
 "worker.area.name",
 "worker.area",
 "user.areaName",
 "user.area_name",
 "user.worker.areaName",
 "user.worker.area_name",
 ])) ||
 null;

 const departmentName =
 asString(firstValue(payload, [
 "departmentName",
 "department_name",
 "internalDepartmentName",
 "internal_department_name",
 "department.name",
 "internalDepartment.name",
 "worker.departmentName",
 "worker.department_name",
 "worker.internalDepartmentName",
 "worker.internal_department_name",
 "worker.department.name",
 "user.departmentName",
 "user.department_name",
 "user.worker.departmentName",
 "user.worker.department_name",
 ])) ||
 null;

 const workLocationName =
 asString(firstValue(payload, [
 "workLocationName",
 "work_location_name",
 "workLocation.name",
 "work_location.name",
 "locationName",
 "location_name",
 "projectName",
 "project_name",
 "project.name",
 "project",
 "worker.workLocationName",
 "worker.work_location_name",
 "worker.workLocation.name",
 "worker.work_location.name",
 "worker.projectName",
 "worker.project_name",
 "worker.project.name",
 "worker.project",
 "worker.locationName",
 "worker.location_name",
 "user.workLocationName",
 "user.work_location_name",
 "user.projectName",
 "user.project_name",
 "user.worker.workLocationName",
 "user.worker.work_location_name",
 ])) ||
 null;

 const crewName =
 asString(firstValue(payload, [
 "crewName",
 "crew_name",
 "crew.name",
 "workCrew.name",
 "work_crew.name",
 "worker.crewName",
 "worker.crew_name",
 "worker.crew.name",
 "worker.workCrew.name",
 "worker.work_crew.name",
 "user.crewName",
 "user.crew_name",
 "user.worker.crewName",
 "user.worker.crew_name",
 ])) ||
 null;

 const laborStatus =
 asString(firstValue(payload, [
 "laborStatus",
 "labor_status",
 "status",
 ])) ||
 null;

 const finalPositionName =
 (positionName && positionName !== "No informado") ? positionName :
 (user.worker?.position && user.worker.position !== "No informado") ? user.worker.position :
 (user.position && user.position !== "No informado") ? user.position :
 null;

 const finalAreaName =
 (areaName && areaName !== "No informado") ? areaName :
 (user.worker?.area_name && user.worker.area_name !== "No informado") ? user.worker.area_name :
 (user.department && user.department !== "No informado") ? user.department :
 null;

 const finalWorkLocationName =
 (workLocationName && workLocationName !== "No informado") ? workLocationName :
 (user.worker?.work_location_name && user.worker.work_location_name !== "No informado") ? user.worker.work_location_name :
 (user.project && user.project !== "No informado") ? user.project :
 null;

 const finalCrewName =
 (crewName && crewName !== "No informado") ? crewName :
 (user.worker?.crew_name && user.worker.crew_name !== "No informado") ? user.worker.crew_name :
 null;

 return {
 id: safeWorkerId,
 worker_id: safeWorkerId || null,
 workerId: safeWorkerId || null,
 userId: safeUserId,
 user_id: safeUserId || null,
 profile_status: safeWorkerId ? "complete" : "incomplete",
 profileStatus: safeWorkerId ? "complete" : "incomplete",
 fullName: user.fullName,
 email: user.email,
 role: user.role === "unknown" ? "worker" : user.role,
 position: finalPositionName || "No informado",
 project: finalWorkLocationName || undefined,
 department: finalAreaName || undefined,
 status: user.status,
 phone: user.phone,
 documentNumber,
 birthDate: normalizeDateString(
 firstValue(payload, ["birthDate", "birth_date", "date_of_birth", "fecha_nacimiento"]),
 ) || undefined,
 // Labor assignment fields
 work_location_id:
 (asString(firstValue(payload, ["work_location_id", "workLocationId"])) || null),
 work_location_name:
 finalWorkLocationName || (asString(firstValue(payload, ["work_location_name", "workLocationName", "work_location.name"])) || null),
 sede_id:
 (asString(firstValue(payload, ["sede_id", "sedeId", "branch_id", "branchId"])) || null),
 internal_department_id:
 (asString(firstValue(payload, ["internal_department_id", "internalDepartmentId", "department_id"])) || null),
 area_id:
 (asString(firstValue(payload, ["area_id", "areaId"])) || null),
 position_id:
 (asString(firstValue(payload, ["position_id", "positionId"])) || null),
 crew_id:
 asString(firstValue(payload, ["crew_id", "crewId", "worker.crew_id", "worker.crewId", "worker.crew.id"])) ||
 user.worker?.crew_id ||
 null,
 crew_name:
 finalCrewName ||
 asString(firstValue(payload, ["crew_name", "crewName", "worker.crew_name", "worker.crewName", "worker.crew.name"])) ||
 user.worker?.crew_name ||
 null,
 crewName:
 finalCrewName ||
 asString(firstValue(payload, ["crewName", "crew_name", "worker.crewName", "worker.crew_name", "worker.crew.name"])) ||
 user.worker?.crew_name ||
 null,
 roleName,
 roleCode,
 positionName: finalPositionName,
 areaName: finalAreaName,
 departmentName: departmentName || finalAreaName,
 workLocationName: finalWorkLocationName,
 laborStatus,
 avatarUrl: user.avatarUrl || null,
 profilePhotoUrl: user.avatarUrl || null,
 };
}


export function normalizeBirthdayWorker(source: unknown): BirthdayWorker | null {
 const user = normalizeUser(source);
 const birthday =
 normalizeDateString(
 firstValue(source, ["birthday", "birthDate", "birth_date", "date_of_birth", "fecha_nacimiento"]),
 ) || undefined;

 if (!birthday) {
 return null;
 }

 const role =
 asString(
 firstValue(source, [
 "roleTitle",
 "jobTitle",
 "position",
 "cargo",
 "job_position_name",
 "role",
 ]),
 ) ||
 user.position ||
 "Miembro del equipo";

 return {
 id: user.id,
 fullName: user.fullName,
 role,
 department:
 asString(firstValue(source, ["department", "area", "department_name"])) || user.department || undefined,
 birthday,
 avatarUrl:
 cleanAvatarUrl(
 firstValue(source, [
 "avatarUrl",
 "avatar_url",
 "profilePhotoUrl",
 "profile_photo_url",
 "photoUrl",
 "photo_url",
 "imageUrl",
 "image_url",
 "picture",
 "pictureUrl",
 "picture_url",
 ]),
 ) ||
 user.avatarUrl ||
 undefined,
 isCurrentUser: Boolean(firstValue(source, ["isCurrentUser", "is_current_user"])),
 };
}

export function normalizeReports(payload: unknown) {
 const items =
 normalizePaginated(payload, (entry): ReportRecord => {
 const record = asRecord(entry) ?? {};

 return {
 id: asString(firstValue(record, ["id", "_id", "uuid", "reportId", "report_id"]), "No informado"),
 title: asString(firstValue(record, ["title", "titulo"]), "No informado"),
 description: asString(firstValue(record, ["description", "descripcion"]), "No informado"),
 updatedAt: asString(firstValue(record, ["updatedAt", "fecha", "updated_at"])),
 category: asString(firstValue(record, ["category", "categoria"]), "No informado"),
 };
 });

 return items.items;
}

export function normalizePayrollPeriods(payload: unknown): PayrollPeriod[] {
 const collection =
 (Array.isArray(payload) ? payload : undefined) ??
 (firstValue(payload, ["items", "results", "periods", "data.items", "data.periods", "data"]) as
 | unknown[]
 | undefined) ??
 [];

 return collection.map((entry) => {
 const record = asRecord(entry) ?? {};
 const startDate = normalizeDateString(firstValue(record, ["startDate", "start_date", "from"]));
 const endDate = normalizeDateString(firstValue(record, ["endDate", "end_date", "to"]));

 return {
 id: asString(firstValue(record, ["id", "_id", "periodId", "period_id"]), "No informado"),
 label: asString(
 firstValue(record, ["label", "name", "period", "month", "code"]),
 [startDate, endDate].filter(Boolean).join(" - ") || "Periodo sin nombre",
 ),
 startDate: startDate || undefined,
 endDate: endDate || undefined,
 status: asString(firstValue(record, ["status", "estado"])) || undefined,
 };
 });
}

export function normalizeRoles(payload: unknown): RoleDefinition[] {
 const rawItems =
 (Array.isArray(payload) ? payload : undefined) ??
 (firstValue(payload, ["items", "data", "roles"]) as unknown[] | undefined) ??
 [];

 return rawItems.map((entry) => {
 const record = asRecord(entry) ?? {};
 const modules = asArray(firstValue(record, ["modules", "permissions"])).map((moduleEntry) => {
 const moduleRecord = asRecord(moduleEntry) ?? {};

 let rawAccess = asString(firstValue(moduleRecord, ["access", "level"]), "read").toLowerCase();
 if (rawAccess === "manage") rawAccess = "admin";

 return {
 key: asString(firstValue(moduleRecord, ["key", "module", "name"]), "No informado"),
 label: asString(firstValue(moduleRecord, ["label", "name"]), "No informado"),
 access: (rawAccess as RoleDefinition["modules"][number]["access"]) || "read",
 };
 });

 const identifier = asString(firstValue(record, ["role_key", "code", "role"]), "");

 return {
 id: asString(firstValue(record, ["id", "uuid", "_id"]), crypto.randomUUID?.() || "1"),
 name: asString(firstValue(record, ["name", "label"]), ""),
 label: asString(firstValue(record, ["label", "name"]), "No informado"),
 identifier,
 role_key: asString(firstValue(record, ["role_key", "code"]), identifier),
 code: asString(firstValue(record, ["code", "role_key"]), identifier),
 role: asString(firstValue(record, ["role"]), identifier.toLowerCase()),
 description: asString(firstValue(record, ["description", "descripcion"]), ""),
 is_active: (firstValue(record, ["is_active", "isActive", "status", "estado"]) !== false && firstValue(record, ["is_active", "isActive", "status", "estado"]) !== "inactive"),
 protected: firstValue(record, ["protected"]) === true || firstValue(record, ["is_system_role"]) === true,
 is_system_role: firstValue(record, ["is_system_role"]) === true,
 modules,
 };
 });
}

export interface OnboardingAccessData {
 roleId: string | null;
 role: string | null;
 roleName: string | null;
 roleCode: string | null;
 username: string | null;
 corporateEmail: string | null;
}

export function normalizePrefillAccessData(raw: any): OnboardingAccessData {
 const accessData = raw?.accessData ?? raw?.access_data ?? {};

 return {
 roleId:
 accessData?.roleId ??
 accessData?.role_id ??
 accessData?.role?.id ??
 accessData?.role?.uuid ??
 null,

 role:
 typeof accessData?.role === "string"
 ? accessData.role
 : accessData?.role?.code ??
 accessData?.roleCode ??
 accessData?.role_code ??
 null,

 roleName:
 accessData?.roleName ??
 accessData?.role_name ??
 accessData?.role?.name ??
 null,

 roleCode:
 accessData?.roleCode ??
 accessData?.role_code ??
 accessData?.role?.code ??
 null,

 username:
 accessData?.username ?? null,

 corporateEmail:
 accessData?.corporateEmail ??
 accessData?.corporate_email ??
 accessData?.email ??
 null,
 };
}

export interface NormalizedUserRole {
 roleId: string | null;
 roleName: string | null;
 roleCode: string | null;
 displayRole: string;
}

export function normalizeUserRole(user: any): NormalizedUserRole {
 const roleId =
 user?.role_id ??
 user?.roleId ??
 user?.role?.id ??
 user?.role?.uuid ??
 user?.systemRole?.id ??
 null;

 const roleName =
 user?.roleName ??
 user?.role_name ??
 user?.role?.name ??
 user?.systemRole?.name ??
 (typeof user?.role === "string" ? user.role : null) ??
 null;

 const roleCode =
 user?.roleCode ??
 user?.role_code ??
 user?.role?.code ??
 user?.systemRole?.code ??
 (typeof user?.role === "string" ? user.role : null) ??
 null;

 return {
 roleId,
 roleName,
 roleCode,
 displayRole: roleName ?? roleCode ?? "No informado",
 };
}

export interface SuggestCredentialsData {
 username: string;
 corporateEmail: string;
 temporaryPassword: string;
 forcePasswordChange: boolean;
 alternatives: string[];
}

export function normalizeSuggestCredentialsData(raw: any): SuggestCredentialsData {
 const root = raw?.data ?? raw;
 const temporaryPassword =
 raw?.temporaryPassword ??
 raw?.temporary_password ??
 raw?.data?.temporaryPassword ??
 raw?.data?.temporary_password ??
 root?.temporaryPassword ??
 root?.temporary_password ??
 "";

 return {
 username: root?.username ?? "",

 corporateEmail:
 root?.corporateEmail ??
 root?.corporate_email ??
 "",

 temporaryPassword,

 forcePasswordChange:
 root?.forcePasswordChange ??
 root?.force_password_change ??
 true,

 alternatives:
 root?.alternatives ??
 root?.username_suggestions ??
 [],
 };
}

export function normalizeCrewWorkerItem(raw: any): CrewWorkerItem {
 const activeAssignment = raw?.active_assignment ?? raw?.activeAssignment ?? {};
 const avatarUrl = cleanAvatarUrl(
 raw?.avatarUrl ??
 raw?.avatar_url ??
 raw?.profilePhotoUrl ??
 raw?.profile_photo_url ??
 raw?.photoUrl ??
 raw?.photo_url ??
 raw?.imageUrl ??
 raw?.image_url ??
 raw?.picture ??
 raw?.pictureUrl ??
 raw?.picture_url
 );

 return {
 id: raw?.id ?? raw?.worker_id ?? raw?.workerId,
 worker_id: raw?.worker_id ?? raw?.workerId ?? raw?.id,
 worker_name: raw?.worker_name ?? raw?.workerName ?? raw?.fullName ?? "Sin nombre",
 document_number:
 raw?.document_number ?? raw?.documentNumber ?? raw?.dni ?? raw?.personal_id ?? "Sin documento",
 crew_id: raw?.crew_id ?? raw?.crewId,
 email: raw?.worker_email ?? raw?.email ?? "",
 phone: raw?.phone ?? raw?.phone_number ?? "",
 crew_name: raw?.crew_name ?? raw?.crewName ?? "",
 avatarUrl,
 profilePhotoUrl: avatarUrl,
 active_assignment: {
 source: activeAssignment?.source === "individual_temporary_location_assignment"
 ? "temporary_assignment"
 : activeAssignment?.source === "individual_permanent_location_assignment"
 ? "direct_worker_location"
 : activeAssignment?.source ?? "crew_location",
 assignment_id:
 activeAssignment?.assignment_id ?? activeAssignment?.assignmentId ?? null,
 assignment_type:
 activeAssignment?.assignment_type ?? activeAssignment?.assignmentType ?? null,
 work_location_id:
 activeAssignment?.work_location_id ??
 activeAssignment?.workLocationId ??
 "",
 work_location_name:
 activeAssignment?.work_location_name ??
 activeAssignment?.workLocationName ??
 "Sin ubicación",
 start_date:
 activeAssignment?.start_date ?? activeAssignment?.startDate ?? null,
 end_date:
 activeAssignment?.end_date ?? activeAssignment?.endDate ?? null,
 reason: activeAssignment?.reason ?? null,
 auto_return:
 activeAssignment?.auto_return ?? activeAssignment?.autoReturn ?? false,
 },
 };
}
