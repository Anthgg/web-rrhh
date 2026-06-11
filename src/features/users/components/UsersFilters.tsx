import { useState, useRef, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { UserProfile } from "@/types";
import { normalizeUserRole } from "@/lib/api/normalizers";

interface UsersFiltersProps {
 search: string;
 onSearchChange: (val: string) => void;
 role: string;
 onRoleChange: (val: string) => void;
 status: string;
 onStatusChange: (val: string) => void;
 linkStatus: string; // New filter for "Vinculación laboral"
 onLinkStatusChange: (val: string) => void;
 users?: UserProfile[];
}

const DEFAULT_ROLE_OPTIONS = [
 { value: "admin", label: "Administrador" },
 { value: "supervisor", label: "Supervisor" },
 { value: "worker", label: "Trabajador" },
 { value: "hr", label: "RR.HH." },
];

export function UsersFilters({
 search,
 onSearchChange,
 role,
 onRoleChange,
 status,
 onStatusChange,
 linkStatus,
 onLinkStatusChange,
 users,
}: UsersFiltersProps) {
 const [showAdvanced, setShowAdvanced] = useState(false);
 const popoverRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleOutsideClick = (e: MouseEvent) => {
 if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
 setShowAdvanced(false);
 }
 };
 if (showAdvanced) {
 document.addEventListener("mousedown", handleOutsideClick);
 }
 return () => document.removeEventListener("mousedown", handleOutsideClick);
 }, [showAdvanced]);

 const activeAdvancedFiltersCount = (linkStatus ? 1 : 0);

 const userRoles = (users || []).map((u) => {
 const norm = normalizeUserRole(u);
 return {
 value: norm.roleCode ?? norm.roleName ?? "unknown",
 label: norm.displayRole,
 };
 });

 const roleOptionsMap = new Map<string, string>();
 DEFAULT_ROLE_OPTIONS.forEach(opt => roleOptionsMap.set(opt.value, opt.label));

 userRoles.forEach(opt => {
 if (opt.value && opt.value !== "unknown" && opt.label !== "No informado") {
 const normalizedValue = opt.value.toLowerCase();
 if (!roleOptionsMap.has(normalizedValue)) {
 roleOptionsMap.set(normalizedValue, opt.label);
 }
 }
 });

 const roleOptions = Array.from(roleOptionsMap.entries()).map(([value, label]) => ({
 value,
 label,
 }));

 return (
 <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
 {/* Search */}
 <div className="relative flex-1">
 <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground-soft" />
 <Input
 value={search}
 placeholder="Buscar por nombre, correo, rol, cargo o proyecto..."
 onChange={(e) => onSearchChange(e.target.value)}
 className="w-full pl-10"
 />
 </div>

 {/* Basic Filters */}
 <div className="flex flex-wrap items-center gap-3">
 <div className="w-[160px]">
 <Select value={role} onChange={(e) => onRoleChange(e.target.value)}>
 <option value="">Todos los roles</option>
 {roleOptions.map((opt) => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 <option value="none">Sin rol informado</option>
 </Select>
 </div>

 <div className="w-[140px]">
 <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
 <option value="">Cualquier estado</option>
 <option value="active">Activos</option>
 <option value="inactive">Inactivos</option>
 </Select>
 </div>

 <div className="relative" ref={popoverRef}>
 <Button
 variant={activeAdvancedFiltersCount > 0 ? "primary" : "secondary"}
 onClick={() => setShowAdvanced(!showAdvanced)}
 className="gap-2"
 >
 <Filter className="size-4" />
 <span className="hidden sm:inline">Más filtros</span>
 {activeAdvancedFiltersCount > 0 && (
 <span className="flex size-5 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">
 {activeAdvancedFiltersCount}
 </span>
 )}
 </Button>

 {/* Advanced Filters Popover */}
 {showAdvanced && (
 <div className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95">
 <div className="mb-4 flex items-center justify-between">
 <h4 className="font-semibold text-foreground">Filtros Avanzados</h4>
 <button
 type="button"
 onClick={() => setShowAdvanced(false)}
 className="rounded-full p-1 text-foreground-soft transition-colors hover:bg-muted"
 >
 <X className="size-4" />
 </button>
 </div>

 <div className="space-y-4">
 <div className="space-y-1.5">
 <label htmlFor="link-status-select" className="text-xs font-medium text-foreground-soft">Vinculación laboral</label>
 <Select id="link-status-select" value={linkStatus} onChange={(e) => onLinkStatusChange(e.target.value)}>
 <option value="">Todos</option>
 <option value="with_record">Con ficha laboral</option>
 <option value="without_record">Sin ficha laboral</option>
 <option value="with_project">Con proyecto asignado</option>
 <option value="without_project">Sin proyecto asignado</option>
 </Select>
 </div>

 {/* Future filters could go here */}

 <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
 <Button
 variant="secondary"
 className="h-9 rounded-xl px-3 text-xs"
 onClick={() => {
 onLinkStatusChange("");
 setShowAdvanced(false);
 }}
 >
 Limpiar
 </Button>
 <Button className="h-9 rounded-xl px-3 text-xs" onClick={() => setShowAdvanced(false)}>
 Aplicar
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Active filters chips */}
 {activeAdvancedFiltersCount > 0 && (
 <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
 <span className="text-xs text-foreground-soft">Filtros activos:</span>
 {linkStatus && (
 <Badge variant="secondary" className="gap-1 rounded-md px-2 py-1 font-normal">
 Vinculación: {
 linkStatus === "with_record" ? "Con ficha laboral" :
 linkStatus === "without_record" ? "Sin ficha laboral" :
 linkStatus === "with_project" ? "Con proyecto asignado" :
 linkStatus === "without_project" ? "Sin proyecto asignado" : linkStatus
 }
 <X
 className="ml-1 size-3 cursor-pointer text-muted-foreground hover:text-muted-foreground"
 onClick={() => onLinkStatusChange("")}
 />
 </Badge>
 )}
 </div>
 )}
 </div>
 );
}
