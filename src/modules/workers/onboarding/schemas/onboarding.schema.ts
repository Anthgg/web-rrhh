import { z } from "zod";
import { isUuid } from "../utils/catalog-options";

const requiredUuid = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((value) => !value || isUuid(value), "Debe seleccionar un registro con UUID vÃ¡lido.");

const optionalUuid = z
  .string()
  .optional()
  .refine((value) => !value || isUuid(value), "Debe seleccionar un registro con UUID vÃ¡lido.");

export const onboardingSchema = z
  .object({
    personalData: z.object({
      dni: z
        .string()
        .min(1, "El DNI es obligatorio.")
        .length(8, "El DNI debe tener exactamente 8 dígitos.")
        .regex(/^\d+$/, "El DNI solo debe contener números."),
      firstName: z.string().min(1, "El nombre es obligatorio."),
      paternalLastName: z.string().min(1, "El apellido paterno es obligatorio."),
      maternalLastName: z.string().optional(),
      birthDate: z.string().optional(),
      gender: z.string().optional(),
      civilStatus: z.string().optional(),
      nationality: z.string().optional(),
      phone: z
        .string()
        .optional()
        .refine((val) => !val || /^\+?\d{7,15}$/.test(val), {
          message: "Ingresa un número de teléfono válido (7 a 15 dígitos).",
        }),
      secondaryPhone: z
        .string()
        .optional()
        .refine((val) => !val || /^\+?\d{7,15}$/.test(val), {
          message: "Ingresa un número de teléfono secundario válido.",
        }),
      personalEmail: z
        .string()
        .optional()
        .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
          message: "Ingresa un correo electrónico personal válido.",
        }),
      address: z.string().optional(),
      departmentId: optionalUuid,
      provinceId: optionalUuid,
      districtId: optionalUuid,
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z
        .string()
        .optional()
        .refine((val) => !val || /^\+?\d{7,15}$/.test(val), {
          message: "Ingresa un teléfono de contacto de emergencia válido.",
        }),
    }),
    laborData: z.object({
      companyId: requiredUuid("La empresa es obligatoria."),
      branchId: optionalUuid,
      departmentId: requiredUuid("El departamento interno es obligatorio."),
      areaId: requiredUuid("El area es obligatoria."),
      positionId: requiredUuid("El puesto o cargo es obligatorio."),
      workLocationId: requiredUuid("El lugar de trabajo es obligatorio."),
      workerTypeId: optionalUuid,
      shiftId: optionalUuid,
      startDate: z.string().min(1, "La fecha de inicio es obligatoria."),
      supervisorId: optionalUuid,
      status: z.enum(["active", "inactive"]).default("active"),
    }),
    contractData: z.object({
      createContract: z.boolean().default(true),
      generateContract: z.boolean().default(true),
      contractType: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      trialPeriod: z.boolean().default(false),
      salary: z.coerce.number().optional().default(0),
      currency: z.string().default("PEN"),
      workdayType: z.string().optional(),
      workMode: z.string().optional(),
      costCenterId: optionalUuid,
      observations: z.string().optional(),
    }),
    accessData: z.object({
      createAccess: z.boolean().default(false),
      role: z.string().optional(),
      roleId: z.string().optional(),
      username: z.string().optional(),
      corporateEmail: z.string().optional(),
      temporaryPassword: z.string().optional(),
      forcePasswordChange: z.boolean().default(true),
      sendCredentialsByEmail: z.boolean().default(true),
    }),
  })
  .superRefine((data, ctx) => {
    // 1. Validaciones de contrato si createContract es verdadero
    const { createContract, contractType, startDate, endDate, salary } = data.contractData;
    if (createContract) {
      if (!contractType || contractType.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El tipo de contrato es obligatorio.",
          path: ["contractData", "contractType"],
        });
      }
      if (!startDate || startDate.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha de inicio es obligatoria.",
          path: ["contractData", "startDate"],
        });
      }
      if (salary === undefined || salary < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El salario debe ser mayor o igual a 0.",
          path: ["contractData", "salary"],
        });
      }

      if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fecha de fin debe ser posterior a la fecha de inicio.",
          path: ["contractData", "endDate"],
        });
      }
    }

    // 2. Access fields are optional when the backend generates credentials.
    const access = data.accessData;
    if (access.createAccess) {
      if (access.corporateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(access.corporateEmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingresa un correo corporativo válido.",
          path: ["accessData", "corporateEmail"],
        });
      }

      if (!access.role || !access.role.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un rol del sistema valido.",
          path: ["accessData", "role"],
        });
      }

      const pwd = access.temporaryPassword;
      if (pwd) {
        if (pwd.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe tener al menos 8 caracteres.",
            path: ["accessData", "temporaryPassword"],
          });
        }
        if (!/[A-Z]/.test(pwd)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe incluir al menos una letra mayúscula.",
            path: ["accessData", "temporaryPassword"],
          });
        }
        if (!/[a-z]/.test(pwd)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe incluir al menos una letra minúscula.",
            path: ["accessData", "temporaryPassword"],
          });
        }
        if (!/[0-9]/.test(pwd)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe incluir al menos un número.",
            path: ["accessData", "temporaryPassword"],
          });
        }
        if (!/[^A-Za-z0-9]/.test(pwd)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe incluir al menos un símbolo.",
            path: ["accessData", "temporaryPassword"],
          });
        }
      }
    }
  });

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
export type OnboardingFormErrors = Partial<Record<keyof OnboardingFormValues, unknown>>;
