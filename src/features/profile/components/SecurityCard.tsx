"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Shield, Key, Loader2 } from "lucide-react";
import { FieldFrame, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import type { ChangePasswordInput, UserProfile } from "@/types";

// Schema implementing the strict client-side validation rules approved in Ajuste obligatorio 5
const passwordSchema = z
 .object({
 currentPassword: z.string().min(1, "Ingresa la contraseña actual."),
 newPassword: z
 .string()
 .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
 .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula.")
 .regex(/[a-z]/, "Debe contener al menos una letra minúscula.")
 .regex(/[0-9]/, "Debe contener al menos un número.")
 .regex(/[^A-Za-z0-9]/, "Debe contener al menos un símbolo especial (ej. @, #, $, etc.)."),
 confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
 })
 .refine((data) => data.newPassword === data.confirmPassword, {
 message: "Las contraseñas no coinciden.",
 path: ["confirmPassword"],
 })
 .refine((data) => data.newPassword !== data.currentPassword, {
 message: "La nueva contraseña debe ser diferente de la contraseña actual.",
 path: ["newPassword"],
 });

interface SecurityCardProps {
 user: UserProfile;
 onChangePassword: (values: ChangePasswordInput) => Promise<void>;
 isPending: boolean;
}

export function SecurityCard({ user, onChangePassword, isPending }: SecurityCardProps) {
 const lastLogin = user.lastLoginAt 
 ? new Date(user.lastLoginAt).toLocaleString("es-PE", { timeZone: "America/Lima" }) 
 : "No registrado";
 const activeSessions = user.security?.active_sessions ?? 1;
 const verifiedEmail = user.security?.email_verified ? "Verificado" : "Pendiente";

 const {
 register,
 handleSubmit,
 reset,
 formState: { errors },
 } = useForm<ChangePasswordInput>({
 resolver: zodResolver(passwordSchema),
 defaultValues: {
 currentPassword: "",
 newPassword: "",
 confirmPassword: "",
 },
 });

 const onSubmitForm = async (data: ChangePasswordInput) => {
 await onChangePassword(data);
 reset();
 };

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
 <Shield className="size-4" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Seguridad de la Cuenta</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Control de credenciales, sesiones activas y seguridad.</p>
 </div>
 </div>

 {/* Account security details */}
 <div className="grid gap-3 p-4 bg-muted border border-border rounded-xl text-xs sm:text-sm">
 <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-medium">Último Acceso Registrado</span>
 <span className="font-bold text-foreground text-right">{lastLogin}</span>
 </div>
 <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
 <span className="text-muted-foreground font-medium">Sesiones Activas en la Cuenta</span>
 <span className="font-bold text-foreground text-right">{activeSessions} {activeSessions === 1 ? 'dispositivo' : 'dispositivos'}</span>
 </div>
 <div className="flex justify-between gap-4">
 <span className="text-muted-foreground font-medium">Estado del Correo</span>
 <span className={`font-bold ${user.security?.email_verified ? "text-emerald-600" : "text-amber-600"}`}>
 {verifiedEmail}
 </span>
 </div>
 </div>

 {/* Password reset form */}
 <div className="border-t border-border pt-4 grid gap-4">
 <div className="flex items-center gap-2">
 <Key className="size-4 text-muted-foreground" />
 <h3 className="text-sm font-bold text-foreground">Cambiar Contraseña</h3>
 </div>

 <form onSubmit={handleSubmit(onSubmitForm)} className="grid gap-4">
 <FieldFrame 
 label="Contraseña Actual" 
 error={errors.currentPassword?.message}
 >
 <Input 
 type="password" 
 {...register("currentPassword")} 
 disabled={isPending}
 />
 </FieldFrame>

 <div className="grid gap-4 sm:grid-cols-2">
 <FieldFrame 
 label="Nueva Contraseña" 
 error={errors.newPassword?.message}
 >
 <Input 
 type="password" 
 {...register("newPassword")} 
 disabled={isPending}
 />
 </FieldFrame>

 <FieldFrame 
 label="Confirmar Nueva Contraseña" 
 error={errors.confirmPassword?.message}
 >
 <Input 
 type="password" 
 {...register("confirmPassword")} 
 disabled={isPending}
 />
 </FieldFrame>
 </div>

 {/* Password complexity helper */}
 <div className="text-[11px] text-muted-foreground bg-muted/50 border border-border rounded-lg p-2.5">
 <span className="font-bold block mb-1">Requisitos de la contraseña:</span>
 <ul className="list-disc list-inside space-y-0.5">
 <li>Mínimo 8 caracteres</li>
 <li>Una letra mayúscula y una letra minúscula</li>
 <li>Al menos un número y un símbolo especial</li>
 </ul>
 </div>

 <div className="flex justify-end mt-2">
 <Button 
 type="submit" 
 disabled={isPending}
 className="rounded-xl h-10 px-5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
 >
 {isPending && <Loader2 className="size-4 animate-spin" />}
 Actualizar Contraseña
 </Button>
 </div>
 </form>
 </div>
 </Card>
 );
}
