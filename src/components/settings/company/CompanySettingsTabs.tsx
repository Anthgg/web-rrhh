"use client";

import { ClipboardCheck } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  companySettingsTabs,
  type CompanySettingsSection,
} from "./company-settings-tabs.constants";

interface CompanySettingsTabsProps {
  activeSection: CompanySettingsSection;
  onSectionChange: (section: CompanySettingsSection) => void;
}

export function CompanySettingsTabs({
  activeSection,
  onSectionChange,
}: CompanySettingsTabsProps) {
  return (
    <nav className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <div className="md:hidden">
        <label className="grid gap-2 text-sm text-ink-soft">
          <span className="sr-only">Seleccionar seccion</span>
          <select
            value={activeSection}
            onChange={(event) => onSectionChange(event.target.value as CompanySettingsSection)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            {companySettingsTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="hidden gap-1 md:flex">
        {companySettingsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink",
              )}
              onClick={() => onSectionChange(tab.id)}
            >
              {tab.id === "summary" ? (
                <ClipboardCheck className="size-4" />
              ) : (
                <Icon className="size-4" />
              )}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
