import { OrganizationWorkspace } from "@/features/organization/organization-workspace";

export const metadata = {
 title: "Estructura Organizacional",
 description: "Gestiona los departamentos, áreas y roles de tu empresa",
};

export default function OrganizationPage() {
 return <OrganizationWorkspace />;
}
