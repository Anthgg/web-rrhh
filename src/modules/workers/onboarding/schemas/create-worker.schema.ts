import { z } from "zod";
import { isUuid } from "../utils/catalog-options";

const requiredUuid = (message: string) =>
 z
 .string()
 .min(1, message)
 .refine((value) => !value || isUuid(value), "Selecciona un registro con UUID valido.");

export const createWorkerSchema = z.object({
 dni: z
 .string()
 .min(1, "El DNI es obligatorio.")
 .length(8, "El DNI debe tener 8 digitos.")
 .regex(/^\d+$/, "El DNI solo debe contener numeros."),
 firstName: z.string().optional(),
 paternalLastName: z.string().optional(),
 maternalLastName: z.string().optional(),
 phone: z
 .string()
 .min(1, "El telefono es obligatorio.")
 .regex(/^\+?\d{7,15}$/, "Ingresa un telefono valido."),
 email: z
 .string()
 .optional()
 .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
 message: "Ingresa un correo valido.",
 }),
 address: z.string().min(1, "La direccion es obligatoria."),
 departmentId: requiredUuid("El departamento es obligatorio."),
 provinceId: requiredUuid("La provincia es obligatoria."),
 districtId: requiredUuid("El distrito es obligatorio."),
 areaId: requiredUuid("El area es obligatoria."),
 jobPositionId: requiredUuid("El puesto de trabajo es obligatorio."),
 startDate: z.string().min(1, "La fecha de ingreso es obligatoria."),
 contractType: z.string().min(1, "El tipo de contrato es obligatorio."),
});

export type CreateWorkerFormValues = z.infer<typeof createWorkerSchema>;
