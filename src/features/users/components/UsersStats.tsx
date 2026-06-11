import { useMemo } from "react";
import { Users, Shield, HardHat, UserCog, UserMinus } from "lucide-react";
import { UserProfile } from "@/types";
import { UserMetricCard } from "./UserMetricCard";
import { buildRoleStats, sortRoleStats } from "@/lib/ui/role-stats";
import { buildRoleColorMap, getDynamicRoleBadgeClass, SYSTEM_ROLE_STYLES } from "@/lib/ui/role-badges";

interface UsersStatsProps {
 users: UserProfile[];
 total: number;
}

function getRoleIcon(roleKey: string) {
 switch (roleKey) {
 case "admin":
 return <Shield className="size-4" />;
 case "supervisor":
 return <HardHat className="size-4" />;
 case "hr":
 return <UserCog className="size-4" />;
 case "worker":
 return <Users className="size-4" />;
 default:
 return <UserCog className="size-4" />;
 }
}

export function UsersStats({ users, total }: UsersStatsProps) {
 const roleColorMap = useMemo(() => buildRoleColorMap(users), [users]);
 const roleStats = useMemo(() => sortRoleStats(buildRoleStats(users)), [users]);

 const unassignedProjectCount = useMemo(() => {
 return users.filter(
 (u) => !(u.worker?.work_location_name || u.supervisedCrew?.work_location_name),
 ).length;
 }, [users]);

 return (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
 {/* Total Card */}
 <UserMetricCard
 title="Total"
 value={total}
 subtitle="Usuarios registrados"
 icon={<Users className="size-4" />}
 className="bg-primary/10 text-primary"
 />

 {/* Dynamic Role Cards */}
 {roleStats.map((stat) => {
 const colorClass =
 SYSTEM_ROLE_STYLES[stat.key]?.className ??
 roleColorMap.get(stat.key) ??
 getDynamicRoleBadgeClass(stat.key);

 return (
 <UserMetricCard
 key={stat.key}
 title={stat.label}
 value={stat.count}
 subtitle="Usuarios con este rol"
 icon={getRoleIcon(stat.key)}
 className={colorClass}
 />
 );
 })}

 {/* Sin Proyecto Card */}
 <UserMetricCard
 title="Sin Proyecto"
 value={unassignedProjectCount}
 subtitle="Requieren asignación"
 icon={<UserMinus className="size-4" />}
 className="bg-muted text-muted-foreground"
 />
 </div>
 );
}
