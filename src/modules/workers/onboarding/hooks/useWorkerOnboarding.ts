import { useEffect, useRef, useState, type FormEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FieldPath, Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onboardingSchema, type OnboardingFormValues } from "../schemas/onboarding.schema";
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
import { isUuid } from "@/lib/api/worker-ids";

const uuidOrUndefined = (value?: string | null): string | undefined =>
  value && isUuid(value) ? value : undefined;
const requiredUuidForPayload = (value: string, label: string) => {
  const uuid = uuidOrUndefined(value);
  if (!uuid) {
    throw new Error(`${label} debe ser un UUID valido.`);
  }

  return uuid;
};

const mergePrefill = (current: OnboardingFormValues, prefill?: OnboardingPrefillData): OnboardingFormValues => ({
  ...current,
  personalData: {
    ...current.personalData,
    ...(prefill?.personalData ?? {}),
  },
  laborData: {
    ...current.laborData,
    ...(prefill?.laborData ?? {}),
    status: prefill?.laborData?.status ?? current.laborData.status,
  },
  contractData: {
    ...current.contractData,
    ...(prefill?.contractData ?? {}),
  },
  accessData: {
    ...current.accessData,
    ...(prefill?.accessData ?? {}),
  },
});

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
  const rawUserId = searchParams.get("userId");
  const rawWorkerId = searchParams.get("workerId");
  const sourceUserId = rawUserId === "undefined" ? null : rawUserId;
  const sourceWorkerId = rawWorkerId === "undefined" ? null : rawWorkerId;
  const [step, setStep] = useState(1); // Steps 1 to 5 for form, 6 for Contract Upload, 7 for Status Check
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<OnboardingSuccessData | null>(null);
  const [completionWarnings, setCompletionWarnings] = useState<CompleteProfileWarning[]>([]);
  const [completionSaved, setCompletionSaved] = useState(false);
  const appliedPrefillKeyRef = useRef("");

  // 1. Fetch Catalogs using react-query
  const companiesQuery = useQuery({
    queryKey: ["catalog-companies"],
    queryFn: onboardingService.getCompanies,
    enabled: !completionMode,
    staleTime: 5 * 60 * 1000,
  });

  const branchesQuery = useQuery({
    queryKey: ["catalog-branches"],
    queryFn: onboardingService.getBranches,
    enabled: !completionMode,
    staleTime: 5 * 60 * 1000,
  });

  const departmentsQuery = useQuery({
    queryKey: ["catalog-internal-departments"],
    queryFn: onboardingService.getDepartments,
    enabled: !completionMode,
    staleTime: 10 * 60 * 1000,
  });

  const rolesQuery = useQuery({
    queryKey: ["catalog-system-roles"],
    queryFn: onboardingService.getRoles,
    enabled: !completionMode,
    staleTime: 10 * 60 * 1000,
  });

  const workerTypesQuery = useQuery({
    queryKey: ["catalog-worker-types"],
    queryFn: onboardingService.getWorkerTypes,
    enabled: !completionMode,
    staleTime: 5 * 60 * 1000,
  });

  const shiftsQuery = useQuery({
    queryKey: ["catalog-shifts"],
    queryFn: onboardingService.getShifts,
    enabled: !completionMode,
    staleTime: 5 * 60 * 1000,
  });

  const costCentersQuery = useQuery({
    queryKey: ["catalog-cost-centers"],
    queryFn: onboardingService.getCostCenters,
    enabled: !completionMode,
    staleTime: 5 * 60 * 1000,
  });

  const supervisorsQuery = useQuery({
    queryKey: ["catalog-supervisors"],
    queryFn: onboardingService.getSupervisors,
    enabled: !completionMode,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Initialize react-hook-form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingFormValues>,
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

  const areasQuery = useQuery({
    queryKey: ["catalog-areas-by-department", selectedDepartmentId],
    queryFn: () => onboardingService.getAreasByDepartment(selectedDepartmentId),
    enabled: !completionMode && isUuid(selectedDepartmentId),
    staleTime: 10 * 60 * 1000,
  });

  const positionsQuery = useQuery({
    queryKey: ["catalog-positions-by-area", selectedAreaId],
    queryFn: () => onboardingService.getPositionsByArea(selectedAreaId),
    enabled: !completionMode && isUuid(selectedAreaId),
    staleTime: 10 * 60 * 1000,
  });

  const workLocationsQuery = useQuery({
    queryKey: ["catalog-work-locations"],
    queryFn: () => onboardingService.getWorkLocations(),
    enabled: !completionMode,
    staleTime: 10 * 60 * 1000,
  });

  const completeProfileQuery = useQuery({
    queryKey: ["worker-complete-profile", sourceUserId],
    queryFn: () => onboardingService.getCompleteProfile(sourceUserId!),
    enabled: completionMode && Boolean(sourceUserId) && isUuid(sourceUserId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  });

  const prefillQuery = useQuery({
    queryKey: ["worker-onboarding-prefill", sourceUserId, sourceWorkerId],
    queryFn: () => onboardingService.getOnboardingPrefill({ userId: sourceUserId, workerId: sourceWorkerId }),
    enabled: !completionMode && (
      (Boolean(sourceUserId) && isUuid(sourceUserId)) ||
      (Boolean(sourceWorkerId) && isUuid(sourceWorkerId))
    ),
    retry: false,
  });

  const prefillData = prefillQuery.data?.data;
  const completeProfileData = completeProfileQuery.data?.data;
  const completeProfileCatalogs = completeProfileData?.catalogs;

  useEffect(() => {
    const prefill = prefillData;
    const key = `${sourceUserId || ""}:${sourceWorkerId || ""}:${JSON.stringify(prefill || {})}`;
    if (!prefill || appliedPrefillKeyRef.current === key) return;

    form.reset(mergePrefill(form.getValues(), prefill));
    appliedPrefillKeyRef.current = key;
  }, [form, prefillData, sourceUserId, sourceWorkerId]);

  useEffect(() => {
    const profile = completeProfileData;
    const key = `complete:${sourceUserId || ""}:${JSON.stringify(profile || {})}`;
    if (!profile || appliedPrefillKeyRef.current === key) return;

    form.reset(mergeCompleteProfile(form.getValues(), profile));
    appliedPrefillKeyRef.current = key;
  }, [completeProfileData, form, sourceUserId]);

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
          completeProfileQuery.refetch(),
        ]);
        router.refresh();
        router.push(`/trabajadores/${resolvedWorkerId}`);
        return;
      }

      const contextUserId = prefillData?.sourceUserId || sourceUserId;
      const contextWorkerId = prefillData?.sourceWorkerId || sourceWorkerId;
      const payload: CreateOnboardingPayload = {
        onboardingContext: completionMode
          ? {
              mode: "complete",
              source: "user-detail",
              ...(contextUserId ? { userId: contextUserId } : {}),
              ...(contextWorkerId ? { workerId: contextWorkerId } : {}),
            }
          : {
              mode: "create",
            },
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
              forcePasswordChange: data.accessData.forcePasswordChange,
              sendCredentialsByEmail: data.accessData.sendCredentialsByEmail,
            }
          : {
              createAccess: false,
            },
      };

      if (process.env.NODE_ENV !== "production") {
        console.debug("[onboarding] payload before submit", payload);
      }

      const response = await onboardingService.createOnboarding(payload);

      if (response && response.data) {
        setRegistrationResult(response.data);
        // Move to Contract Upload / Status Check Step (Step 6)
        setStep(6);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[onboarding] submit failed", {
            status: err.status,
            message: err.message,
            details: err.details,
          });
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
    companiesQuery.isLoading ||
    branchesQuery.isLoading ||
    areasQuery.isLoading ||
    positionsQuery.isLoading ||
    workLocationsQuery.isLoading ||
    departmentsQuery.isLoading ||
    rolesQuery.isLoading ||
    workerTypesQuery.isLoading ||
    shiftsQuery.isLoading ||
    costCentersQuery.isLoading ||
    supervisorsQuery.isLoading;

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
    onSubmit: completionMode ? submitCompletionProfile : handleSubmit(submitOnboarding),
    isSubmitting,
    globalError,
    registrationResult,
    completionMode,
    completionSaved,
    completionWarnings,
    isLoadingPrefill: completionMode ? completeProfileQuery.isLoading : prefillQuery.isLoading,
    missingFields: prefillData?.missingFields || [],
    catalogs: {
      companies: completionMode ? completionCatalogs.companies : companiesQuery.data || [],
      branches: completionMode ? completionCatalogs.branches : branchesQuery.data || [],
      departments: completionMode ? completionCatalogs.departments : departmentsQuery.data || [],
      areas: completionMode ? completionCatalogs.areas : areasQuery.data || [],
      positions: completionMode ? completionCatalogs.positions : positionsQuery.data || [],
      workLocations: completionMode ? completionCatalogs.workLocations : workLocationsQuery.data || [],
      roles: rolesQuery.data || [],
      workerTypes: completionMode ? completionCatalogs.workerTypes : workerTypesQuery.data || [],
      shifts: completionMode ? completionCatalogs.shifts : shiftsQuery.data || [],
      supervisors: completionMode ? completionCatalogs.supervisors : supervisorsQuery.data || [],
      costCenters: costCentersQuery.data || [],
      isLoading: completionMode ? completeProfileQuery.isLoading : isLoadingCatalogs,
      isLoadingAreas: completionMode ? false : areasQuery.isFetching,
      isLoadingPositions: completionMode ? false : positionsQuery.isFetching,
    },
  };
}
