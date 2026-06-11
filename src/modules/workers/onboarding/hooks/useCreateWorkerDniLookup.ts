import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { CreateWorkerFormValues } from "../schemas/create-worker.schema";
import { createWorkerService } from "../services/create-worker.service";

export function useCreateWorkerDniLookup(setValue: UseFormSetValue<CreateWorkerFormValues>) {
 const [isSearching, setIsSearching] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [fullName, setFullName] = useState<string | null>(null);

 const clearLookup = () => {
 setError(null);
 setFullName(null);
 setValue("firstName", "");
 setValue("paternalLastName", "");
 setValue("maternalLastName", "");
 };

 const searchDni = async (dni: string) => {
 if (!/^\d{8}$/.test(dni)) {
 setError("Ingresa un DNI de 8 digitos.");
 setFullName(null);
 return;
 }

 setIsSearching(true);
 setError(null);

 try {
 const response = await createWorkerService.getDni(dni);
 const data = response.data;

 if (!response.success || !data) {
 throw new Error("No se encontro informacion para el DNI.");
 }

 setValue("firstName", data.first_name || "", { shouldValidate: true });
 setValue("paternalLastName", data.paternal_last_name || "", { shouldValidate: true });
 setValue("maternalLastName", data.maternal_last_name || "", { shouldValidate: true });
 setFullName(
 data.full_name ||
 [data.first_name, data.paternal_last_name, data.maternal_last_name]
 .filter(Boolean)
 .join(" "),
 );
 } catch (lookupError) {
 setError(
 lookupError instanceof Error
 ? lookupError.message
 : "No se pudo consultar el DNI.",
 );
 setFullName(null);
 } finally {
 setIsSearching(false);
 }
 };

 return {
 clearLookup,
 error,
 fullName,
 isSearching,
 searchDni,
 };
}
