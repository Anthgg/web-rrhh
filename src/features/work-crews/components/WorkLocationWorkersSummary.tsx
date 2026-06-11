import { useState } from "react";
import { Users, HardHat, ArrowRightLeft, ArrowUpRight, ArrowDownRight, History, X } from "lucide-react";
import { type OrganizationWorkLocation } from "@/services/organization.service";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RequestModalShell } from "@/components/requests/request-modal-shell";

interface WorkLocationWorkersSummaryProps {
 location: OrganizationWorkLocation;
 onClose: () => void;
}

type TabType = "all" | "base" | "received" | "sent" | "movements";

// Fake Data to demonstrate the UI until backend implements location workers endpoints
const mockWorkersData = [
 { id: "1", name: "Juan PÃ©rez", doc: "72345678", crew: "Cuadrilla Alpha", location: "Hospital Sur", assignedAt: "01/05/2026", status: "active", type: "base" },
 { id: "2", name: "MarÃ­a GÃ³mez", doc: "74321234", crew: "Cuadrilla Bravo", location: "Hospital Sur", assignedAt: "15/05/2026", status: "active", type: "received" },
 { id: "3", name: "Carlos Ruiz", doc: "42123456", crew: "Cuadrilla Alpha", location: "ClÃ­nica Norte", assignedAt: "20/05/2026", status: "inactive", type: "sent" },
];

export function WorkLocationWorkersSummary({ location, onClose }: WorkLocationWorkersSummaryProps) {
 const [activeTab, setActiveTab] = useState<TabType>("all");

 const tabs: Array<{ id: TabType; label: string; icon: any }> = [
 { id: "all", label: "Todos", icon: Users },
 { id: "base", label: "De esta obra", icon: HardHat },
 { id: "received", label: "Temp. recibidos", icon: ArrowDownRight },
 { id: "sent", label: "Enviados a otra", icon: ArrowUpRight },
 { id: "movements", label: "Movimientos", icon: History },
 ];

 const getFilteredData = () => {
 if (activeTab === "all") return mockWorkersData;
 if (activeTab === "movements") return []; // empty for movements mock
 return mockWorkersData.filter(w => w.type === activeTab);
 };

 const columns = [
 {
 key: "name",
 header: "Trabajador",
 render: (row: any) => (
 <div className="flex flex-col gap-0.5">
 <span className="font-semibold text-foreground">{row.name}</span>
 <span className="text-xs text-muted-foreground">DNI: {row.doc}</span>
 </div>
 ),
 },
 {
 key: "crew",
 header: "Cuadrilla Original",
 render: (row: any) => <span className="text-sm font-medium text-foreground">{row.crew}</span>,
 },
 {
 key: "location",
 header: "Obra Actual",
 render: (row: any) => <span className="text-sm text-muted-foreground">{row.location}</span>,
 },
 {
 key: "date",
 header: "Fecha AsignaciÃ³n",
 render: (row: any) => <span className="text-sm text-muted-foreground">{row.assignedAt}</span>,
 },
 {
 key: "status",
 header: "Estado",
 render: (row: any) => <StatusBadge status={row.status} />,
 },
 ];

 return (
 <RequestModalShell
 isOpen={true}
 onClose={onClose}
 title={`Trabajadores en ${location.name}`}
 subtitle="Consulta y administra la fuerza laboral de esta obra"
 size="xl"
 >
 <div className="flex flex-col">
 <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border pb-4">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
 isActive 
 ? "bg-indigo-600 text-white shadow-sm" 
 : "bg-card text-muted-foreground hover:bg-muted border border-border"
 }`}
 >
 <Icon className={`size-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
 {tab.label}
 </button>
 );
 })}
 </div>

 <div className="border border-border rounded-xl overflow-hidden">
 {activeTab === "movements" ? (
 <div className="p-16 text-center">
 <ArrowRightLeft className="size-12 mx-auto text-slate-300 mb-4" />
 <h4 className="text-lg font-bold text-foreground">Historial de Movimientos</h4>
 <p className="text-sm text-muted-foreground mt-1">El historial detallado se implementarÃ¡ al conectar el endpoint del servidor.</p>
 </div>
 ) : (
 <DataTable
 columns={columns}
 rows={getFilteredData()}
 rowKey={(row) => row.id}
 />
 )}
 </div>
 </div>
 </RequestModalShell>
 );
}
