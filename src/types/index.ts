export type UserRole = "worker" | "supervisor" | "admin" | "hr" | "super_admin" | "unknown";

export interface VisualPreferences {
 theme: "light" | "dark" | "system";
 density: "comfortable" | "compact";
 accentColor: "green" | "blue" | "purple" | "gray";
}

export type CompanyAssetType = "logo" | "signature" | "stamp";

export interface CompanySettings {
 id: string;
 razon_social: string;
 nombre_comercial: string | null;
 ruc: string;
 direccion_fiscal: string | null;
 telefono: string | null;
 correo_corporativo: string | null;
 pagina_web: string | null;
 representante_legal: string | null;
 color_primario: string;
 color_secundario: string;
 color_texto: string;
 logo_url: string | null;
 firma_url: string | null;
 sello_url: string | null;
 updated_at: string | null;
}

export interface CompanySettingsPayload {
 razon_social: string;
 nombre_comercial: string;
 ruc: string;
 direccion_fiscal: string;
 telefono: string;
 correo_corporativo: string;
 pagina_web: string;
 representante_legal: string;
 color_primario: string;
 color_secundario: string;
 color_texto: string;
}

export interface CompanySettingsResponse {
 success: boolean;
 message: string;
 data: CompanySettings | null;
}

export type LoadableStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type RequestStatus =
 | "draft"
 | "pending"
 | "approved"
 | "observed"
 | "rejected"
 | "cancelled"
 | "unknown";

export type DocumentStatus = "available" | "missing" | "expired" | "pending" | "unknown";

export type WorkerStatus = "active" | "inactive" | "on-leave" | "unknown";

export type RequestDecision = "approved" | "observed" | "rejected";

export interface PaginatedResponse<T> {
 items: T[];
 total: number;
 page: number;
 pageSize: number;
 source: "api";
}

export interface ApiErrorPayload {
 message: string;
 status?: number;
 code?: string;
 errorCode?: string;
 details?: unknown;
}

export interface UserProfile {
 id: string;
 fullName: string;
 email: string;
 role: UserRole;
 roleName?: string | null;
 roleCode?: string | null;
 workerId?: string | null;
 hasWorkerRecord?: boolean;
 worker?: {
 id: string;
 personal_id?: string | null;
 department_id?: string | null;
 area_id?: string | null;
 position_id?: string | null;
 work_location_id?: string | null;
 crew_id?: string | null;
 supervisor_id?: string | null;
 position?: string | null;
 area_name?: string | null;
 department_name?: string | null;
 company_name?: string | null;
 address?: string | null;
 worker_type?: string | null;
 branch_name?: string | null;
 work_location_name?: string | null;
 crew_name?: string | null;
 supervisor_name?: string | null;
 status?: string | null;
 hire_date?: string | null;
 attendance_radius?: number | null;
 emergency_contact_name?: string | null;
 emergency_contact_phone?: string | null;
 emergency_contact_relationship?: string | null;
 } | null;
 supervisedCrew?: {
 id: string;
 name: string;
 work_location_name?: string | null;
 } | null;
 position: string;
 project?: string | null;
 department?: string | null;
 phone?: string | null;
 documentNumber?: string | null;
 personalId?: string | null;
 birthDate?: string | null;
 avatarUrl?: string | null;
 preferences?: VisualPreferences | null;
 forcePasswordChange?: boolean | null;
 gender?: string | null;
 genderLabel?: string | null;
 civilStatus?: string | null;
 civilStatusLabel?: string | null;
 nationality?: string | null;
 secondaryPhone?: string | null;
 personalEmail?: string | null;
 address?: string | null;
 province?: string | null;
 district?: string | null;
 departmentGeo?: string | null;
 emergencyContactName?: string | null;
 emergencyContactPhone?: string | null;
 emergencyContactRelationship?: string | null;
 status: WorkerStatus;
 permissions: string[];
 permissionsByModule?: Array<{
 module: string;
 access: string;
 moduleLabel?: string | null;
 accessLabel?: string | null;
 }>;
 security?: {
 emailVerified?: boolean | null;
 email_verified?: boolean | null;
 passwordChangeRequired?: boolean | null;
 password_change_required?: boolean | null;
 activeSessions?: number | null;
 active_sessions?: number | null;
 failedLoginAttempts?: number | null;
 failed_login_attempts?: number | null;
 } | null;
 activity?: Array<{
 id: string;
 action: string;
 actionLabel?: string;
 scope?: "actor" | "target" | string;
 description?: string;
 created_at?: string;
 actor_name?: string;
 }>;
 documents?: WorkerGeneratedDocument[];
 createdAt?: string | null;
 lastLoginAt?: string | null;
 positionName?: string | null;
 areaName?: string | null;
 companyName?: string | null;
 departmentName?: string | null;
 workLocationName?: string | null;
 crewName?: string | null;
 laborStatus?: string | null;
 shiftName?: string | null;
 modality?: string | null;
 costCenter?: string | null;
 supervisorName?: string | null;
 hireDate?: string | null;
 workerType?: string | null;
 branchName?: string | null;
 attendanceRadius?: number | null;
}

export interface WorkerGeneratedDocument {
 id: string;
 name: string;
 type: string;
 generatedAt: string;
 generatedBy: string;
 url?: string;
 fileName?: string;
}

export interface UserUpdatePayload {
 firstName?: string;
 lastName?: string;
 fullName: string;
 email: string;
 phone?: string;
 documentNumber?: string;
 birthDate?: string;
 role: string;
 status: string;
 isActive: boolean;
 requiresPasswordChange: boolean;
 emailVerified: boolean;
}

export interface TemporaryPasswordResetResult {
 success: boolean;
 temporaryPassword: string;
 requiresPasswordChange: boolean;
 generatedAt: string;
}

export interface WorkerLaborInfoPayload {
 dni: string;
 fullName: string;
 email: string;
 phone?: string;
 address?: string;
 company?: string;
 departmentId: string;
 areaId: string;
 positionId: string;
 workerType: string;
 hireDate: string;
 laborStatus: string;
 workLocationId: string;
 crewId?: string;
 supervisorId?: string;
 attendanceRadius?: number;
}

export interface SessionData {
 user: UserProfile;
 source: "api";
 accessToken?: string;
}

export interface DashboardMetric {
 id: string;
 label: string;
 value: string;
 trend: string;
 accent: "teal" | "slate" | "amber";
}

export interface DashboardEvent {
 id: string;
 title: string;
 description: string;
 timestamp: string;
 status: RequestStatus | DocumentStatus | WorkerStatus;
}

export interface DashboardSummary {
 metrics: DashboardMetric[];
 upcomingActions: DashboardEvent[];
 requestBreakdown: Array<{ label: string; value: number; color: string }>;
 workforceSnapshot: Array<{ label: string; value: number }>;
 source: "api";
}

export type AttendanceDashboardStatus =
 | "present"
 | "late"
 | "absent"
 | "pending-checkout"
 | "completed";

export type DashboardNotificationType =
 | "check-in"
 | "check-out"
 | "late"
 | "missing"
 | "request"
 | "geofence"
 | "incomplete";

export interface AttendanceSummary {
 totalWorkers: number;
 checkedInToday: number;
 notCheckedIn: number;
 lateWorkers: number;
 absentWorkers: number;
 pendingCheckout: number;
 totalWorkedHours: number;
 averageWorkedHours: number;
}

export interface DashboardNotification {
 id: string;
 type: DashboardNotificationType;
 title: string;
 description: string;
 workerName?: string;
 timestamp: string;
 state: "success" | "warning" | "error" | "pending";
}

export interface DailyWorkedHour {
 id: string;
 workerName: string;
 position: string;
 project: string;
 checkIn?: string;
 checkOut?: string;
 workedHours: number;
 status: AttendanceDashboardStatus;
}

export interface QuickAccessItem {
 id: string;
 label: string;
 description: string;
 href: string;
 state?: "ready" | "pending";
}

export interface AdminAttendanceDashboard {
 summary: AttendanceSummary;
 notifications: DashboardNotification[];
 workedHours: DailyWorkedHour[];
 quickAccess: QuickAccessItem[];
 source: "mock";
}

export interface RequestRecord {
 id: string;
 type: string;
 title: string;
 description: string;
 status: RequestStatus;
 requestedBy: string;
 requesterId: string;
 project?: string;
 createdAt: string;
 startDate?: string;
 endDate?: string;
 approver?: string;
 comment?: string;
 canEdit: boolean;
 canCancel: boolean;
 canReview: boolean;
}

export interface RequestFilters {
 search?: string;
 status?: string;
 page?: number;
 pageSize?: number;
}

export interface RequestFormInput {
 type: string;
 title: string;
 description: string;
 startDate?: string;
 endDate?: string;
}

export interface ReviewRequestInput {
 decision: RequestDecision;
 comment?: string;
}

export interface DocumentRecord {
 id: string;
 title: string;
 category: string;
 ownerName: string;
 project?: string;
 status: DocumentStatus;
 updatedAt: string;
 url?: string;
}

export interface DocumentFilters {
 search?: string;
 status?: string;
 page?: number;
 pageSize?: number;
}

export interface WorkerRecord {
 id: string;
 userId?: string;
 user_id?: string | null;
 worker_id?: string | null;
 workerId?: string | null;
 profile_status?: "complete" | "incomplete";
 profileStatus?: "complete" | "incomplete";
 fullName: string;
 email: string;
 role: UserRole;
 position: string;
 project?: string | null;
 department?: string | null;
 status: WorkerStatus;
 phone?: string | null;
 documentNumber?: string | null;
 birthDate?: string | null;
 work_location_id?: string | null;
 work_location_name?: string | null;
 sede_id?: string | null;
 internal_department_id?: string | null;
 area_id?: string | null;
 position_id?: string | null;
 crew_id?: string | null;
 crew_name?: string | null;
 crewName?: string | null;
 roleName?: string | null;
 roleCode?: string | null;
 positionName?: string | null;
 areaName?: string | null;
 departmentName?: string | null;
 workLocationName?: string | null;
 laborStatus?: string | null;
 avatarUrl?: string | null;
 profilePhotoUrl?: string | null;
}

export interface BirthdayWorker {
 id: string;
 fullName: string;
 role: string;
 department?: string | null;
 birthday: string | null;
 avatarUrl?: string | null;
 isCurrentUser?: boolean;
}

export interface WorkerFilters {
 search?: string;
 status?: string;
 project?: string;
 page?: number;
 pageSize?: number;
}

export interface UserFilters {
 search?: string;
 status?: string;
 role?: string;
 page?: number;
 pageSize?: number;
}

export interface ReportRecord {
 id: string;
 title: string;
 description: string;
 updatedAt?: string;
 category: string;
 endpoint?: string;
 availability?: "available" | "unavailable";
 httpStatus?: number | null;
 message?: string | null;
 responseShape?: {
 type: "array" | "object" | "null" | "text";
 keys: string[];
 itemCount: number | null;
 };
}

export interface PayrollPeriod {
 id: string;
 label: string;
 startDate?: string;
 endDate?: string;
 status?: string;
}

/** All fields the user can edit via PATCH /api/profile/current */
export interface ProfileEditableFields {
 fullName: string;
 phone: string | null;
 personalEmail: string | null;
 secondaryPhone: string | null;
 address: string | null;
 province: string | null;
 district: string | null;
 emergencyContactName: string | null;
 emergencyContactPhone: string | null;
 emergencyContactRelationship: string | null;
}

/** @deprecated Use ProfileEditableFields or Partial<ProfileEditableFields> */
export type ProfileUpdateInput = Partial<ProfileEditableFields>;

/** Payload sent to POST /api/profile/password — no confirmPassword */
export interface ChangePasswordPayload {
 currentPassword: string;
 newPassword: string;
}

/** Form shape for the password change form (includes confirmPassword for client-side validation only) */
export interface ChangePasswordFormValues extends ChangePasswordPayload {
 confirmPassword: string;
}

/** @deprecated Use ChangePasswordFormValues for forms, ChangePasswordPayload for API calls */
export interface ChangePasswordInput extends ChangePasswordFormValues {}

/** Normalized security data from the profile backend response */
export interface NormalizedProfileSecurity {
 emailVerified: boolean | null;
 passwordChangeRequired: boolean | null;
 activeSessions: number | null;
 failedLoginAttempts: number | null;
}

/** Normalized activity item from profile.activity / audit_logs / logs */
export interface ProfileActivityItem {
 id: string;
 action: string | null;
 actionLabel: string | null;
 scope: string | null;
 description: string | null;
 createdAt: string | null;
 actorName: string | null;
}

export interface RoleDefinition {
 id: string;
 name?: string;
 label: string;
 identifier: string;
 role_key?: string;
 code?: string;
 role?: UserRole | (string & {});
 description?: string;
 is_active: boolean;
 protected?: boolean;
 is_system_role?: boolean;
 modules: Array<{
 key: string;
 label: string;
 access: "none" | "read" | "write" | "admin";
 }>;
}

export interface AreaDefinition {
 id: string;
 name: string;
 description?: string | null;
 department_id?: string | null;
 department_name?: string | null;
 role_id?: string | null;
 role_name?: string | null;
 role_code?: string | null;
 is_active: boolean;
}

export interface DepartmentDefinition {
 id: string;
 name: string;
 description?: string | null;
 is_active: boolean;
}

export type WorkerAssignmentSource =
 | "temporary_assignment"
 | "direct_worker_location"
 | "crew_location";

export interface WorkerActiveAssignment {
 source: WorkerAssignmentSource;
 assignment_id: string | null;
 assignment_type: "temporary" | "permanent" | null;
 work_location_id: string;
 work_location_name: string;
 start_date: string | null;
 end_date: string | null;
 reason: string | null;
 auto_return: boolean;
}

export interface CrewWorkerItem {
 id: string;
 worker_id: string;
 worker_name: string;
 document_number: string;
 crew_id: string;
 active_assignment: WorkerActiveAssignment;
 email?: string;
 phone?: string;
 crew_name?: string;
 avatarUrl?: string | null;
 profilePhotoUrl?: string | null;
}

export interface WorkCrewSummary {
 id: string;
 name: string;
 work_location_id: string;
 work_location_name: string;
 active_workers_count: number;
 temporarily_moved_workers_count: number;
 total_movements: number;
}

export interface CreateTemporaryAssignmentPayload {
 workLocationId: string;
 assignmentType: "temporary" | "permanent";
 reason?: string;
 endDate: string;
 autoReturn?: boolean;
}
