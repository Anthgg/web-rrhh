"use client";

import type { UseFormReturn } from "react-hook-form";
import type { UserProfile } from "@/types";
import type { ProfileFormValues } from "../profile-workspace";

import { ProfileSectionCard } from "./ProfileSectionCard";
import { ProfileField } from "./ProfileField";
import { ContactInfoCard } from "./ContactInfoCard";
import { User, ShieldAlert, MapPin, Phone, UserCheck, Calendar, FileText } from "lucide-react";

interface ProfilePersonalTabProps {
 user: UserProfile;
 form: UseFormReturn<ProfileFormValues>;
 onSubmit: (values: ProfileFormValues) => Promise<void>;
 isPending: boolean;
}


export function ProfilePersonalTab({ user, form, onSubmit, isPending }: ProfilePersonalTabProps) {
 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
 {/* Left Column: Read-only personal data */}
 <div className="flex flex-col gap-6 w-full">
 {/* Personal Data Card — read only (managed by HR) */}
 <ProfileSectionCard
 title="Datos Personales"
 description="Información básica oficial registrada en la empresa."
 icon={<User className="size-5" />}
 badge={
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
 <ShieldAlert className="size-3" />
 Gestionado por RR.HH.
 </span>
 }
 >
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <ProfileField
 label="Documento de Identidad (DNI)"
 value={user.personalId || user.documentNumber}
 icon={<FileText className="size-4" />}
 />
 <ProfileField
 label="Fecha de Nacimiento"
 value={user.birthDate}
 icon={<Calendar className="size-4" />}
 />
 <ProfileField
 label="Género"
 value={user.genderLabel || user.gender}
 icon={<User className="size-4" />}
 />
 <ProfileField
 label="Estado Civil"
 value={user.civilStatusLabel || user.civilStatus}
 icon={<UserCheck className="size-4" />}
 />
 <ProfileField
 label="Nacionalidad"
 value={user.nationality}
 icon={<User className="size-4" />}
 />
 <ProfileField
 label="Departamento (Geográfico)"
 value={user.departmentGeo}
 icon={<MapPin className="size-4" />}
 />
 <ProfileField
 label="Provincia"
 value={user.province}
 icon={<MapPin className="size-4" />}
 />
 <ProfileField
 label="Distrito"
 value={user.district}
 icon={<MapPin className="size-4" />}
 />
 </div>
 </ProfileSectionCard>

 {/* Emergency Contact — now read-only preview (editable in ContactInfoCard) */}
 <ProfileSectionCard
 title="Contacto de Emergencia (actual)"
 description="Vista de solo lectura. Edita estos datos en el formulario a la derecha."
 icon={<Phone className="size-5" />}
 >
 {user.emergencyContactName ? (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <ProfileField
 label="Contacto"
 value={user.emergencyContactName}
 icon={<User className="size-4" />}
 />
 <ProfileField
 label="Parentesco"
 value={user.emergencyContactRelationship}
 icon={<UserCheck className="size-4" />}
 />
 <ProfileField
 label="Teléfono"
 value={user.emergencyContactPhone}
 icon={<Phone className="size-4" />}
 />
 </div>
 ) : (
 <div className="p-4 bg-muted border border-border rounded-xl text-center text-xs sm:text-sm text-muted-foreground italic">
 Sin contacto de emergencia registrado. Puedes añadirlo en el formulario.
 </div>
 )}
 </ProfileSectionCard>
 </div>

 {/* Right Column: Editable Contact Info + Emergency Contact form */}
 <div className="w-full">
 <ContactInfoCard
 user={user}
 form={form}
 onSubmit={onSubmit}
 isPending={isPending}
 />
 </div>
 </div>
 );
}
