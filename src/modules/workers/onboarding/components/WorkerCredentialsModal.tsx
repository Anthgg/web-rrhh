"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Mail, UserRound, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemporaryPasswordReveal } from "@/components/security/TemporaryPasswordReveal";
import { RequestModalShell } from "@/components/requests/request-modal-shell";
import type { WorkerCredentials } from "../types/create-worker.types";

interface WorkerCredentialsModalProps {
 credentials: WorkerCredentials | null;
 onClose: () => void;
}

export function WorkerCredentialsModal({
 credentials,
 onClose,
}: WorkerCredentialsModalProps) {
 const [copied, setCopied] = useState(false);
 const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);

 if (!credentials) return null;

 const copyCredentials = async () => {
 await navigator.clipboard.writeText(
 [
 `Correo: ${credentials.email}`,
 `Usuario: ${credentials.username}`,
 `Contrasena temporal: ${isPasswordRevealed ? credentials.temporaryPassword : "[requiere verificacion en pantalla]"}`,
 ].join("\n"),
 );
 setCopied(true);
 window.setTimeout(() => setCopied(false), 1800);
 };

 const footer = (
 <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="secondary" onClick={onClose}>
 Cerrar
 </Button>
 <Button onClick={copyCredentials} className="gap-2">
 {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
 {copied ? "Credenciales copiadas" : "Copiar credenciales"}
 </Button>
 </div>
 );

 return (
 <RequestModalShell
 isOpen
 size="md"
 title="Colaborador creado"
 subtitle="Entrega estas credenciales al trabajador antes de cerrar el registro."
 onClose={onClose}
 footer={footer}
 >
 <div className="grid gap-5">
 <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
 <UserRoundCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
 <div className="grid gap-1">
 <p className="text-sm font-semibold">Alta transaccional completada</p>
 <p className="text-sm text-emerald-900/80">
 El backend genero la cuenta y la contrasena temporal del nuevo colaborador.
 </p>
 </div>
 </div>

 <dl className="grid gap-3">
 <CredentialRow icon={<Mail className="size-4" />} label="Correo" value={credentials.email} />
 <CredentialRow
 icon={<UserRound className="size-4" />}
 label="Usuario"
 value={credentials.username}
 />
 <CredentialRow
 icon={<KeyRound className="size-4" />}
 label="Contrasena temporal"
 value={credentials.temporaryPassword}
 secret
 onSecretRevealChange={setIsPasswordRevealed}
 />
 </dl>
 </div>
 </RequestModalShell>
 );
}

function CredentialRow({
 icon,
 label,
 value,
 secret = false,
 onSecretRevealChange,
}: {
 icon: React.ReactNode;
 label: string;
 value: string;
 secret?: boolean;
 onSecretRevealChange?: (revealed: boolean) => void;
}) {
 return (
 <div className="grid gap-2 rounded-2xl border border-border bg-card px-4 py-3 sm:grid-cols-[170px_1fr] sm:items-center">
 <dt className="flex items-center gap-2 text-sm font-medium text-foreground-soft">
 <span className="flex size-8 items-center justify-center rounded-xl bg-card-muted text-primary">
 {icon}
 </span>
 {label}
 </dt>
 <dd className={secret ? "min-w-0" : "break-all text-sm font-semibold text-foreground"}>
 {secret && value ? (
 <TemporaryPasswordReveal password={value} label={label} onRevealChange={onSecretRevealChange} />
 ) : (
 value || "No informado"
 )}
 </dd>
 </div>
 );
}
