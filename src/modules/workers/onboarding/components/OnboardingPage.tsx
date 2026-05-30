"use client";

import { ShieldAlert } from "lucide-react";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { PageHeader } from "@/components/shared/page-header";
import { useSession } from "@/features/auth/auth-provider";
import { CreateWorkerForm } from "./CreateWorkerForm";

export function OnboardingPage() {
  const { status, user } = useSession();

  if (status === "loading") {
    return <LoadingPanel title="Inicializando alta de colaborador..." />;
  }

  if (!user) {
    return (
      <ErrorState
        title="Error de carga"
        description="No se pudo resolver la sesion del usuario autenticado."
      />
    );
  }

  const role = user.role;
  const isAuthorized = role === "admin" || role === "hr";

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50">
          <ShieldAlert className="size-8 text-rose-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Acceso no autorizado</h3>
        <p className="max-w-sm text-sm text-slate-500">
          Este modulo es de uso exclusivo para Recursos Humanos y Administradores de FABRYOR.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <PageHeader
        eyebrow="Personal"
        title="Alta de Colaborador"
        description="Registra el perfil, ubigeo, puesto y contrato inicial mediante el alta transaccional."
      />
      <CreateWorkerForm />
    </div>
  );
}
