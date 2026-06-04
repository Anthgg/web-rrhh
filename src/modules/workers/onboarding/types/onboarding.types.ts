export interface PersonalDataPayload {
  dni: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  phone?: string;
  secondaryPhone?: string;
  personalEmail?: string;
  address?: string;
  departmentId?: string;
  provinceId?: string;
  districtId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface LaborDataPayload {
  companyId: string;
  branchId?: string;
  departmentId?: string;
  areaId: string;
  positionId: string;
  workLocationId: string;
  workerTypeId?: string;
  shiftId?: string;
  startDate: string;
  supervisorId?: string;
  status: "active" | "inactive";
  requiresAttendance?: boolean;
}

export interface CompleteProfilePayload {
  personalData?: {
    firstName: string;
    paternalLastName: string;
    maternalLastName?: string;
    dni: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    department_id?: string;
  };
  laborData?: {
    companyId: string;
    branchId?: string;
    departmentId: string;
    department_id?: string;
    internalDepartmentId?: string;
    internal_department_id?: string;
    areaId: string;
    positionId: string;
    workLocationId: string;
    workerTypeId?: string;
    startDate: string;
    entryDate?: string;
    status: "active" | "inactive";
    shiftId?: string;
    supervisorId?: string;
  };
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  department_id?: string;
  internalDepartmentId?: string;
  internal_department_id?: string;
  areaId?: string;
  positionId?: string;
  workLocationId?: string;
  workerTypeId?: string;
  entryDate?: string;
  status?: "active" | "inactive";
  shiftId?: string;
  supervisorId?: string;
}

export interface CompleteProfileUserPayload {
  fullName: string;
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  birthDate?: string;
  phone?: string;
}

export interface CompleteProfileWarning {
  field?: string;
  message: string;
}

export interface ContractDataPayload {
  createContract: boolean;
  generateContract: boolean;
  requireGeneratedPdf?: boolean;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  trialPeriod?: boolean;
  salary?: number;
  currency?: string;
  workdayType?: string;
  workMode?: string;
  costCenterId?: string;
  observations?: string;
}

export interface AccessDataPayload {
  createAccess: boolean;
  role?: string;
  roleId?: string;
  username?: string;
  corporateEmail?: string;
  temporaryPassword?: string;
  forcePasswordChange?: boolean;
  sendCredentialsByEmail?: boolean;
}

export interface CreateOnboardingPayload {
  onboardingContext?: {
    mode: "create" | "complete";
    source?: "user-detail" | string;
    userId?: string;
    workerId?: string;
  };
  personalData: PersonalDataPayload;
  laborData: LaborDataPayload;
  contractData: ContractDataPayload;
  accessData: AccessDataPayload;
}

export interface OnboardingPrefillData {
  personalData?: Partial<PersonalDataPayload>;
  laborData?: Partial<LaborDataPayload & { departmentId?: string }>;
  contractData?: Partial<ContractDataPayload>;
  accessData?: Partial<AccessDataPayload>;
  sourceUserId?: string;
  sourceWorkerId?: string;
  missingFields?: string[];
}

export interface OnboardingPrefillResponse {
  success: boolean;
  data?: OnboardingPrefillData;
}

export interface CompleteProfileResponse {
  success: boolean;
  data?: {
    user?: Record<string, unknown>;
    labor_data?: Record<string, unknown>;
    laborData?: Record<string, unknown>;
    catalogs?: Record<string, unknown>;
    meta?: Record<string, unknown>;
  };
  warnings?: CompleteProfileWarning[];
}

export interface CompleteProfileSaveResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  warnings?: CompleteProfileWarning[];
}

export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: ApiFieldError[];
}

export interface OnboardingSuccessData {
  worker_id: string;
  user_id?: string;
  contract_id?: string;
  contract_pdf_url?: string;
  temporary_password?: string;
  warnings?: Array<string | CompleteProfileWarning>;
}

export interface OnboardingSuccessResponse {
  success: true;
  message: string;
  data: OnboardingSuccessData;
}

export interface SuggestCredentialsPayload {
  company_id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name?: string;
}

export interface SuggestCredentialsResponse {
  success: boolean;
  data: {
    username: string;
    corporateEmail: string;
    temporaryPassword?: string;
    alternatives?: string[];
  };
}

export interface GenerateContractPayload {
  contract_id: string;
}

export interface GenerateContractResponse {
  success: boolean;
  data?: {
    contract_id?: string;
    worker_id?: string;
    pdf_url?: string | null;
    file_name?: string | null;
    file_path?: string | null;
    generated_pdf_url?: string | null;
    signed_file_url?: string | null;
    download_url?: string | null;
    view_url?: string | null;
  };
  contractId?: string;
  fileUrl?: string;
}

export interface ContractDownloadResponse {
  success: boolean;
  data: {
    contract_id: string;
    pdf_url?: string | null;
    file_name?: string | null;
    generated_pdf_url: string | null;
    signed_file_url: string | null;
    download_url: string;
  };
}

export interface WorkerContractRecord {
  id?: string;
  contract_id?: string;
  worker_id?: string;
  generated_pdf_url?: string | null;
  pdf_url?: string | null;
  file_name?: string | null;
  signed_file_url?: string | null;
  download_url?: string | null;
  status?: string;
  startDate?: string;
  start_date?: string;
  createdAt?: string;
  created_at?: string;
}

export interface OnboardingStatusData {
  worker_created: boolean;
  user_created: boolean;
  contract_created: boolean;
  contract_generated: boolean;
  signed_contract_uploaded: boolean;
  completed: boolean;
  pending_steps: Array<"signed_contract_upload" | "contract_generation" | "user_creation" | string>;
}

export interface OnboardingStatusResponse {
  success: boolean;
  data: OnboardingStatusData;
}

export interface UploadSignedContractParams {
  workerId: string;
  file: File;
  contractId: string;
  signedAt: string;
  observations?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  schedule?: string; // For shifts
  departmentId?: string; // For areas depending on department
  areaId?: string; // For positions depending on area
}
