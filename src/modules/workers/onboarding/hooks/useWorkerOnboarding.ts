import { useEffect, useRef, useState, type FormEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FieldPath, Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingSchema, onboardingBaseSchema, onboardingSuperRefine, type OnboardingFormValues } from "../schemas/onboarding.schema";
import { onboardingService } from "../services/onboarding.service";
import { ApiClientError } from "@/lib/api/client";
import type {
 CompleteProfileWarning,
 CompleteProfileUserPayload,
 CreateOnboardingPayload,
 OnboardingPrefillData,
 OnboardingSuccessData,
} from "../types/onboarding.types";
import { normalizeCatalogItems } from "../utils/catalog-options";
import { normalizeUserRole, normalizePrefillAccessData } from "@/lib/api/normalizers";
import { isUuid } from "@/lib/api/worker-ids";
import { toast } from "sonner";
import { profileService } from "@/services/profile.service";
import { normalizeCurrentUserProfile } from "@/lib/api/normalizers";
import { canReassignWorker, getApiErrorCode, getApiErrorDetails, WORKER_ASSIGNMENT_ERROR_MESSAGES } from "@/lib/api/error-handlers";
import { logger } from "@/lib/logger";

const uuidOrUndefined = (value?: string | null): string | undefined =>
 value && isUuid(value) ? value : undefined;
const requiredUuidForPayload = (value: string, label: string) => {
 const uuid = uuidOrUndefined(value);
 if (!uuid) {
 throw new Error(`${label} debe ser un UUID valido.`);
 }

 return uuid;
};

function extractResponseWarnings(response: any) {
 return (
 response?.warnings ??
 response?.data?.warnings ??
 response?.data?.data?.warnings ??
 []
 );
}

function handleCrewWarnings(warnings: any[]) {
 warnings.forEach((warning) => {
 const code = typeof warning === "string" ? warning : (warning.code ?? warning.errorCode);
 const message = typeof warning === "string" ? undefined : warning.message;

 if (code === "CREW_AUTO_ASSIGNED") {
 toast.info(
 message ??
 "El trabajador fue asignado automáticamente a la cuadrilla principal de la obra."
 );
 }

 if (code === "CREW_NOT_ASSIGNED") {
 toast.warning(
 message ??
 "El trabajador fue registrado en la obra, pero quedó sin cuadrilla asignada."
 );
 }
 });
}

const mergePrefill = (
 current: OnboardingFormValues,
 prefill?: OnboardingPrefillData,
 dirty?: any
): OnboardingFormValues => {
 const mergeWithDirty = (curr: any, pref: any, dirt: any) => {
 const res = { ...curr };
 if (!pref) return res;
 for (const key of Object.keys(pref)) {
 if (!dirt?.[key] && pref[key] !== undefined && pref[key] !== null) {
 res[key] = pref[key];
 }
 }
 return res;
 };

 return {
 ...current,
 personalData: mergeWithDirty(current.personalData, prefill?.personalData, dirty?.personalData),
 laborData: mergeWithDirty(current.laborData, prefill?.laborData, dirty?.laborData),
 contractData: mergeWithDirty(current.contractData, prefill?.contractData, dirty?.contractData),
 accessData: mergeWithDirty(current.accessData, prefill?.accessData, dirty?.accessData),
 };
};

const readString = (source: unknown, paths: string[]) => {
 if (!source || typeof source !== "object") return "";
 for (const path of paths) {
 const value = path.split(".").reduce<unknown>((current, key) => {
 if (!current || typeof current !== "object") return undefined;
 return (current as Record<string, unknown>)[key];
 }, source);

 if (typeof value === "string" && value.trim()) return value.trim();
 if (typeof value === "number") return String(value);
 }
 return "";
};

const splitFullName = (fullName: string) => {
 const parts = fullName.trim().split(/\s+/).filter(Boolean);
 return {
 firstName: parts.slice(0, Math.max(1, parts.length - 2)).join(" ") || parts[0] || "",
 paternalLastName: parts.length > 1 ? parts[parts.length - 2] : "",
 maternalLastName: parts.length > 2 ? parts[parts.length - 1] : "",
 };
};

const splitLastName = (lastName: string) => {
 const parts = lastName.trim().split(/\s+/).filter(Boolean);
 return {
 paternalLastName: parts[0] || "",
 maternalLastName: parts.slice(1).join(" "),
 };
};

const buildCompletionUserPayload = (personalData: OnboardingFormValues["personalData"]): CompleteProfileUserPayload => {
 const lastName = [personalData.paternalLastName, personalData.maternalLastName].filter(Boolean).join(" ");
 return {
 fullName: [personalData.firstName, lastName].filter(Boolean).join(" "),
 firstName: personalData.firstName,
 lastName: lastName || undefined,
 documentNumber: personalData.dni,
 birthDate: personalData.birthDate || undefined,
 phone: personalData.phone || undefined,
 };
};

const hasCompletionUserChanges = (
 payload: CompleteProfileUserPayload,
 user?: Record<string, unknown>,
) => {
 if (!user) return true;

 return (
 payload.fullName !== readString(user, ["full_name", "fullName", "name"]) ||
 (payload.firstName || "") !== readString(user, ["first_name", "firstName"]) ||
 (payload.lastName || "") !== readString(user, ["last_name", "lastName"]) ||
 (payload.documentNumber || "") !== readString(user, ["document_number", "documentNumber", "dni"]) ||
 (payload.birthDate || "") !== readString(user, ["birth_date", "birthDate", "date_of_birth", "dateOfBirth"]) ||
 (payload.phone || "") !== readString(user, ["phone"])
 );
};

const mergeCompleteProfile = (
 current: OnboardingFormValues,
 profile: NonNullable<Awaited<ReturnType<typeof onboardingService.getCompleteProfile>>["data"]>,
): OnboardingFormValues => {
 const user = profile.user;
 const profileRecord = profile as Record<string, unknown>;
 const laborData =
 profile.labor_data ??
 profile.laborData ??
 profileRecord.worker ??
 profileRecord.worker_data ??
 profileRecord.labor;
 const fullName = readString(user, ["full_name", "fullName", "name"]);
 const explicitLastName = readString(user, ["last_name", "lastName"]);
 const nameParts = splitFullName(fullName);
 const lastNameParts = explicitLastName ? splitLastName(explicitLastName) : null;

 // ── Access data: read role, username and email from the existing user ──────
 // Backend can return role in many shapes:
 // string: user.role = "SUPERVISOR"
 // object: user.role = { id: "uuid", name: "SUPERVISOR", code: "supervisor" }
 // nested: user.systemRole = { id: "uuid", name: "..." }
 // array: user.roles = [{ id: "uuid", ... }]
 const asRecord = (v: unknown): Record<string, unknown> | null =>
 v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

 const extractRoleId = (u: unknown): string => {
 const ur = asRecord(u) ?? {};
 // Direct UUID fields
 for (const k of ["role_id", "roleId"]) {
 const v = ur[k]; if (typeof v === "string" && v.trim()) return v.trim();
 }
 // Nested object: role.id / systemRole.id
 for (const k of ["role", "systemRole", "system_role"]) {
 const nested = asRecord(ur[k]);
 if (nested) {
 const id = nested.id ?? nested.uuid;
 if (typeof id === "string" && id.trim()) return id.trim();
 }
 }
 // Array of roles — take first
 const rolesArr = Array.isArray(ur.roles) ? ur.roles : [];
 const firstRole = asRecord(rolesArr[0]);
 if (firstRole) {
 const id = firstRole.id ?? firstRole.uuid;
 if (typeof id === "string" && id.trim()) return id.trim();
 }
 return "";
 };

 const extractRoleCode = (u: unknown): string => {
 const ur = asRecord(u) ?? {};
 // Nested object: role.code / role.name
 for (const k of ["role", "systemRole", "system_role"]) {
 const nested = asRecord(ur[k]);
 if (nested) {
 for (const nk of ["code", "name", "label", "role_key"]) {
 const v = nested[nk];
 if (typeof v === "string" && v.trim()) return v.trim();
 }
 }
 }
 // Plain string fields
 for (const k of ["role", "role_code", "roleCode", "system_role"]) {
 const v = ur[k];
 if (typeof v === "string" && v.trim()) return v.trim();
 }
 // Array of roles — take first name/code
 const rolesArr = Array.isArray(ur.roles) ? ur.roles : [];
 const firstRole = asRecord(rolesArr[0]);
 if (firstRole) {
 for (const nk of ["code", "name", "label"]) {
 const v = firstRole[nk];
 if (typeof v === "string" && v.trim()) return v.trim();
 }
 }
 return "";
 };

 const existingRoleId = extractRoleId(user);
 const existingRoleCode = extractRoleCode(user);
 const existingUsername = readString(user, ["username", "user_name", "login"]);
 const existingCorporateEmail = readString(user, [
 "corporate_email",
 "corporateEmail",
 "email",
 "work_email",
 "workEmail",
 ]);
 const hasExistingAccess = Boolean(existingRoleId || existingRoleCode || existingUsername);

 return {
 ...current,
 personalData: {
 ...current.personalData,
 dni: readString(user, ["document_number", "documentNumber", "dni"]) || current.personalData.dni,
 firstName: readString(user, ["first_name", "firstName"]) || nameParts.firstName || current.personalData.firstName,
 paternalLastName:
 readString(user, ["paternal_last_name", "paternalLastName"]) ||
 lastNameParts?.paternalLastName ||
 nameParts.paternalLastName ||
 current.personalData.paternalLastName,
 maternalLastName:
 readString(user, ["maternal_last_name", "maternalLastName"]) ||
 lastNameParts?.maternalLastName ||
 nameParts.maternalLastName ||
 current.personalData.maternalLastName,
 birthDate: readString(user, ["birth_date", "birthDate", "date_of_birth", "dateOfBirth"]) || current.personalData.birthDate,
 phone: readString(user, ["phone"]) || current.personalData.phone,
 personalEmail: readString(user, ["email"]) || current.personalData.personalEmail,
 },
 laborData: {
 ...current.laborData,
 companyId: readString(laborData, ["company_id", "companyId", "company.id", "company.uuid"]) || current.laborData.companyId,
 branchId: readString(laborData, ["branch_id", "branchId", "branch.id", "branch.uuid", "sede_id", "sedeId"]) || current.laborData.branchId,
 departmentId:
 readString(laborData, ["department_id", "departmentId", "department.id", "department.uuid"]) ||
 current.laborData.departmentId,
 areaId: readString(laborData, ["area_id", "areaId", "area.id", "area.uuid"]) || current.laborData.areaId,
 positionId:
 readString(laborData, ["position_id", "positionId", "position.id", "position.uuid", "job_position_id", "jobPositionId"]) ||
 current.laborData.positionId,
 workLocationId:
 readString(laborData, [
 "work_location_id",
 "workLocationId",
 "work_location.id",
 "work_location.uuid",
 "workLocation.id",
 "workLocation.uuid",
 "location_id",
 "locationId",
 "assigned_work_location_id",
 "assignedWorkLocationId",
 ]) || current.laborData.workLocationId,
 workerTypeId:
 readString(laborData, [
 "worker_type_id",
 "workerTypeId",
 "worker_type.id",
 "worker_type.uuid",
 "workerType.id",
 "workerType.uuid",
 "collaborator_type_id",
 "collaboratorTypeId",
 ]) || current.laborData.workerTypeId,
 shiftId: readString(laborData, ["shift_id", "shiftId", "shift.id", "shift.uuid"]) || current.laborData.shiftId,
 startDate: readString(laborData, ["entry_date", "entryDate", "start_date", "startDate"]) || current.laborData.startDate,
 supervisorId:
 readString(laborData, [
 "supervisor_id",
 "supervisorId",
 "supervisor.id",
 "supervisor.uuid",
 "direct_supervisor_id",
 "directSupervisorId",
 ]) || current.laborData.supervisorId,
 status: (readString(laborData, ["status"]) as "active" | "inactive") || current.laborData.status,
 crewId: readString(laborData, ["crew_id", "crewId", "crew.id", "crew.uuid"]) || current.laborData.crewId,
 crewName: readString(laborData, ["crew_name", "crewName", "crew.name"]) || current.laborData.crewName,
 },
 accessData: {
 ...current.accessData,
 // If the user already has a role configured, pre-select it and activate the access section
 ...(hasExistingAccess
 ? {
 createAccess: true,
 roleId: existingRoleId || current.accessData.roleId,
 role: existingRoleCode || current.accessData.role,
 username: existingUsername || current.accessData.username,
 corporateEmail: existingCorporateEmail || current.accessData.corporateEmail,
 }
 : {}),
 },
 };
};


type BackendValidationError = {
 field?: string;
 path?: string;
 message?: string;
 error?: string;
 msg?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
 Boolean(value && typeof value === "object");

const getValidationErrors = (details: unknown): BackendValidationError[] | null => {
 if (Array.isArray(details)) return details.filter(isRecord) as BackendValidationError[];
 if (!isRecord(details)) return null;

 const errorCollections = [
 details.errors,
 details.details,
 details.data,
 isRecord(details.details) ? details.details.errors : undefined,
 isRecord(details.data) ? details.data.errors : undefined,
 ];

 for (const collection of errorCollections) {
 if (Array.isArray(collection)) {
 return collection.filter(isRecord) as BackendValidationError[];
 }
 }

 return null;
};

const normalizeBackendField = (field: string) =>
 field
 .replace(/\[(\w+)\]/g, ".$1")
 .replace(/_/g, "")
 .toLowerCase();

const mapBackendFieldToFormPath = (field: string): string => {
 const fieldMap: Record<string, string> = {
 dni: "personalData.dni",
 firstname: "personalData.firstName",
 firstnamedata: "personalData.firstName",
 firstnamepersonaldata: "personalData.firstName",
 paternalastname: "personalData.paternalLastName",
 paternallastname: "personalData.paternalLastName",
 maternallastname: "personalData.maternalLastName",
 phone: "personalData.phone",
 personalemail: "personalData.personalEmail",
 email: "personalData.personalEmail",
 birthdate: "personalData.birthDate",
 address: "personalData.address",
 district: "personalData.districtId",
 districtid: "personalData.districtId",
 province: "personalData.provinceId",
 provinceid: "personalData.provinceId",
 companyid: "laborData.companyId",
 branchid: "laborData.branchId",
 departmentid: "laborData.departmentId",
 areaid: "laborData.areaId",
 positionid: "laborData.positionId",
 jobpositionid: "laborData.positionId",
 worklocationid: "laborData.workLocationId",
 workertypeid: "laborData.workerTypeId",
 shiftid: "laborData.shiftId",
 startdate: "laborData.startDate",
 supervisorid: "laborData.supervisorId",
 status: "laborData.status",
 contracttype: "contractData.contractType",
 salary: "contractData.salary",
 sueldo: "contractData.salary",
 currency: "contractData.currency",
 enddate: "contractData.endDate",
 costcenterid: "contractData.costCenterId",
 username: "accessData.username",
 corporateemail: "accessData.corporateEmail",
 temporarypassword: "accessData.temporaryPassword",
 password: "accessData.temporaryPassword",
 role: "accessData.role",
 roleid: "accessData.roleId",
 crewid: "laborData.crewId",
 crewname: "laborData.crewName",
 };

 const normalizedField = normalizeBackendField(field.split(".").pop() || field);
 const normalizedPath = normalizeBackendField(field);
 const mappedPath =
 fieldMap[normalizedPath] ||
 fieldMap[normalizedField] ||
 (field.includes(".") ? field : "");

 if (mappedPath) return mappedPath;
 return field;
};

export function useWorkerOnboarding() {
 const router = useRouter();
 const queryClient = useQueryClient();
 const searchParams = useSearchParams();
 const completionMode = searchParams.get("mode") === "complete";
 const sourceParam = searchParams.get("source");
 const contractMode = !completionMode && sourceParam === "contract";
 const rawUserId = searchParams.get("userId");
 const rawWorkerId = searchParams.get("workerId");
 const sourceUserId = rawUserId === "undefined" ? null : rawUserId;
 const sourceWorkerId = rawWorkerId === "undefined" ? null : rawWorkerId;
 const [step, setStep] = useState(1); // Steps 1 to 5 for form, 6 for Contract Upload, 7 for Status Check
 const prefillAutoAdvancedRef = useRef(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [globalError, setGlobalError] = useState<string | null>(null);
 const [assignmentConflict, setAssignmentConflict] = useState<any | null>(null);
 const [isReassignOpen, setIsReassignOpen] = useState(false);

 const { data: profile } = useQuery({
 queryKey: ["current-user-profile"],
 queryFn: () => profileService.get(),
 select: normalizeCurrentUserProfile,
 staleTime: 30 * 60 * 1000,
 });
 const [registrationResult, setRegistrationResult] = useState<OnboardingSuccessData | null>(null);
 const [completionWarnings, setCompletionWarnings] = useState<CompleteProfileWarning[]>([]);
 const [completionSaved, setCompletionSaved] = useState(false);
 const appliedPrefillKeyRef = useRef("");

 // 1. Fetch Catalogs using react-query
 const {
 data: companies = [],
 isLoading: isCompaniesLoading,
 } = useQuery({
 queryKey: ["catalog-companies"],
 queryFn: onboardingService.getCompanies,
 enabled: !completionMode,
 staleTime: 5 * 60 * 1000,
 });

 const {
 data: branches = [],
 isLoading: isBranchesLoading,
 } = useQuery({
 queryKey: ["catalog-branches"],
 queryFn: onboardingService.getBranches,
 enabled: !completionMode,
 staleTime: 5 * 60 * 1000,
 });

 const {
 data: departments = [],
 isLoading: isDepartmentsLoading,
 } = useQuery({
 queryKey: ["catalog-internal-departments"],
 queryFn: onboardingService.getDepartments,
 enabled: !completionMode,
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: roles = [],
 isLoading: isRolesLoading,
 } = useQuery({
 queryKey: ["catalog-system-roles"],
 queryFn: onboardingService.getRoles,
 // Roles are always needed — in completionMode the existing role must be pre-selectable
 // and the admin can reassign it. Other catalog queries stay disabled in completionMode.
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: workerTypes = [],
 isLoading: isWorkerTypesLoading,
 } = useQuery({
 queryKey: ["catalog-worker-types"],
 queryFn: onboardingService.getWorkerTypes,
 enabled: !completionMode,
 staleTime: 5 * 60 * 1000,
 });

 const {
 data: shifts = [],
 isLoading: isShiftsLoading,
 } = useQuery({
 queryKey: ["catalog-shifts"],
 queryFn: onboardingService.getShifts,
 enabled: !completionMode,
 staleTime: 5 * 60 * 1000,
 });

 const {
 data: costCenters = [],
 isLoading: isCostCentersLoading,
 } = useQuery({
 queryKey: ["catalog-cost-centers"],
 queryFn: onboardingService.getCostCenters,
 enabled: !completionMode,
 staleTime: 5 * 60 * 1000,
 });

 const {
 data: supervisors = [],
 isLoading: isSupervisorsLoading,
 } = useQuery({
 queryKey: ["catalog-supervisors"],
 queryFn: onboardingService.getSupervisors,
 enabled: !completionMode,
 staleTime: 5 * 60 * 1000,
 });

 // 2. Initialize react-hook-form
 const dynamicSchema = contractMode
 ? onboardingBaseSchema.extend({
 personalData: z.object({
 dni: z.string().optional(),
 firstName: z.string().optional(),
 paternalLastName: z.string().optional(),
 maternalLastName: z.string().optional(),
 birthDate: z.string().optional(),
 gender: z.string().optional(),
 civilStatus: z.string().optional(),
 nationality: z.string().optional(),
 phone: z.string().optional(),
 secondaryPhone: z.string().optional(),
 personalEmail: z.string().optional(),
 address: z.string().optional(),
 departmentId: z.string().optional(),
 provinceId: z.string().optional(),
 districtId: z.string().optional(),
 emergencyContactName: z.string().optional(),
 emergencyContactPhone: z.string().optional(),
 }),
 laborData: z.object({
 companyId: z.string().optional(),
 branchId: z.string().optional(),
 departmentId: z.string().optional(),
 areaId: z.string().optional(),
 positionId: z.string().optional(),
 workLocationId: z.string().optional(),
 workerTypeId: z.string().optional(),
 shiftId: z.string().optional(),
 startDate: z.string().optional(),
 supervisorId: z.string().optional(),
 status: z.string().optional(),
 }),
 }).superRefine(onboardingSuperRefine)
 : onboardingSchema;

 const form = useForm<OnboardingFormValues>({
 resolver: zodResolver(dynamicSchema) as Resolver<OnboardingFormValues>,
 mode: "onTouched",
 defaultValues: {
 personalData: {
 dni: "",
 firstName: "",
 paternalLastName: "",
 maternalLastName: "",
 phone: "",
 secondaryPhone: "",
 personalEmail: "",
 birthDate: "",
 gender: "",
 civilStatus: "",
 nationality: "Peruana",
 address: "",
 departmentId: "",
 provinceId: "",
 districtId: "",
 emergencyContactName: "",
 emergencyContactPhone: "",
 },
 laborData: {
 companyId: "",
 branchId: "",
 departmentId: "",
 areaId: "",
 positionId: "",
 workLocationId: "",
 workerTypeId: "",
 shiftId: "",
 startDate: new Date().toISOString().split("T")[0],
 supervisorId: "",
 status: "active",
 crewId: "",
 crewName: "",
 },
 contractData: {
 createContract: true,
 generateContract: true,
 contractType: "temporal",
 startDate: new Date().toISOString().split("T")[0],
 endDate: "",
 trialPeriod: true,
 salary: 0,
 currency: "PEN",
 workdayType: "full_time",
 workMode: "onsite",
 costCenterId: "",
 observations: "",
 },
 accessData: {
 createAccess: false,
 role: "",
 roleId: "",
 username: "",
 corporateEmail: "",
 temporaryPassword: "",
 forcePasswordChange: true,
 sendCredentialsByEmail: true,
 },
 },
 });

 const { trigger, handleSubmit, setError, clearErrors } = form;
 const selectedDepartmentId = useWatch({ control: form.control, name: "laborData.departmentId" });
 const selectedAreaId = useWatch({ control: form.control, name: "laborData.areaId" });

 const {
 data: areas = [],
 isFetching: isAreasFetching,
 isLoading: isAreasLoading,
 } = useQuery({
 queryKey: ["catalog-areas-by-department", selectedDepartmentId],
 queryFn: () => onboardingService.getAreasByDepartment(selectedDepartmentId),
 enabled: !completionMode && isUuid(selectedDepartmentId),
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: positions = [],
 isFetching: isPositionsFetching,
 isLoading: isPositionsLoading,
 } = useQuery({
 queryKey: ["catalog-positions-by-area", selectedAreaId],
 queryFn: () => onboardingService.getPositionsByArea(selectedAreaId),
 enabled: !completionMode && isUuid(selectedAreaId),
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: workLocations = [],
 isLoading: isWorkLocationsLoading,
 } = useQuery({
 queryKey: ["catalog-work-locations"],
 queryFn: () => onboardingService.getWorkLocations(),
 enabled: !completionMode,
 staleTime: 10 * 60 * 1000,
 });

 const {
 data: prefillResponse,
 isLoading: isPrefillLoading,
 } = useQuery({
 queryKey: ["worker-onboarding-prefill", sourceUserId, sourceWorkerId],
 queryFn: () => onboardingService.getOnboardingPrefill({ userId: sourceUserId, workerId: sourceWorkerId }),
 enabled: !completionMode && (
 (Boolean(sourceUserId) && isUuid(sourceUserId)) ||
 (Boolean(sourceWorkerId) && isUuid(sourceWorkerId))
 ),
 retry: false,
 });

 const prefillData = prefillResponse?.data;

 // The userId needed for complete-profile can come from:
 // a) URL params (sourceUserId) — set when navigating from user-detail
 // b) The prefill response (prefillData.sourceUserId) — set when navigating from workerId only
 const resolvedUserId = sourceUserId || prefillData?.sourceUserId || null;

 const {
 data: completeProfileResponse,
 isLoading: isCompleteProfileLoading,
 refetch: refetchCompleteProfile,
 } = useQuery({
 queryKey: ["worker-complete-profile", resolvedUserId],
 queryFn: () => onboardingService.getCompleteProfile(resolvedUserId!),
 // completionMode: full form hydration
 // contractMode: role-only fetch (rest of data comes from prefillQuery)
 enabled: Boolean(resolvedUserId) && isUuid(resolvedUserId) && (completionMode || contractMode),
 retry: false,
 refetchOnWindowFocus: false,
 refetchOnReconnect: false,
 staleTime: 5 * 60 * 1000,
 });

 const completeProfileData = completeProfileResponse?.data;
 const completeProfileCatalogs = completeProfileData?.catalogs;

 const isLoadingPrefill = completionMode ? isCompleteProfileLoading : isPrefillLoading;

 // Auto-select when catalog has exactly one item
 useEffect(() => {
 if (!completionMode && !isLoadingPrefill) {
 if (companies.length === 1 && !form.getValues("laborData.companyId")) {
 form.setValue("laborData.companyId", companies[0].id, { shouldValidate: true });
 }
 if (workerTypes.length === 1 && !form.getValues("laborData.workerTypeId")) {
 form.setValue("laborData.workerTypeId", workerTypes[0].id, { shouldValidate: true });
 }
 }
 }, [companies, workerTypes, completionMode, isLoadingPrefill, form]);

 useEffect(() => {
 const prefill = prefillData;
 const key = `${sourceUserId || ""}:${sourceWorkerId || ""}:${JSON.stringify(prefill || {})}`;
 if (!prefill || appliedPrefillKeyRef.current === key) return;

 form.reset(mergePrefill(form.getValues(), prefill, form.formState.dirtyFields));
 appliedPrefillKeyRef.current = key;

 // ── Role and AccessData extraction from raw prefill response ─────────────
 // Read the raw response and apply role/credentials fields defensively.
 const rawPrefill = prefillResponse as unknown as Record<string, unknown>;
 const rawData = (rawPrefill?.data ?? rawPrefill) as Record<string, unknown> | null;

 if (rawData) {
 const accessData = normalizePrefillAccessData(rawData);
 const dirtyFields = form.formState.dirtyFields;

 // Determine if accessData was explicitly provided by the backend response
 const hasAccessDataInPrefill = Boolean(rawData.accessData ?? rawData.access_data);

 if (accessData.roleId && !dirtyFields?.accessData?.roleId) {
 form.setValue("accessData.roleId", accessData.roleId || undefined);
 form.setValue("accessData.role", accessData.roleCode ?? accessData.roleName ?? accessData.roleId ?? undefined);
 form.setValue("accessData.createAccess", true);
 }

 if (accessData.username && !dirtyFields?.accessData?.username) {
 form.setValue("accessData.username", accessData.username || undefined);
 form.setValue("accessData.createAccess", true);
 }

 if (accessData.corporateEmail && !dirtyFields?.accessData?.corporateEmail) {
 form.setValue("accessData.corporateEmail", accessData.corporateEmail || undefined);
 form.setValue("accessData.createAccess", true);
 }

 // Try to find user/worker object with role info in common backend shapes as a fallback,
 // ONLY if accessData was not explicitly provided (or it was empty and roleId wasn't set).
 const userSources = [
 rawData.user,
 rawData.worker,
 rawData.userData,
 rawData.workerData,
 rawData.data,
 ].filter(Boolean);

 if (process.env.NODE_ENV !== "production") {
 logger.log("[onboarding:prefill] raw prefill response keys:", Object.keys(rawData));
 logger.log("[onboarding:prefill] accessData from backend:", rawData.accessData);
 logger.log("[onboarding:prefill] user sources tried:", userSources);
 }

 const currentRoleId = form.getValues("accessData.roleId");
 if (!currentRoleId && !hasAccessDataInPrefill) {
 // Try each user-shaped object until we find a roleId
 for (const userSource of userSources) {
 const { roleId, roleCode, roleName } = normalizeUserRole(userSource);
 if (roleId) {
 form.setValue("accessData.roleId", roleId || undefined);
 form.setValue("accessData.role", roleCode || roleName || roleId || undefined);
 form.setValue("accessData.createAccess", true);
 break;
 } else if (roleCode || roleName) {
 // No UUID but has name/code — store so the select can match by name
 form.setValue("accessData.role", roleCode || roleName || undefined);
 form.setValue("accessData.createAccess", true);
 break;
 }
 }
 }

 // Also try the accessData field in the raw response directly (if it wasn't processed yet)
 if (!hasAccessDataInPrefill) {
 const rawAccessData = (rawData.accessData ?? (prefill.accessData)) as Record<string, unknown> | null;
 if (rawAccessData) {
 const { roleId, roleCode, roleName } = normalizeUserRole(rawAccessData);
 const latestRoleId = form.getValues("accessData.roleId");
 if (!latestRoleId && roleId) {
 form.setValue("accessData.roleId", roleId || undefined);
 form.setValue("accessData.role", roleCode || roleName || roleId || undefined);
 form.setValue("accessData.createAccess", true);
 }
 }
 }
 }
 // ── END role extraction ───────────────────────────────────────────────────

 // In contract mode ("Generar contrato inicial") auto-advance to step 3 (salary/contract)
 // when personal + labor data are already prefilled from the existing worker record.
 if (contractMode && !prefillAutoAdvancedRef.current) {
 const vals = form.getValues();
 const hasPersonal =
 Boolean(vals.personalData.firstName?.trim()) &&
 Boolean(vals.personalData.paternalLastName?.trim()) &&
 Boolean(vals.personalData.dni?.trim());
 const hasLabor =
 Boolean(vals.laborData.companyId?.trim()) &&
 Boolean(vals.laborData.positionId?.trim());

 if (hasPersonal && hasLabor) {
 prefillAutoAdvancedRef.current = true;
 setStep(3);
 }
 }
 }, [form, prefillData, prefillResponse, sourceUserId, sourceWorkerId, contractMode]);

 useEffect(() => {
 const profile = completeProfileData;
 const key = `complete:${resolvedUserId || ""}:${JSON.stringify(profile || {})}`;
 if (!profile || appliedPrefillKeyRef.current === key) return;

 if (process.env.NODE_ENV !== "production") {
 const user = profile.user ?? profile;
 logger.log("[onboarding:complete-profile] user role fields:", {
 role: (user as Record<string,unknown>).role,
 roleId: (user as Record<string,unknown>).roleId,
 role_id: (user as Record<string,unknown>).role_id,
 systemRole: (user as Record<string,unknown>).systemRole,
 });
 }

 if (contractMode) {
 // In contractMode: ONLY extract the role — don't overwrite personal/labor/contract data
 // that was already prefilled from the prefill endpoint.
 const user = profile.user as unknown;
 const { roleId, roleCode, roleName } = normalizeUserRole(user);
 if (roleId) {
 form.setValue("accessData.roleId", roleId || undefined, { shouldValidate: false });
 form.setValue("accessData.role", roleCode || roleName || roleId || undefined, { shouldValidate: false });
 form.setValue("accessData.createAccess", true);
 } else if (roleCode || roleName) {
 form.setValue("accessData.role", roleCode || roleName || undefined, { shouldValidate: false });
 form.setValue("accessData.createAccess", true);
 }
 } else {
 // In completionMode: full merge — reset the whole form with backend data
 form.reset(mergeCompleteProfile(form.getValues(), profile));
 appliedPrefillKeyRef.current = key;
 }
 }, [completeProfileData, form, resolvedUserId, contractMode]);

 const validateCompletionPersonalData = () => {
 const personalData = form.getValues("personalData");
 clearErrors(["personalData.dni", "personalData.firstName", "personalData.paternalLastName", "personalData.phone"]);
 let isValid = true;

 if (!personalData.dni.trim()) {
 setError("personalData.dni", { message: "El DNI es obligatorio." });
 isValid = false;
 } else if (!/^\d{8}$/.test(personalData.dni)) {
 setError("personalData.dni", { message: "El DNI debe tener exactamente 8 digitos." });
 isValid = false;
 }

 if (!personalData.firstName.trim()) {
 setError("personalData.firstName", { message: "El nombre es obligatorio." });
 isValid = false;
 }

 if (!personalData.paternalLastName.trim()) {
 setError("personalData.paternalLastName", { message: "El apellido paterno es obligatorio." });
 isValid = false;
 }

 if (personalData.phone && !/^\+?\d{7,15}$/.test(personalData.phone)) {
 setError("personalData.phone", { message: "Ingresa un numero de telefono valido (7 a 15 digitos)." });
 isValid = false;
 }

 return isValid;
 };

 // 3. Step transition validation
 const nextStep = async () => {
 let isValid = false;

 if (completionMode && step === 1) {
 isValid = validateCompletionPersonalData();
 } else if (completionMode && step === 2) {
 isValid = await trigger("laborData");
 } else if (step === 1) {
 isValid = await trigger("personalData");
 } else if (step === 2) {
 isValid = await trigger("laborData");
 } else if (step === 3) {
 isValid = await trigger("contractData");
 } else if (step === 4) {
 isValid = await trigger("accessData");
 } else {
 isValid = true;
 }

 if (isValid) {
 setStep((prev) => {
 if (!completionMode) return prev + 1;
 return prev === 1 ? 2 : 5;
 });
 setGlobalError(null);
 }
 };

 const prevStep = () => {
 setStep((prev) => Math.max(1, prev - 1));
 setGlobalError(null);
 };

 // 4. Submit Registration
 const submitOnboarding = async (data: OnboardingFormValues) => {
 setIsSubmitting(true);
 setGlobalError(null);
 setCompletionWarnings([]);
 setCompletionSaved(false);
 clearErrors();

 const contextUserId = prefillData?.sourceUserId || sourceUserId;
 const contextWorkerId = prefillData?.sourceWorkerId || sourceWorkerId;

 try {
 const positionId = requiredUuidForPayload(data.laborData.positionId, "El puesto");
 if (completionMode) {
 if (!sourceUserId) {
 throw new Error("No se encontro el usuario origen para completar el perfil.");
 }

 const personalPayload = {
 firstName: data.personalData.firstName,
 paternalLastName: data.personalData.paternalLastName,
 maternalLastName: data.personalData.maternalLastName || undefined,
 dni: data.personalData.dni,
 email: data.personalData.personalEmail || undefined,
 phone: data.personalData.phone || undefined,
 ...(data.personalData.departmentId && isUuid(data.personalData.departmentId)
 ? { departmentId: data.personalData.departmentId, department_id: data.personalData.departmentId }
 : {}),
 };

 const companyId = requiredUuidForPayload(data.laborData.companyId, "La empresa");
 const departmentId = requiredUuidForPayload(data.laborData.departmentId, "El departamento interno");
 const areaId = requiredUuidForPayload(data.laborData.areaId, "El area");
 const workLocationId = requiredUuidForPayload(data.laborData.workLocationId, "El lugar de trabajo");

 const laborPayload = {
 companyId,
 branchId: uuidOrUndefined(data.laborData.branchId),
 departmentId,
 department_id: departmentId,
 internalDepartmentId: departmentId,
 internal_department_id: departmentId,
 areaId,
 positionId,
 workLocationId,
 workerTypeId: uuidOrUndefined(data.laborData.workerTypeId),
 startDate: data.laborData.startDate,
 entryDate: data.laborData.startDate,
 status: data.laborData.status,
 shiftId: uuidOrUndefined(data.laborData.shiftId),
 supervisorId: uuidOrUndefined(data.laborData.supervisorId),
 crewId: uuidOrUndefined(data.laborData.crewId) || null,
 crew_id: uuidOrUndefined(data.laborData.crewId) || null,
 };

 const nestedPayload = {
 personalData: personalPayload,
 laborData: laborPayload,
 };

 if (!isUuid(sourceUserId)) {
 throw new Error("El identificador de usuario no es un UUID valido.");
 }
 if (!isUuid(laborPayload.companyId)) {
 throw new Error("El identificador de empresa no es un UUID valido.");
 }
 if (!isUuid(laborPayload.departmentId)) {
 throw new Error("El identificador de departamento interno no es un UUID valido.");
 }
 if (!isUuid(laborPayload.areaId)) {
 throw new Error("El identificador de area no es un UUID valido.");
 }
 if (!isUuid(laborPayload.positionId)) {
 throw new Error("El identificador de cargo no es un UUID valido.");
 }
 const response = await onboardingService.completeProfile(sourceUserId, nestedPayload);
 const warnings = extractResponseWarnings(response);
 handleCrewWarnings(warnings);

 setCompletionWarnings(response.warnings ?? []);
 setCompletionSaved(true);
 setStep(5);
 const resObj = response && typeof response === "object" ? (response as unknown as Record<string, unknown>) : null;
 const resData = resObj && typeof resObj.data === "object" ? (resObj.data as Record<string, unknown>) : null;
 const resWorker = (resObj && typeof resObj.worker === "object" ? (resObj.worker as Record<string, unknown>) : null) ??
 (resData && typeof resData.worker === "object" ? (resData.worker as Record<string, unknown>) : null);

 const resolvedWorkerId =
 resData?.worker_id ??
 resData?.workerId ??
 resWorker?.worker_id ??
 resWorker?.workerId ??
 resWorker?.id ??
 resObj?.worker_id ??
 resObj?.workerId;

 if (!isUuid(resolvedWorkerId)) {
 throw new Error("El backend no devolvió un worker_id válido.");
 }

 await Promise.all([
 queryClient.invalidateQueries({ queryKey: ["workers"] }),
 queryClient.invalidateQueries({ queryKey: ["worker-detail", resolvedWorkerId] }),
 refetchCompleteProfile(),
 ]);
 router.refresh();
 router.push(`/trabajadores/${resolvedWorkerId}`);
 return;
 }

 const isExistingWorkerContract = Boolean(sourceWorkerId || prefillData?.sourceWorkerId);

 if (isExistingWorkerContract) {
 if (!contextWorkerId || !isUuid(contextWorkerId)) {
 throw new Error("workerId inválido para generar contrato inicial.");
 }
 }

 const onboardingContext = completionMode
 ? {
 mode: "complete" as const,
 source: "user-detail",
 ...(contextUserId ? { userId: contextUserId } : {}),
 ...(contextWorkerId ? { workerId: contextWorkerId } : {}),
 }
 : {
 mode: "create" as const,
 ...(contextWorkerId ? { workerId: contextWorkerId } : {}),
 ...(contextUserId ? { userId: contextUserId } : {}),
 };

 const payload: CreateOnboardingPayload = {
 onboardingContext,
 personalData: {
 dni: data.personalData.dni,
 firstName: data.personalData.firstName,
 paternalLastName: data.personalData.paternalLastName,
 maternalLastName: data.personalData.maternalLastName || undefined,
 birthDate: data.personalData.birthDate || undefined,
 gender: data.personalData.gender || undefined,
 civilStatus: data.personalData.civilStatus || undefined,
 nationality: data.personalData.nationality || undefined,
 phone: data.personalData.phone || undefined,
 secondaryPhone: data.personalData.secondaryPhone || undefined,
 personalEmail: data.personalData.personalEmail || undefined,
 address: data.personalData.address || undefined,
 departmentId: data.personalData.departmentId || undefined,
 provinceId: data.personalData.provinceId || undefined,
 districtId: data.personalData.districtId || undefined,
 emergencyContactName: data.personalData.emergencyContactName || undefined,
 emergencyContactPhone: data.personalData.emergencyContactPhone || undefined,
 },
 laborData: {
 companyId: requiredUuidForPayload(data.laborData.companyId, "La empresa"),
 branchId: uuidOrUndefined(data.laborData.branchId),
 departmentId: uuidOrUndefined(data.laborData.departmentId),
 areaId: requiredUuidForPayload(data.laborData.areaId, "El area"),
 positionId,
 workLocationId: requiredUuidForPayload(data.laborData.workLocationId, "El lugar de trabajo"),
 workerTypeId: uuidOrUndefined(data.laborData.workerTypeId),
 shiftId: uuidOrUndefined(data.laborData.shiftId),
 startDate: data.laborData.startDate,
 supervisorId: uuidOrUndefined(data.laborData.supervisorId),
 status: data.laborData.status,
 requiresAttendance: Boolean(uuidOrUndefined(data.laborData.shiftId)),
 crewId: uuidOrUndefined(data.laborData.crewId) || null,
 },
 contractData: data.contractData.createContract
 ? {
 createContract: true,
 generateContract: data.contractData.generateContract,
 requireGeneratedPdf: false,
 contractType: data.contractData.contractType,
 startDate: data.contractData.startDate,
 endDate: data.contractData.endDate || undefined,
 trialPeriod: data.contractData.trialPeriod,
 salary: Number(data.contractData.salary),
 currency: data.contractData.currency,
 workdayType: data.contractData.workdayType || undefined,
 workMode: data.contractData.workMode || undefined,
 costCenterId: uuidOrUndefined(data.contractData.costCenterId),
 observations: data.contractData.observations || undefined,
 }
 : {
 createContract: false,
 generateContract: false,
 },
 accessData: data.accessData.createAccess
 ? {
 createAccess: true,
 role: data.accessData.role || undefined,
 roleId: uuidOrUndefined(data.accessData.roleId),
 username: data.accessData.username || undefined,
 corporateEmail: data.accessData.corporateEmail || undefined,
 temporaryPassword: data.accessData.temporaryPassword || undefined,
 temporary_password: data.accessData.temporaryPassword || undefined,
 forcePasswordChange: data.accessData.forcePasswordChange,
 sendCredentialsByEmail: data.accessData.sendCredentialsByEmail,
 }
 : {
 createAccess: false,
 },
 };

 if (process.env.NODE_ENV !== "production") {
 logger.log("[onboarding] payload before submit", payload);
 }

 const response = await onboardingService.createOnboarding(payload);
 const warnings = extractResponseWarnings(response);
 handleCrewWarnings(warnings);

 if (response && response.data) {
 setRegistrationResult(response.data);

 const responseData = (response.data as any)?.data ?? response.data;
 const resolvedWorkerId = responseData?.workerId ?? responseData?.worker_id ?? contextWorkerId;
 const resolvedContractId = responseData?.contractId ?? responseData?.contract_id ?? null;

 if (contractMode) {
 if (!resolvedWorkerId || !isUuid(resolvedWorkerId)) {
 throw new Error("workerId inválido para volver al detalle.");
 }

 router.refresh();
 router.push(`/trabajadores/${resolvedWorkerId}`);
 return;
 }

 // Move to Contract Upload / Status Check Step (Step 6)
 setStep(6);
 }
 } catch (err: unknown) {
 if (err instanceof ApiClientError) {
 logger.error("[onboarding] submit failed", {
 status: err.status,
 message: err.message,
 details: err.details,
 });

 const errDetails = (err.details ?? getApiErrorDetails(err)) as Record<string, any> | undefined;
 const errorCode = err.code ?? errDetails?.code ?? errDetails?.errorCode ?? errDetails?.error_code ?? getApiErrorCode(err);

 // Conflict / occupied worker handling
 if (errorCode === "WORKER_ALREADY_ASSIGNED") {
 const workerId =
 errDetails?.workerId ??
 errDetails?.worker_id ??
 contextWorkerId ??
 completeProfileData?.labor_data?.worker_id ??
 completeProfileData?.labor_data?.workerId ??
 completeProfileData?.labor_data?.id ??
 completeProfileData?.laborData?.worker_id ??
 completeProfileData?.laborData?.workerId ??
 completeProfileData?.laborData?.id ??
 (completeProfileData as any)?.worker?.id ??
 (completeProfileData as any)?.worker?.worker_id ??
 (data as any)?.laborData?.workerId ??
 "";
 setAssignmentConflict({
 workerId,
 requestedWorkLocationId: data.laborData.workLocationId,
 requestedCrewId: data.laborData.crewId || null,
 details: errDetails,
 });
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_ALREADY_ASSIGNED);
 return;
 }

 if (errorCode === "WORKER_REASSIGN_FORBIDDEN") {
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_REASSIGN_FORBIDDEN);
 return;
 }

 if (errorCode === "WORKER_ALREADY_IN_CREW") {
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_ALREADY_IN_CREW);
 return;
 }

 if (errorCode === "WORKER_ASSIGNMENT_CONFLICT") {
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_ASSIGNMENT_CONFLICT);
 return;
 }

 if (errorCode === "INVALID_WORKER_ID") {
 setError("laborData.workerId" as any, {
 type: "server",
 message: "Selecciona un trabajador válido.",
 });
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.INVALID_WORKER_ID);
 return;
 }

 if (errorCode === "INVALID_CREW_ID") {
 setError("laborData.crewId", {
 type: "server",
 message: "Selecciona una cuadrilla válida.",
 });
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.INVALID_CREW_ID);
 return;
 }

 if (errorCode === "INVALID_WORK_LOCATION_ID") {
 setError("laborData.workLocationId", {
 type: "server",
 message: "Selecciona un lugar de trabajo válido.",
 });
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.INVALID_WORK_LOCATION_ID);
 return;
 }

 if (errorCode === "WORKER_NOT_FOUND") {
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_NOT_FOUND || "No se encontró el trabajador seleccionado.");
 return;
 } else if (errorCode === "WORKER_FORBIDDEN") {
 setGlobalError(WORKER_ASSIGNMENT_ERROR_MESSAGES.WORKER_FORBIDDEN || "No tienes acceso al trabajador seleccionado.");
 return;
 } else if (errorCode === "WORKER_USER_MISMATCH") {
 setGlobalError("El usuario no corresponde al trabajador seleccionado.");
 return;
 } else if (errorCode === "ACTIVE_CONTRACT_EXISTS") {
 setGlobalError("El trabajador ya tiene un contrato activo registrado.");
 return;
 }

 const CREW_ERROR_MESSAGES: Record<string, string> = {
 CREW_NOT_FOUND: "No se encontró la cuadrilla seleccionada.",
 CREW_INACTIVE: "La cuadrilla seleccionada no está activa.",
 CREW_LOCATION_MISMATCH:
 "La cuadrilla seleccionada no pertenece al lugar de trabajo indicado.",
 CREW_FORBIDDEN: "No tienes acceso a la cuadrilla seleccionada.",
 };

 if (errorCode && CREW_ERROR_MESSAGES[errorCode]) {
 setGlobalError(CREW_ERROR_MESSAGES[errorCode]);
 return;
 }

 const validationErrors = getValidationErrors(err.details);

 if (validationErrors && validationErrors.length > 0) {
 validationErrors.forEach((fieldErr) => {
 const fieldPath = fieldErr.field || fieldErr.path;
 if (fieldPath) {
 const formField = fieldPath.includes(".")
 ? fieldPath
 : mapBackendFieldToFormPath(fieldPath);
 const message = fieldErr.message || fieldErr.error || fieldErr.msg || "Valor no válido";
 setError(formField as FieldPath<OnboardingFormValues>, { message });
 }
 });
 setGlobalError("Existen errores de validación en el formulario. Por favor, corrígelos.");
 } else if (contractMode) {
 setGlobalError("No se pudo generar el contrato inicial. Intenta nuevamente.");
 } else {
 setGlobalError(err.message || "Ocurrió un error inesperado al registrar el colaborador.");
 }
 } else {
 setGlobalError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
 }
 } finally {
 setIsSubmitting(false);
 }
 };

 const isLoadingCatalogs =
 isCompaniesLoading ||
 isBranchesLoading ||
 isAreasLoading ||
 isPositionsLoading ||
 isWorkLocationsLoading ||
 isDepartmentsLoading ||
 isRolesLoading ||
 isWorkerTypesLoading ||
 isShiftsLoading ||
 isCostCentersLoading ||
 isSupervisorsLoading;

 const completeCatalog = (key: string, aliases: string[] = []) =>
 normalizeCatalogItems(aliases.reduce<unknown>(
 (found, alias) => found ?? completeProfileCatalogs?.[alias],
 completeProfileCatalogs?.[key],
 ));

 const completionCatalogs = {
 companies: completeCatalog("companies"),
 branches: completeCatalog("branches"),
 departments: completeCatalog("departments"),
 areas: completeCatalog("areas"),
 positions: completeCatalog("positions", ["job_positions"]),
 workLocations: completeCatalog("work_locations", ["workLocations"]),
 workerTypes: completeCatalog("worker_types", ["workerTypes"]),
 shifts: completeCatalog("shifts"),
 supervisors: completeCatalog("supervisors"),
 };

 const submitCompletionProfile: FormEventHandler<HTMLFormElement> = async (event) => {
 event.preventDefault();
 const isValid = validateCompletionPersonalData() && await trigger("laborData");
 if (!isValid) return;
 await submitOnboarding(form.getValues());
 };

 return {
 step,
 setStep,
 nextStep,
 prevStep,
 form,
 onSubmit: completionMode
 ? submitCompletionProfile
 : handleSubmit(
 submitOnboarding,
 (errors) => {
 logger.error("[onboarding] Form validation errors on submit:", errors);
 const errorList: string[] = [];
 const gatherErrors = (obj: unknown, prefix = "") => {
 if (!obj || typeof obj !== "object") return;
 const record = obj as Record<string, unknown>;
 if (typeof record.message === "string" && record.message) {
 errorList.push(`${prefix}: ${record.message}`);
 return;
 }
 for (const [key, value] of Object.entries(record)) {
 gatherErrors(value, prefix ? `${prefix}.${key}` : key);
 }
 };
 gatherErrors(errors);
 if (errorList.length > 0) {
 setGlobalError(
 `No se pudo enviar el formulario por errores de validación: ${errorList.join(" | ")}`
 );
 } else {
 setGlobalError("Existen errores de validación en el formulario.");
 }
 }
 ),
 isSubmitting,
 globalError,
 setGlobalError,
 registrationResult,
 completionMode,
 contractMode,
 completionSaved,
 completionWarnings,
 isLoadingPrefill,
 missingFields: prefillData?.missingFields || [],
 assignmentConflict,
 setAssignmentConflict,
 isReassignOpen,
 setIsReassignOpen,
 profileQuery: { data: profile },
 catalogs: {
 companies: completionMode ? completionCatalogs.companies : companies,
 branches: completionMode ? completionCatalogs.branches : branches,
 departments: completionMode ? completionCatalogs.departments : departments,
 areas: completionMode ? completionCatalogs.areas : areas,
 positions: completionMode ? completionCatalogs.positions : positions,
 workLocations: completionMode ? completionCatalogs.workLocations : workLocations,
 roles,
 workerTypes: completionMode ? completionCatalogs.workerTypes : workerTypes,
 shifts: completionMode ? completionCatalogs.shifts : shifts,
 supervisors: completionMode ? completionCatalogs.supervisors : supervisors,
 costCenters,
 isLoading: completionMode ? isCompleteProfileLoading : isLoadingCatalogs,
 isLoadingAreas: completionMode ? false : isAreasFetching,
 isLoadingPositions: completionMode ? false : isPositionsFetching,
 },
 };
}
