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
 <nav className="rounded-lg border border-border bg-card p-2 shadow-sm">
 <div className="md:hidden">
 <label className="grid gap-2 text-sm text-foreground-soft">
 <span className="sr-only">Seleccionar seccion</span>
 <select
 value={activeSection}
 onChange={(event) => onSectionChange(event.target.value as CompanySettingsSection)}
 className="h-11 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
 ? "bg-foreground text-white shadow-sm"
 : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
