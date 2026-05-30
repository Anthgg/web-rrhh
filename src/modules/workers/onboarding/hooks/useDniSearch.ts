import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { onboardingService } from "../services/onboarding.service";
import type { OnboardingFormValues } from "../schemas/onboarding.schema";

export function useDniSearch(setValue: UseFormSetValue<OnboardingFormValues>) {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  const searchDni = async (dni: string) => {
    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
      setError("El DNI debe tener 8 digitos numericos.");
      setFullName(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    setFullName(null);

    try {
      const response = await onboardingService.getDni(dni);
      if (response?.success && response.data) {
        const info = response.data;
        setValue("personalData.firstName", info.first_name, { shouldValidate: true });
        setValue("personalData.paternalLastName", info.paternal_last_name, { shouldValidate: true });
        setValue("personalData.maternalLastName", info.maternal_last_name || "", { shouldValidate: true });
        setFullName(info.full_name);
        setError(null);
      } else {
        setError("No se pudo encontrar informacion para el DNI ingresado.");
        setFullName(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo encontrar informacion para el DNI ingresado.");
      setFullName(null);
    } finally {
      setIsSearching(false);
    }
  };

  return { searchDni, isSearching, error, fullName, setFullName, setError };
}
