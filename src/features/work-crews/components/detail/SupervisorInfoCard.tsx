import { User, Mail, Phone, Briefcase, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

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
 <div className="flex flex-col p-6 rounded-2xl bg-card border border-border shadow-sm h-full">
 <div className="flex items-center gap-3 mb-5">
 <UserAvatar
 src={crew?.supervisor_avatar_url}
 fullName={name === "Supervisor no asignado" ? null : name}
 email={email === "Sin correo" ? null : email}
 size="md"
 />
 <div>
 <h3 className="text-sm font-bold text-foreground">Supervisor Responsable</h3>
 <p className="text-xs text-muted-foreground">A cargo de la cuadrilla y movimientos</p>
 </div>
 </div>
 
 <div className="space-y-4">
 <div className="flex items-start gap-3">
 <Briefcase className="size-4 text-muted-foreground mt-0.5" />
 <div>
 <div className="text-sm font-semibold text-foreground">{name}</div>
 <div className="text-xs text-muted-foreground">{role}</div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <Mail className="size-4 text-muted-foreground" />
 <div className="text-sm text-muted-foreground">{email}</div>
 </div>
 <div className="flex items-center gap-3">
 <Phone className="size-4 text-muted-foreground" />
 <div className="text-sm text-muted-foreground">{phone}</div>
 </div>
 <div className="flex items-center gap-3">
 <ShieldCheck className="size-4 text-emerald-500" />
 <div className="text-sm text-emerald-600 font-medium">Estado: {status}</div>
 </div>
 </div>
 </div>
 );
}
