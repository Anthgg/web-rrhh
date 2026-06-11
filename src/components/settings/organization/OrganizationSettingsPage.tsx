"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { DepartmentsTab } from "./tabs/DepartmentsTab";
import { AreasTab } from "./tabs/AreasTab";
import { PositionsTab } from "./tabs/PositionsTab";
import { WorkLocationsTab } from "./tabs/WorkLocationsTab";
import { Building2, MapPin, Network, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

type OrgTab = "departments" | "areas" | "positions" | "work-locations";

const ORG_TABS = [
 { id: "departments", label: "Departamentos", icon: Building2 },
 { id: "areas", label: "Áreas", icon: Network },
 { id: "positions", label: "Puestos", icon: UsersRound },
 { id: "work-locations", label: "Lugares de Trabajo", icon: MapPin },
];

export function OrganizationSettingsPage() {
 const [activeTab, setActiveTab] = useState<OrgTab>("departments");

 return (
 <div className="flex flex-col gap-6">
 <PageHeader
 eyebrow="Configuración"
 title="Estructura Organizacional"
 description="Gestiona los departamentos internos, áreas funcionales, cargos y sedes físicas de tu empresa."
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
 isActive ? "bg-indigo-50 text-indigo-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
 }`}
 >
 <Icon className="size-4" />
 {tab.label}
 </button>
 );
 })}
 </Card>

 <div className="min-h-[500px]">
 {activeTab === "departments" && <DepartmentsTab />}
 {activeTab === "areas" && <AreasTab />}
 {activeTab === "positions" && <PositionsTab />}
 {activeTab === "work-locations" && <WorkLocationsTab />}
 </div>
 </div>
 );
}
