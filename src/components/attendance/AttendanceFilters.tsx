"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, User, RefreshCw, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldFrame, Input } from "@/components/ui/fields";
import type { AttendanceDayStatus } from "@/types/schedule";
import { STATUS_LABELS } from "@/lib/utils/attendance";

export interface AttendanceFiltersValue {
  startDate: string;
  endDate: string;
  workerId: string;
  workerSearch: string;
  statusFilter: AttendanceDayStatus | "all";
}

interface Worker {
  id: string;
  fullName: string;
}

interface AttendanceFiltersProps {
  value: AttendanceFiltersValue;
  workers: Worker[];
  isLoadingWorkers: boolean;
  onChange: (v: Partial<AttendanceFiltersValue>) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: AttendanceDayStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "present", label: STATUS_LABELS.present },
  { value: "late", label: STATUS_LABELS.late },
  { value: "absent", label: STATUS_LABELS.absent },
  { value: "incomplete", label: STATUS_LABELS.incomplete },
  { value: "rest_day", label: STATUS_LABELS.rest_day },
  { value: "not_scheduled", label: STATUS_LABELS.not_scheduled },
  { value: "pending", label: STATUS_LABELS.pending },
];

export function AttendanceFilters({
  value,
  workers,
  isLoadingWorkers,
  onChange,
  onSearch,
  onClear,
  isLoading,
}: AttendanceFiltersProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasFilters = value.workerId || value.statusFilter !== "all";

  return (
    <Card className="border-border bg-card shadow-sm">
      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          {/* Start date */}
          <FieldFrame label="Fecha de inicio">
            <Input
              type="date"
              value={value.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
          </FieldFrame>

          {/* End date */}
          <FieldFrame label="Fecha de fin">
            <Input
              type="date"
              value={value.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
          </FieldFrame>

          {/* Worker search */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-sm font-semibold text-foreground">Colaborador</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={value.workerSearch}
                onChange={(e) => {
                  onChange({ workerSearch: e.target.value });
                  setShowDropdown(true);
                  if (!e.target.value) onChange({ workerId: "" });
                }}
                onFocus={() => setShowDropdown(true)}
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary transition"
              />
              {value.workerSearch && (
                <button
                  type="button"
                  onClick={() => { onChange({ workerId: "", workerSearch: "" }); setShowDropdown(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {showDropdown && value.workerSearch && (
              <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                {isLoadingWorkers ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Buscando...</p>
                ) : workers.length > 0 ? (
                  workers.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => { onChange({ workerId: w.id, workerSearch: w.fullName }); setShowDropdown(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      <User className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{w.fullName}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
                )}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Estado</label>
            <select
              value={value.statusFilter}
              onChange={(e) => onChange({ statusFilter: e.target.value as AttendanceDayStatus | "all" })}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <Button
              onClick={onSearch}
              disabled={isLoading}
              className="h-10 gap-2"
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              Consultar
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={onClear} className="h-10 text-muted-foreground">
                <Filter className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
