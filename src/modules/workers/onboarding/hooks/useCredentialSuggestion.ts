import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { onboardingService } from "../services/onboarding.service";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";

type SuggestCredentialsData = {
  username: string;
  corporateEmail?: string;
  corporate_email?: string;
  temporaryPassword?: string;
  temporary_password?: string;
  alternatives?: string[];
};

export function useCredentialSuggestion(setValue: UseFormSetValue<OnboardingFormValues>) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const suggestCredentials = async (
    companyId: string,
    firstName: string,
    paternalLastName: string,
    maternalLastName?: string
  ) => {
    if (!companyId) {
      setError("Selecciona una empresa antes de sugerir credenciales.");
      return;
    }
    if (!firstName || !paternalLastName) {
      setError("Completa el nombre y apellido paterno antes de sugerir credenciales.");
      return;
    }

    setIsSuggesting(true);
    setError(null);
    setAlternatives([]);

    try {
      const response = await onboardingService.suggestCredentials({
        company_id: companyId,
        first_name: firstName,
        paternal_last_name: paternalLastName,
        maternal_last_name: maternalLastName,
      });

      if (response && response.data) {
        const data = response.data as SuggestCredentialsData;
        const username = data.username;
        const corporateEmail = data.corporateEmail || data.corporate_email || "";
        const temporaryPassword = data.temporaryPassword || data.temporary_password;
        const alts = response.data.alternatives;

        setValue("accessData.username", username, { shouldValidate: true });
        setValue("accessData.corporateEmail", corporateEmail, { shouldValidate: true });
        if (temporaryPassword) {
          setValue("accessData.temporaryPassword", temporaryPassword, { shouldValidate: true });
        }
        if (alts) {
          setAlternatives(alts);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudieron sugerir credenciales.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return { suggestCredentials, isSuggesting, error, alternatives, setError };
}
