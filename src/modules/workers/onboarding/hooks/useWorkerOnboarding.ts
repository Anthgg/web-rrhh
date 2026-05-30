import { useState } from "react";
import type { FieldPath, Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { onboardingSchema, type OnboardingFormValues } from "../schemas/onboarding.schema";
import { onboardingService } from "../services/onboarding.service";
import { ApiClientError } from "@/lib/api/client";
import type { CreateOnboardingPayload, OnboardingSuccessData } from "../types/onboarding.types";
import { isUuid } from "../utils/catalog-options";

const uuidOrUndefined = (value?: string | null): string | undefined =>
  value && isUuid(value) ? value : undefined;
const requiredUuidForPayload = (value: string, label: string) => {
  const uuid = uuidOrUndefined(value);
  if (!uuid) {
    throw new Error(`${label} debe ser un UUID valido.`);
  }

  return uuid;
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
    district: "personalData.district",
    districtid: "personalData.district",
    province: "personalData.province",
    provinceid: "personalData.province",
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
  const [step, setStep] = useState(1); // Steps 1 to 5 for form, 6 for Contract Upload, 7 for Status Check
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<OnboardingSuccessData | null>(null);

  // 1. Fetch Catalogs using react-query
  const companiesQuery = useQuery({
    queryKey: ["catalog-companies"],
    queryFn: onboardingService.getCompanies,
    staleTime: 5 * 60 * 1000,
  });

  const branchesQuery = useQuery({
    queryKey: ["catalog-branches"],
    queryFn: onboardingService.getBranches,
    staleTime: 5 * 60 * 1000,
  });

  const departmentsQuery = useQuery({
    queryKey: ["catalog-internal-departments"],
    queryFn: onboardingService.getDepartments,
    staleTime: 10 * 60 * 1000,
  });

  const rolesQuery = useQuery({
    queryKey: ["catalog-system-roles"],
    queryFn: onboardingService.getRoles,
    staleTime: 10 * 60 * 1000,
  });

  const workerTypesQuery = useQuery({
    queryKey: ["catalog-worker-types"],
    queryFn: onboardingService.getWorkerTypes,
    staleTime: 5 * 60 * 1000,
  });

  const shiftsQuery = useQuery({
    queryKey: ["catalog-shifts"],
    queryFn: onboardingService.getShifts,
    staleTime: 5 * 60 * 1000,
  });

  const costCentersQuery = useQuery({
    queryKey: ["catalog-cost-centers"],
    queryFn: onboardingService.getCostCenters,
    staleTime: 5 * 60 * 1000,
  });

  const supervisorsQuery = useQuery({
    queryKey: ["catalog-supervisors"],
    queryFn: onboardingService.getSupervisors,
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
        district: "",
        province: "",
        departmentId: "",
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
    enabled: isUuid(selectedDepartmentId),
    staleTime: 10 * 60 * 1000,
  });

  const positionsQuery = useQuery({
    queryKey: ["catalog-positions-by-area", selectedAreaId],
    queryFn: () => onboardingService.getPositionsByArea(selectedAreaId),
    enabled: isUuid(selectedAreaId),
    staleTime: 10 * 60 * 1000,
  });

  const workLocationsQuery = useQuery({
    queryKey: ["catalog-work-locations"],
    queryFn: () => onboardingService.getWorkLocations(),
    staleTime: 10 * 60 * 1000,
  });

  // 3. Step transition validation
  const nextStep = async () => {
    let isValid = false;

    if (step === 1) {
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
      setStep((prev) => prev + 1);
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
    clearErrors();

    try {
      const positionId = requiredUuidForPayload(data.laborData.positionId, "El puesto");
      const payload: CreateOnboardingPayload = {
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
          district: data.personalData.district || undefined,
          province: data.personalData.province || undefined,
          departmentId: data.personalData.departmentId || undefined,
          emergencyContactName: data.personalData.emergencyContactName || undefined,
          emergencyContactPhone: data.personalData.emergencyContactPhone || undefined,
        },
        laborData: {
          companyId: requiredUuidForPayload(data.laborData.companyId, "La empresa"),
          branchId: uuidOrUndefined(data.laborData.branchId),
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

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    form,
    onSubmit: handleSubmit(submitOnboarding),
    isSubmitting,
    globalError,
    registrationResult,
    catalogs: {
      companies: companiesQuery.data || [],
      branches: branchesQuery.data || [],
      departments: departmentsQuery.data || [],
      areas: areasQuery.data || [],
      positions: positionsQuery.data || [],
      workLocations: workLocationsQuery.data || [],
      roles: rolesQuery.data || [],
      workerTypes: workerTypesQuery.data || [],
      shifts: shiftsQuery.data || [],
      supervisors: supervisorsQuery.data || [],
      costCenters: costCentersQuery.data || [],
      isLoading: isLoadingCatalogs,
      isLoadingAreas: areasQuery.isFetching,
      isLoadingPositions: positionsQuery.isFetching,
    },
  };
}
