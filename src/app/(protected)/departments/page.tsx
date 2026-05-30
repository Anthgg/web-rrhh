import { DepartmentsWorkspace } from "@/features/departments/departments-workspace";

export const metadata = {
  title: "Departamentos | Configuración Organizacional",
  description: "Gestión de departamentos internos de la empresa.",
};

export default function DepartmentsPage() {
  return <DepartmentsWorkspace />;
}
