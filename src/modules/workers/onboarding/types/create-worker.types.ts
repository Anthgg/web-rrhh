export interface CreateWorkerPayload {
  dni: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  email?: string;
  address: string;
  department_id: string;
  province_id: string;
  district_id: string;
  area_id: string;
  job_position_id: string;
  start_date: string;
  contract_type: string;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface DniLookupData {
  dni: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  full_name?: string;
}

export type DniLookupResponse = ApiEnvelope<DniLookupData>;

export interface CreateWorkerSuccessData {
  email?: string;
  corporate_email?: string;
  username?: string;
  temporary_password?: string;
  temporaryPassword?: string;
}

export type CreateWorkerSuccessResponse = ApiEnvelope<CreateWorkerSuccessData>;

export interface WorkerCredentials {
  email: string;
  username: string;
  temporaryPassword: string;
}
