import { Users, Shield, HardHat, UserMinus } from "lucide-react";
import { UserProfile } from "@/types";

interface UsersStatsProps {
  users: UserProfile[];
  total: number;
}

export function UsersStats({ users, total }: UsersStatsProps) {
  // If the backend paginates heavily, we only have the current page's users to calculate stats from,
  // unless we get a global summary from the backend.
  // For now we'll calculate based on the current items (or we can assume `total` for total, and estimate others).
  
  const activeCount = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const supervisorCount = users.filter((u) => u.role === "supervisor").length;
  const workerCount = users.filter((u) => u.role === "worker").length;
  const unassignedProjectCount = users.filter(
    (u) => !(u.worker?.work_location_name || u.supervisedCrew?.work_location_name || u.project),
  ).length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="rounded-lg bg-brand/10 p-1.5 text-brand">
            <Users className="size-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-ink">{total}</div>
          <div className="text-xs text-ink-soft">Usuarios registrados</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
            <Shield className="size-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Administradores</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-ink">{adminCount}</div>
          <div className="text-xs text-ink-soft">Usuarios admin en esta pág.</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="rounded-lg bg-amber-100 p-1.5 text-amber-600">
            <HardHat className="size-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Supervisores</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-ink">{supervisorCount}</div>
          <div className="text-xs text-ink-soft">Usuarios con cuadrilla</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600">
            <Users className="size-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Trabajadores</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-ink">{workerCount}</div>
          <div className="text-xs text-ink-soft">Con cuenta de app</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="rounded-lg bg-slate-100 p-1.5 text-slate-500">
            <UserMinus className="size-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">Sin Proyecto</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-ink">{unassignedProjectCount}</div>
          <div className="text-xs text-ink-soft">Requieren asignación</div>
        </div>
      </div>
    </div>
  );
}
