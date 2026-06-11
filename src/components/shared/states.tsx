import { AlertTriangle, Lock, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LoadingPanel({ title = "Cargando modulo" }: { title?: string }) {
 return (
 <Card className="grid gap-4">
 <div className="h-4 w-40 animate-pulse rounded-full bg-card-muted" />
 <div className="grid gap-3">
 <div className="h-20 animate-pulse rounded-3xl bg-card-muted" />
 <div className="h-20 animate-pulse rounded-3xl bg-card-muted" />
 <div className="h-20 animate-pulse rounded-3xl bg-card-muted" />
 </div>
 <p className="text-sm text-foreground-soft">{title}</p>
 </Card>
 );
}

export function EmptyState({
 title,
 description,
}: {
 title: string;
 description: string;
}) {
 return (
 <Card className="grid place-items-center gap-3 py-12 text-center">
 <div className="flex size-14 items-center justify-center rounded-full bg-card-muted text-foreground-soft">
 <SearchX className="size-6" />
 </div>
 <div className="grid gap-1">
 <h3 className="section-title text-xl font-semibold text-foreground">{title}</h3>
 <p className="max-w-md text-sm text-foreground-soft">{description}</p>
 </div>
 </Card>
 );
}

export function PermissionState({ moduleName }: { moduleName: string }) {
 return (
 <Card className="grid place-items-center gap-4 py-16 text-center">
 <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
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
 <Card className="grid gap-4 border-rose-200">
 <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
 <AlertTriangle className="size-5" />
 </div>
 <div className="grid gap-1">
 <h3 className="section-title text-xl font-semibold text-foreground">{title}</h3>
 <p className="text-sm text-foreground-soft">{description}</p>
 </div>
 {onRetry ? <Button onClick={onRetry}>Reintentar</Button> : null}
 </Card>
 );
}
