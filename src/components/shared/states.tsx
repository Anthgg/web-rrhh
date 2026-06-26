"use client";

import { Lock } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
 EmptyState as FeedbackEmptyState,
 ErrorState as FeedbackErrorState,
 PageLoader,
} from "@/components/ui/feedback";

export function LoadingPanel({ title = "Cargando modulo" }: { title?: string }) {
 return <PageLoader title={title} />;
}

export function EmptyState({
 title,
 description,
}: {
 title: string;
 description: string;
}) {
 return <FeedbackEmptyState title={title} description={description} />;
}

export function PermissionState({ moduleName }: { moduleName: string }) {
 return (
 <Card className="grid place-items-center gap-4 py-16 text-center">
 <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
 <Lock className="size-7" />
 </div>
 <div className="grid gap-2">
 <h2 className="section-title text-2xl font-semibold">Acceso restringido</h2>
 <p className="max-w-lg text-sm text-foreground-soft">
 Tu rol actual no tiene permisos para ingresar al modulo de {moduleName}. Si necesitas
 acceso, solicita la habilitacion al equipo de RRHH o administracion.
 </p>
 </div>
 </Card>
 );
}

export function ErrorState({
 title,
 description,
 onRetry,
}: {
 title: string;
 description: string;
 onRetry?: () => void;
}) {
 return (
 <FeedbackErrorState
 title={title}
 description={description}
 onRetry={onRetry}
 />
 );
}
