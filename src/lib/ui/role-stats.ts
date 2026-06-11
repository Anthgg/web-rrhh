import { normalizeUserRole } from "@/lib/api/normalizers";
import { SYSTEM_ROLE_STYLES } from "./role-badges";

export interface RoleStat {
 key: string;
 label: string;
 count: number;
}

const ROLE_PRIORITY: Record<string, number> = {
 superadmin: 1,
 super_admin: 1,
 admin: 2,
 hr: 3,
 hr_manager: 3,
 supervisor: 4,
 worker: 5,
};

export function buildRoleStats(users: any[]): RoleStat[] {
 if (!users || !Array.isArray(users)) return [];

 const counts: Record<string, { label: string; count: number }> = {};

 users.forEach((user) => {
 const normalized = normalizeUserRole(user);
 const roleKey = String(normalized.roleCode ?? normalized.roleName ?? "").toLowerCase().trim();
 if (!roleKey) return;

 let label = normalized.roleName ?? normalized.roleCode ?? "No informado";
 if (SYSTEM_ROLE_STYLES[roleKey]) {
 label = SYSTEM_ROLE_STYLES[roleKey].label;
 } else if (label && label !== "No informado") {
 label = label
 .replace(/([a-z])([A-Z])/g, "$1 $2")
 .replace(/[._-]+/g, " ")
 .trim();
 label = label.charAt(0).toUpperCase() + label.slice(1);
 }

 if (counts[roleKey]) {
 counts[roleKey].count += 1;
 } else {
 counts[roleKey] = { label, count: 1 };
 }
 });

 return Object.entries(counts).map(([key, value]) => ({
 key,
 label: value.label,
 count: value.count,
 }));
}

export function sortRoleStats(stats: RoleStat[]): RoleStat[] {
 if (!stats) return [];

 return [...stats].sort((a, b) => {
 const priorityA = ROLE_PRIORITY[a.key] ?? 999;
 const priorityB = ROLE_PRIORITY[b.key] ?? 999;

 if (priorityA !== priorityB) {
 return priorityA - priorityB;
 }

 return a.label.localeCompare(b.label);
 });
}
