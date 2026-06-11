"use client";

import { Card } from "@/components/ui/card";
import { Mail, Phone, Info, MapPin, User, Heart } from "lucide-react";
import { FieldFrame, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import type { UseFormReturn } from "react-hook-form";
import type { UserProfile } from "@/types";
import type { ProfileFormValues } from "../profile-workspace";

interface ContactInfoCardProps {
 user: UserProfile;
 form: UseFormReturn<ProfileFormValues>;
 onSubmit: (values: ProfileFormValues) => Promise<void>;
 isPending: boolean;
}

export function ContactInfoCard({ user, form, onSubmit, isPending }: ContactInfoCardProps) {
 const corporateEmail = user.email || "No registrado";
 const { register, formState: { errors } } = form;

 return (
 <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm grid gap-5">
 <div>
 <h2 className="text-lg font-bold text-card-foreground">Datos de Contacto Editables</h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 Edita tu nombre, teléfono, correo personal y dirección. El correo corporativo es de solo lectura.
 </p>
 </div>

 <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
 {/* Full Name */}
 <FieldFrame
 label="Nombre Completo"
 error={errors.fullName?.message ? String(errors.fullName.message) : undefined}
 >
 <Input
 {...register("fullName")}
 placeholder="Ingresa tu nombre completo"
 disabled={isPending}
 />
 </FieldFrame>

 {/* Corporate Email — read only */}
 <div className="p-3 bg-muted border border-border/50 rounded-xl flex items-center gap-3">
 <div className="p-2 bg-muted-foreground/10 text-muted-foreground rounded-lg shrink-0">
 <Mail className="size-4" />
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] font-bold">
 Correo Corporativo (Solo lectura)
 </span>
 <span className="text-sm font-semibold text-foreground truncate">
 {corporateEmail}
 </span>
 </div>
 </div>

 {/* Primary Phone */}
 <FieldFrame
 label="Teléfono Celular Principal"
 error={errors.phone?.message ? String(errors.phone.message) : undefined}
 >
 <div className="relative flex items-center">
 <div className="absolute left-3 text-muted-foreground">
 <Phone className="size-4" />
 </div>
 <Input
 {...register("phone")}
 className="pl-9"
 placeholder="Ej. +51 987654321"
 disabled={isPending}
 />
 </div>
 </FieldFrame>

 {/* Personal Email */}
 <FieldFrame
 label="Correo Personal"
 error={errors.personalEmail?.message ? String(errors.personalEmail.message) : undefined}
 >
 <div className="relative flex items-center">
 <div className="absolute left-3 text-muted-foreground">
 <Mail className="size-4" />
 </div>
 <Input
 {...register("personalEmail")}
 type="email"
 className="pl-9"
 placeholder="correo@personal.com"
 disabled={isPending}
 />
 </div>
 </FieldFrame>

 {/* Secondary Phone */}
 <FieldFrame
 label="Teléfono Alternativo"
 error={errors.secondaryPhone?.message ? String(errors.secondaryPhone.message) : undefined}
 >
 <div className="relative flex items-center">
 <div className="absolute left-3 text-muted-foreground">
 <Phone className="size-4" />
 </div>
 <Input
 {...register("secondaryPhone")}
 className="pl-9"
 placeholder="Ej. +51 912345678"
 disabled={isPending}
 />
 </div>
 </FieldFrame>

 {/* Address */}
 <FieldFrame
 label="Dirección de Domicilio"
 error={errors.address?.message ? String(errors.address.message) : undefined}
 >
 <div className="relative flex items-center">
 <div className="absolute left-3 text-muted-foreground">
 <MapPin className="size-4" />
 </div>
 <Input
 {...register("address")}
 className="pl-9"
 placeholder="Av. Los Incas 123, Lima"
 disabled={isPending}
 />
 </div>
 </FieldFrame>

 {/* Province + District */}
 <div className="grid gap-4 sm:grid-cols-2">
 <FieldFrame
 label="Provincia"
 error={errors.province?.message ? String(errors.province.message) : undefined}
 >
 <Input
 {...register("province")}
 placeholder="Ej. Lima"
 disabled={isPending}
 />
 </FieldFrame>
 <FieldFrame
 label="Distrito"
 error={errors.district?.message ? String(errors.district.message) : undefined}
 >
 <Input
 {...register("district")}
 placeholder="Ej. San Isidro"
 disabled={isPending}
 />
 </FieldFrame>
 </div>

 {/* Emergency Contact section */}
 <div className="border-t border-border/50 pt-4 grid gap-3">
 <div className="flex items-center gap-2 mb-1">
 <Heart className="size-4 text-destructive" />
 <span className="text-sm font-bold text-foreground/80">Contacto de Emergencia</span>
 </div>

 <FieldFrame
 label="Nombre del Contacto"
 error={errors.emergencyContactName?.message ? String(errors.emergencyContactName.message) : undefined}
 >
 <div className="relative flex items-center">
 <div className="absolute left-3 text-muted-foreground">
 <User className="size-4" />
 </div>
 <Input
 {...register("emergencyContactName")}
 className="pl-9"
 placeholder="Nombre completo del contacto"
 disabled={isPending}
 />
 </div>
 </FieldFrame>

 <div className="grid gap-4 sm:grid-cols-2">
 <FieldFrame
 label="Teléfono de Contacto"
 error={errors.emergencyContactPhone?.message ? String(errors.emergencyContactPhone.message) : undefined}
 >
 <div className="relative flex items-center">
 <div className="absolute left-3 text-muted-foreground">
 <Phone className="size-4" />
 </div>
 <Input
 {...register("emergencyContactPhone")}
 className="pl-9"
 placeholder="+51 987654321"
 disabled={isPending}
 />
 </div>
 </FieldFrame>
 <FieldFrame
 label="Parentesco / Relación"
 error={errors.emergencyContactRelationship?.message ? String(errors.emergencyContactRelationship.message) : undefined}
 >
 <Input
 {...register("emergencyContactRelationship")}
 placeholder="Ej. Madre, Esposo/a"
 disabled={isPending}
 />
 </FieldFrame>
 </div>
 </div>

 <div className="flex justify-between items-center gap-4 flex-wrap pt-2">
 <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
 <Info className="size-3 shrink-0" />
 <span>Los datos laborales son gestionados por RR.HH.</span>
 </div>
 <Button
 type="submit"
 disabled={isPending}
 className="rounded-xl h-10 px-5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
 >
 Guardar Cambios
 </Button>
 </div>
 </form>
 </Card>
 );
}
