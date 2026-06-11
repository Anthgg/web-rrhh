import React from "react";
import { normalizeUserRole } from "@/lib/api/normalizers";
import { cn } from "@/lib/utils/cn";

export interface RoleStyle {
 label: string;
 className: string;
}

export const SYSTEM_ROLE_STYLES: Record<string, RoleStyle> = {
 admin: {
 label: "Administrador",
 className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80",
 },
 supervisor: {
 label: "Supervisor",
 className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80",
 },
 hr: {
 label: "RR.HH.",
 className: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80",
 },
 worker: {
 label: "Trabajador",
 className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80",
 },
 super_admin: {
 label: "Super administrador",
 className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80",
 },
 superadmin: {
 label: "Super administrador",
 className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80",
 },
 hr_manager: {
 label: "Gerente RR.HH.",
 className: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80",
 },
};

export function getDynamicRoleBadgeClass(roleKey: string): string {
 if (!roleKey) return "bg-muted text-foreground border-border hover:bg-muted/80";
 const normalizedKey = roleKey.toLowerCase().trim();
 if (SYSTEM_ROLE_STYLES[normalizedKey]) {
 return SYSTEM_ROLE_STYLES[normalizedKey].className;
 }

 const hash = normalizedKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
 const colors = [
 "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80",
 "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80",
 "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100/80",
 "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100/80",
 "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/80",
 "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/80",
 "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100/80",
 "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/80",
 ];
 return colors[hash % colors.length];
}

export function buildRoleColorMap(users: any[]): Map<string, string> {
 const map = new Map<string, string>();
 if (!users || !Array.isArray(users)) return map;

 users.forEach((user) => {
 const normalized = normalizeUserRole(user);
 const roleKey = String(normalized.roleCode ?? normalized.roleName ?? "").toLowerCase().trim();
 if (!roleKey) return;

 if (SYSTEM_ROLE_STYLES[roleKey]) {
 map.set(roleKey, SYSTEM_ROLE_STYLES[roleKey].className);
 } else {
 map.set(roleKey, getDynamicRoleBadgeClass(roleKey));
 }
 });
 return map;
}

interface RoleBadgeProps {
 user?: any;
 roleColorMap?: Map<string, string>;
 roleName?: string | null;
 roleCode?: string | null;
}

export function RoleBadge({ user, roleColorMap, roleName, roleCode }: RoleBadgeProps) {
 let finalRoleName = roleName;
 let finalRoleCode = roleCode;

 if (user) {
 const normalized = normalizeUserRole(user);
 finalRoleName = normalized.roleName;
 finalRoleCode = normalized.roleCode;
 }

 const roleKey = String(finalRoleCode ?? finalRoleName ?? "").toLowerCase().trim();
 
 // Determine display label
 let label = finalRoleName ?? finalRoleCode ?? "No informado";
 if (roleKey && SYSTEM_ROLE_STYLES[roleKey]) {
 label = SYSTEM_ROLE_STYLES[roleKey].label;
 } else if (label && label !== "No informado") {
 // Clean up key to look like a label if it's a raw string
 label = label
 .replace(/([a-z])([A-Z])/g, "$1 $2")
 .replace(/[._-]+/g, " ")
 .trim();
 label = label.charAt(0).toUpperCase() + label.slice(1);
 }

 // Determine class name
 let className = "bg-muted text-foreground border-border hover:bg-muted/80";
 if (roleKey) {
 if (SYSTEM_ROLE_STYLES[roleKey]) {
 className = SYSTEM_ROLE_STYLES[roleKey].className;
 } else if (roleColorMap && roleColorMap.has(roleKey)) {
 className = roleColorMap.get(roleKey)!;
 } else {
 className = getDynamicRoleBadgeClass(roleKey);
 }
 }

 return (
 <span
 className={cn(
 "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
 className
 )}
 >
 {label}
 </span>
 );
}
