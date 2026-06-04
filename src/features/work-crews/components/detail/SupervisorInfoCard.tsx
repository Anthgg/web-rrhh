import { User, Mail, Phone, Briefcase, ShieldCheck } from "lucide-react";

interface SupervisorInfoCardProps {
  crew: any;
}

export function SupervisorInfoCard({ crew }: SupervisorInfoCardProps) {
  const name = crew?.supervisor_name || "Supervisor no asignado";
  const email = crew?.supervisor_email || "Sin correo";
  const phone = crew?.supervisor_phone || "Sin teléfono";
  // The backend might not provide workers_count or role directly in crew, so we fallback
  const role = "Supervisor de Obra"; 
  const status = "Activo";

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-slate-200 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <User className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Supervisor Responsable</h3>
          <p className="text-xs text-slate-500">A cargo de la cuadrilla y movimientos</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Briefcase className="size-4 text-slate-400 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{name}</div>
            <div className="text-xs text-slate-500">{role}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="size-4 text-slate-400" />
          <div className="text-sm text-slate-600">{email}</div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="size-4 text-slate-400" />
          <div className="text-sm text-slate-600">{phone}</div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-4 text-emerald-500" />
          <div className="text-sm text-emerald-600 font-medium">Estado: {status}</div>
        </div>
      </div>
    </div>
  );
}
