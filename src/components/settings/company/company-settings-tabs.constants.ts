import type { LucideIcon } from "lucide-react";
import { Building2, Eye, FileBadge2, LayoutDashboard, Palette } from "lucide-react";

export type CompanySettingsSection = "summary" | "legal" | "brand" | "files" | "preview";

export interface CompanySettingsTabItem {
  id: CompanySettingsSection;
  label: string;
  icon: LucideIcon;
}

export const companySettingsTabs: CompanySettingsTabItem[] = [
  { id: "summary", label: "Resumen", icon: LayoutDashboard },
  { id: "legal", label: "Informacion legal", icon: Building2 },
  { id: "brand", label: "Marca corporativa", icon: Palette },
  { id: "files", label: "Archivos oficiales", icon: FileBadge2 },
  { id: "preview", label: "Vista previa", icon: Eye },
];
