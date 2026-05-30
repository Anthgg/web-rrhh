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
  district?: string;
  province?: string;
  departmentId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface LaborDataPayload {
  companyId: string;
  branchId?: string;
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
  personalData: PersonalDataPayload;
  laborData: LaborDataPayload;
  contractData: ContractDataPayload;
  accessData: AccessDataPayload;
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
  warnings?: string[];
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
