"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import {
 requestDatePresetLabels,
 requestSortLabels,
 requestStatusOptions,
} from "@/lib/utils/requests";
import type { RequestDatePreset, RequestListFilters, RequestSortOption, RequestType } from "@/types/requests";

interface RequestFiltersProps {
 filters: RequestListFilters;
 requestTypes: RequestType[];
 onChange: (patch: Partial<RequestListFilters>) => void;
 onReset: () => void;
}

const sortOptions: RequestSortOption[] = ["newest", "oldest", "status", "type", "startDate"];
const submittedDatePresets: RequestDatePreset[] = ["all", "today", "week", "month", "custom"];

export function RequestFilters({
 filters,
 requestTypes,
 onChange,
 onReset,
}: RequestFiltersProps) {
 const showSubmittedRange = filters.submittedDatePreset === "custom";

 return (
 <Card className="grid gap-5 p-5">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid gap-1">
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
 <Filter className="size-3.5" />
 Filtros avanzados
 </div>
 <p className="text-sm text-foreground-soft">
 Busca por trabajador, codigo, tipo o motivo y afina por fechas, estado y orden.
 </p>
 </div>

 <Button variant="secondary" className="h-10 px-3" onClick={onReset}>
 <RotateCcw className="mr-2 size-4" />
 Limpiar filtros
 </Button>
 </div>

 <div className="grid gap-4 xl:grid-cols-4">
 <FieldFrame label="Buscar">
 <div className="relative">
 <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground-soft" />
 <Input
 value={filters.search ?? ""}
 onChange={(event) => onChange({ search: event.target.value })}
 placeholder="Trabajador, codigo, tipo o motivo"
 className="pl-11"
 />
 </div>
 </FieldFrame>

 <FieldFrame label="Estado">
 <Select
 value={filters.status ?? "all"}
 onChange={(event) => onChange({ status: event.target.value as RequestListFilters["status"] })}
 >
 {requestStatusOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Tipo de solicitud">
 <Select
 value={filters.typeId ?? ""}
 onChange={(event) => onChange({ typeId: event.target.value || undefined })}
 >
 <option value="">Todos</option>
 {requestTypes.map((type) => (
 <option key={type.id} value={type.id}>
 {type.name}
 </option>
 ))}
 </Select>
 </FieldFrame>

 <FieldFrame label="Ordenar por">
 <Select
 value={filters.sortBy ?? "newest"}
 onChange={(event) => onChange({ sortBy: event.target.value as RequestSortOption })}
 >
 {sortOptions.map((option) => (
 <option key={option} value={option}>
 {requestSortLabels[option]}
 </option>
 ))}
 </Select>
 </FieldFrame>
 </div>

 <div className="grid gap-4 xl:grid-cols-4">
 <FieldFrame label="Fecha de envio">
 <Select
 value={filters.submittedDatePreset ?? "all"}
 onChange={(event) =>
 onChange({
 submittedDatePreset: event.target.value as RequestDatePreset,
 submittedDateFrom: event.target.value === "custom" ? filters.submittedDateFrom : undefined,
 submittedDateTo: event.target.value === "custom" ? filters.submittedDateTo : undefined,
 })
 }
 >
 {submittedDatePresets.map((preset) => (
 <option key={preset} value={preset}>
 {requestDatePresetLabels[preset]}
 </option>
 ))}
 </Select>
 </FieldFrame>

 {showSubmittedRange ? (
 <>
 <FieldFrame label="Enviado desde">
 <Input
 type="date"
 value={filters.submittedDateFrom ?? ""}
 onChange={(event) => onChange({ submittedDateFrom: event.target.value || undefined })}
 />
 </FieldFrame>
 <FieldFrame label="Enviado hasta">
 <Input
 type="date"
 value={filters.submittedDateTo ?? ""}
 onChange={(event) => onChange({ submittedDateTo: event.target.value || undefined })}
 />
 </FieldFrame>
 </>
 ) : (
 <>
 <div className="hidden xl:block" />
 <div className="hidden xl:block" />
 </>
 )}

 <FieldFrame label="Inicio solicitado desde">
 <Input
 type="date"
 value={filters.startDateFrom ?? ""}
 onChange={(event) => onChange({ startDateFrom: event.target.value || undefined })}
 />
 </FieldFrame>
 </div>

 <div className="grid gap-4 xl:grid-cols-4">
 <FieldFrame label="Inicio solicitado hasta">
 <Input
 type="date"
 value={filters.startDateTo ?? ""}
 onChange={(event) => onChange({ startDateTo: event.target.value || undefined })}
 />
 </FieldFrame>

 <FieldFrame label="Actualizadas desde">
 <Input
 type="date"
 value={filters.updatedDateFrom ?? ""}
 onChange={(event) => onChange({ updatedDateFrom: event.target.value || undefined })}
 />
 </FieldFrame>

 <FieldFrame label="Actualizadas hasta">
 <Input
 type="date"
 value={filters.updatedDateTo ?? ""}
 onChange={(event) => onChange({ updatedDateTo: event.target.value || undefined })}
 />
 </FieldFrame>
 </div>
 </Card>
 );
}
