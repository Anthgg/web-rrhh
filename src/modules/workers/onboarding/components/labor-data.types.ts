import type { FieldErrors, UseFormRegister, UseFormReturn, UseFormSetValue } from "react-hook-form";

import type { OnboardingFormValues } from "../schemas/onboarding.schema";
import type { CatalogItem } from "../types/onboarding.types";

export interface LaborDataFormProps {
  form: UseFormReturn<OnboardingFormValues>;
  preservePositionOnAreaChange?: boolean;
  catalogs: {
    companies: CatalogItem[];
    branches: CatalogItem[];
    departments: CatalogItem[];
    areas: CatalogItem[];
    positions: CatalogItem[];
    workLocations: CatalogItem[];
    workerTypes: CatalogItem[];
    shifts: CatalogItem[];
    supervisors?: CatalogItem[];
    isLoadingAreas?: boolean;
    isLoadingPositions?: boolean;
  };
}

export type LaborDataCatalogs = LaborDataFormProps["catalogs"];
export type LaborDataErrors = FieldErrors<OnboardingFormValues["laborData"]> | undefined;

export interface WorkCrew {
  id: string;
  name: string;
  supervisor_id?: string | null;
  supervisor_name?: string | null;
  isActive?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
}

export interface LaborFormSectionProps {
  register: UseFormRegister<OnboardingFormValues>;
  setValue: UseFormSetValue<OnboardingFormValues>;
  laborErrors: LaborDataErrors;
}

export interface LaborOrganizationUiState {
  preservePositionOnAreaChange: boolean;
  isCompanyLocked: boolean;
  hasSelectedDepartment: boolean;
  hasSelectedArea: boolean;
  hasAreas: boolean;
  hasPositions: boolean;
}

export interface LaborOrganizationFieldsProps extends LaborFormSectionProps {
  catalogs: LaborDataCatalogs;
  organizationState: LaborOrganizationUiState;
  selectedPositionId?: string | null;
  positionOptions: CatalogItem[];
}

export interface LaborWorkAssignmentFieldsProps extends LaborFormSectionProps {
  selectedWorkLocationId?: string;
  selectedCrewId?: string;
  selectedCrewName?: string | null;
  workLocationOptions: CatalogItem[];
  workCrews: WorkCrew[];
  isLoadingCrews: boolean;
  onOpenLocationModal: () => void;
}

