"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Building2, Network, ShieldCheck, Settings2, UsersRound, MapPin } from "lucide-react";
import { DepartmentsWorkspace } from "@/features/departments/departments-workspace";
import { AreasWorkspace } from "@/features/areas/areas-workspace";
import { RolesWorkspace } from "@/features/roles/roles-workspace";
import { PositionsTab } from "@/components/settings/organization/tabs/PositionsTab";
import { WorkLocationsTab } from "@/components/settings/organization/tabs/WorkLocationsTab";

type OrgTab = "departments" | "areas" | "roles" | "positions" | "work-locations";

const ORG_TABS = [
  { id: "departments", label: "Departamentos", icon: Building2 },
  { id: "areas", label: "Áreas", icon: Network },
  { id: "positions", label: "Puestos", icon: UsersRound },
  { id: "roles", label: "Roles de Sistema", icon: ShieldCheck },
  { id: "work-locations", label: "Lugares de Trabajo", icon: MapPin },
];

export function OrganizationWorkspace() {
  const [activeTab, setActiveTab] = useState<OrgTab>("departments");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Configuración"
        title="Estructura Organizacional"
        description="Gestiona los departamentos internos, áreas funcionales y roles de tu empresa en un solo lugar."
      />

      <Card className="flex items-center gap-2 overflow-x-auto p-1 text-sm font-medium">
        {ORG_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OrgTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </Card>

      <div className="min-h-[500px]">
        {activeTab === "departments" && <DepartmentsWorkspace hideHeader />}
        {activeTab === "areas" && <AreasWorkspace hideHeader />}
        {activeTab === "positions" && <PositionsTab />}
        {activeTab === "roles" && <RolesWorkspace hideHeader />}
        {activeTab === "work-locations" && <WorkLocationsTab />}
      </div>
    </div>
  );
}
