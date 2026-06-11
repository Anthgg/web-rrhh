"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { useSession } from "@/features/auth/auth-provider";
import { PageContainer } from "@/components/layout/page-container";
import { CreateWorkerForm } from "./CreateWorkerForm";

// ─── Page metadata per mode ───────────────────────────────────────────────────

const PAGE_META = {
 contract: {
 eyebrow: "Personal · Contrato",
 title: "Generar contrato inicial",
 description: "Completa las condiciones salariales y el tipo de contrato para generar el documento para este trabajador.",
 },
 complete: {
 eyebrow: "Personal · Edición",
 title: "Completar información del trabajador",
 description: "Actualiza los datos personales y laborales del trabajador registrado.",
 },
 create: {
 eyebrow: "Personal",
 title: "Alta de Colaborador",
 description: "Registra el perfil, ubigeo, puesto y contrato inicial mediante el alta transaccional.",
 },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingPage() {
 return (
 <Suspense fallback={<LoadingPanel title="Inicializando alta de colaborador..." />}>
 <OnboardingPageContent />
 </Suspense>
 );
}

function OnboardingPageContent() {
 const { status, user } = useSession();
 const searchParams = useSearchParams();

 // Resolve mode — same logic as the hook so title matches the form behaviour
 const modeParam = searchParams.get("mode") ?? "create";
 const sourceParam = searchParams.get("source") ?? "";

 const isCompletionMode = modeParam === "complete";
 const isContractMode = !isCompletionMode && sourceParam === "contract";

 // Keep meta in scope in case it's needed by child components in future
 void (isContractMode
 ? PAGE_META.contract
 : isCompletionMode
 ? PAGE_META.complete
 : PAGE_META.create);

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
 <h3 className="text-lg font-bold text-foreground">Acceso no autorizado</h3>
 <p className="max-w-sm text-sm text-muted-foreground">
 Este modulo es de uso exclusivo para Recursos Humanos y Administradores de FABRYOR.
 </p>
 </div>
 );
 }

 /*
 * variant="wide" lets the two-column form grid (form + summary panel) use
 * the full available width between the sidebar and the right edge.
 * The shell's page-grid already provides the correct horizontal padding —
 * no extra wrapper or max-width needed here.
 */
 return (
 <PageContainer variant="wide">
 <CreateWorkerForm />
 </PageContainer>
 );
}
