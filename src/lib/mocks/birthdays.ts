import { addDays, format, startOfDay } from "date-fns";

import type { BirthdayWorker, UserProfile } from "@/types";

const toBirthdayDate = (year: number, offset: number) => {
  const date = addDays(startOfDay(new Date()), offset);
  return `${year}-${format(date, "MM-dd")}`;
};

export function buildMockBirthdayWorkers(currentUser?: Partial<UserProfile> | null): BirthdayWorker[] {
  return [
    {
      id: currentUser?.id ?? "current-user",
      fullName: currentUser?.fullName ?? "Mariana Torres",
      role: currentUser?.position ?? "Analista de RRHH",
      department: currentUser?.department ?? "RRHH",
      birthday: currentUser?.birthDate ?? toBirthdayDate(1994, 23),
      avatarUrl: currentUser?.avatarUrl,
      isCurrentUser: true,
    },
    {
      id: "mock-worker-01",
      fullName: "Andrea Valdivia",
      role: "Coordinadora de obra",
      department: "Operaciones",
      birthday: toBirthdayDate(1991, 0),
    },
    {
      id: "mock-worker-02",
      fullName: "Luis Fernández",
      role: "Supervisor de campo",
      department: "Obra",
      birthday: toBirthdayDate(1989, 1),
    },
    {
      id: "mock-worker-03",
      fullName: "Camila Ruiz",
      role: "Asistente contable",
      department: "Finanzas",
      birthday: toBirthdayDate(1996, 5),
    },
    {
      id: "mock-worker-04",
      fullName: "José Saldívar",
      role: "Jefe de seguridad",
      department: "SSOMA",
      birthday: toBirthdayDate(1988, 9),
    },
    {
      id: "mock-worker-05",
      fullName: "Paola Mendoza",
      role: "Administradora de proyecto",
      department: "Administración",
      birthday: toBirthdayDate(1993, 14),
    },
    {
      id: "mock-worker-06",
      fullName: "Diego Huamán",
      role: "Ingeniero residente",
      department: "Ingeniería",
      birthday: toBirthdayDate(1990, 31),
    },
    {
      id: "mock-worker-07",
      fullName: "Rosa Cabrera",
      role: "Auxiliar de logística",
      department: "Logística",
      birthday: toBirthdayDate(1998, 47),
    },
  ];
}
