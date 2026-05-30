"use client";

import { CalendarDays, Layers3, Sparkles } from "lucide-react";
import { format } from "date-fns";

import { FieldFrame, Input, Select } from "@/components/ui/fields";
import { cn } from "@/lib/utils/cn";

import { formatBirthdayMonthLabel } from "@/components/dashboard/birthdays/birthdayUtils";

export type BirthdayViewMode = "upcoming" | "day" | "month";

interface BirthdayFiltersProps {
  viewMode: BirthdayViewMode;
  selectedMonth: Date;
  selectedDate: Date;
  selectedDepartment: string;
  departments: string[];
  onViewModeChange: (value: BirthdayViewMode) => void;
  onMonthChange: (value: number) => void;
  onDateChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
}

const viewOptions: Array<{
  value: BirthdayViewMode;
  label: string;
  icon: typeof Sparkles;
}> = [
  { value: "upcoming", label: "Próximos", icon: Sparkles },
  { value: "day", label: "Por día", icon: CalendarDays },
  { value: "month", label: "Por mes", icon: Layers3 },
];

export function BirthdayFilters({
  viewMode,
  selectedMonth,
  selectedDate,
  selectedDepartment,
  departments,
  onViewModeChange,
  onMonthChange,
  onDateChange,
  onDepartmentChange,
}: BirthdayFiltersProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          const isActive = option.value === viewMode;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewModeChange(option.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-transparent bg-ink text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]"
                  : "border-border bg-white text-ink-soft hover:border-brand/30 hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FieldFrame label="Mes">
          <Select
            value={String(selectedMonth.getMonth())}
            onChange={(event) => onMonthChange(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, monthIndex) => (
              <option key={monthIndex} value={monthIndex}>
                {formatBirthdayMonthLabel(monthIndex)}
              </option>
            ))}
          </Select>
        </FieldFrame>

        <FieldFrame label="Día específico">
          <Input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </FieldFrame>

        <FieldFrame label="Área / departamento">
          <Select
            value={selectedDepartment}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            <option value="all">Todas las áreas</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </FieldFrame>
      </div>
    </div>
  );
}
