"use client";

import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { REPORT_STATUS_OPTIONS } from "@/features/reports/report-config";
import type { RequestType } from "@/types/requests";
import type { ReportFilters } from "@/types/report.types";
import type { WorkerRecord } from "@/types";

export function ReportFiltersPanel({
  filters,
  requestTypes,
  workers,
  showWorkerFilter,
  areaLabel = "Area o departamento",
  onChange,
  onReset,
  action,
}: {
  filters: ReportFilters;
  requestTypes: RequestType[];
  workers: WorkerRecord[];
  showWorkerFilter: boolean;
  areaLabel?: string;
  onChange: (patch: Partial<ReportFilters>) => void;
  onReset: () => void;
  action?: React.ReactNode;
}) {
  return (
    <Card className="grid gap-5 border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.82))] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
            <Filter className="size-3.5 text-cyan-300" />
            Filtros del reporte
          </div>
          <p className="text-sm text-slate-300">
            Ajusta el alcance del reporte antes de previsualizar, exportar o graficar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {action}
          <Button
            variant="ghost"
            className="border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={onReset}
          >
            <RotateCcw className="mr-2 size-4" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <FieldFrame label="Fecha inicio">
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) => onChange({ dateFrom: event.target.value || null })}
            className="border-white/10 bg-white/5 text-white"
          />
        </FieldFrame>
        <FieldFrame label="Fecha fin">
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) => onChange({ dateTo: event.target.value || null })}
            className="border-white/10 bg-white/5 text-white"
          />
        </FieldFrame>
        <FieldFrame label="Estado">
          <Select
            value={filters.status ?? ""}
            onChange={(event) => onChange({ status: (event.target.value || null) as ReportFilters["status"] })}
            className="border-white/10 bg-white/5 text-white"
          >
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value} className="text-slate-900">
                {option.label}
              </option>
            ))}
          </Select>
        </FieldFrame>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <FieldFrame label="Tipo de solicitud">
          <Select
            value={filters.requestType ?? ""}
            onChange={(event) => onChange({ requestType: event.target.value || null })}
            className="border-white/10 bg-white/5 text-white"
          >
            <option value="" className="text-slate-900">
              Todos
            </option>
            {requestTypes.map((type) => (
              <option key={type.id} value={type.id} className="text-slate-900">
                {type.name}
              </option>
            ))}
          </Select>
        </FieldFrame>

        <FieldFrame label={areaLabel}>
          <Input
            value={filters.areaId ?? ""}
            onChange={(event) => onChange({ areaId: event.target.value || null })}
            placeholder="Area, departamento o codigo"
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
          />
        </FieldFrame>

        {showWorkerFilter ? (
          <FieldFrame label="Trabajador">
            <Select
              value={filters.workerId ?? ""}
              onChange={(event) => onChange({ workerId: event.target.value || null })}
              className="border-white/10 bg-white/5 text-white"
            >
              <option value="" className="text-slate-900">
                Todos los trabajadores
              </option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id} className="text-slate-900">
                  {worker.fullName}
                </option>
              ))}
            </Select>
          </FieldFrame>
        ) : null}
      </div>
    </Card>
  );
}
