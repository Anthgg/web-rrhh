"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LayoutDashboard, User, Briefcase, Shield, Settings, History } from "lucide-react";
import { useSession } from "@/features/auth/auth-provider";

import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { getCurrentProfile, updateCurrentProfile, changeProfilePassword, uploadProfilePhoto } from "@/services/profile.service";
import { normalizeCurrentUserProfile, buildProfilePatchPayload } from "@/lib/api/normalizers";
import type { ProfileEditableFields, ChangePasswordFormValues, UserProfile } from "@/types";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/error-handlers";
import { ApiClientError } from "@/lib/api/client";

// Import modular components and tabs
import { ProfileHeaderCard } from "./components/ProfileHeaderCard";
import { ProfileTabs, type ProfileTabType, type TabItem } from "./components/ProfileTabs";
import { ProfileOverviewTab } from "./components/ProfileOverviewTab";
import { ProfilePersonalTab } from "./components/ProfilePersonalTab";
import { ProfileLaborTab } from "./components/ProfileLaborTab";
import { ProfileSecurityTab } from "./components/ProfileSecurityTab";
import { ProfilePreferencesTab } from "./components/ProfilePreferencesTab";
import { ProfileActivityTab } from "./components/ProfileActivityTab";
import { PageContainer } from "@/components/layout/page-container";

// ─── Validation schema for the editable profile form ──────────────────────────
const profileSchema = z.object({
 fullName: z.string().min(3, "Ingresa el nombre completo."),
 phone: z.string().nullable().optional(),
 personalEmail: z
 .email({ message: "Ingresa un correo válido." })
 .nullable()
 .optional()
 .or(z.literal("")),
 secondaryPhone: z.string().nullable().optional(),
 address: z.string().nullable().optional(),
 province: z.string().nullable().optional(),
 district: z.string().nullable().optional(),
 emergencyContactName: z.string().nullable().optional(),
 emergencyContactPhone: z
 .string()
 .nullable()
 .optional()
 .refine((val) => {
 if (!val || val.trim() === "") return true;
 const digits = val.replace(/\D/g, "");
 if (digits.length === 9) return true;
 if (digits.length === 11 && digits.startsWith("51")) return true;
 return false;
 }, {
 message: "El teléfono debe tener exactamente 9 dígitos.",
 }),
 emergencyContactRelationship: z.string().nullable().optional(),
});

/** Form values type — fullName required (string), all others optional + nullable */
export type ProfileFormValues = z.infer<typeof profileSchema>;

const tabsConfig: TabItem[] = [
 { id: "overview", label: "Resumen", icon: <LayoutDashboard className="size-4" /> },
 { id: "personal", label: "Datos Personales", icon: <User className="size-4" /> },
 { id: "labor", label: "Ficha Laboral", icon: <Briefcase className="size-4" /> },
 { id: "security", label: "Seguridad", icon: <Shield className="size-4" /> },
 { id: "preferences", label: "Preferencias", icon: <Settings className="size-4" /> },
 { id: "activity", label: "Actividad", icon: <History className="size-4" /> },
];

export function ProfileWorkspace() {
 const queryClient = useQueryClient();
 const { refreshSession } = useSession();
 const [activeTab, setActiveTab] = useState<ProfileTabType>("overview");

 // ── Load profile ────────────────────────────────────────────────────────────
 const {
 data: profileData,
 isLoading: isProfileLoading,
 isError: isProfileError,
 refetch: refetchProfile,
 } = useQuery({
 queryKey: ["profile", "current"],
 queryFn: getCurrentProfile,
 select: normalizeCurrentUserProfile,
 retry: false,
 });

 // ── Editable form ───────────────────────────────────────────────────────────
 // Track initial values to compute PATCH diff
 const initialValuesRef = useRef<Partial<ProfileEditableFields>>({});

 const profileForm = useForm<ProfileFormValues>({
 resolver: zodResolver(profileSchema),
 defaultValues: {
 fullName: "",
 phone: null,
 personalEmail: null,
 secondaryPhone: null,
 address: null,
 province: null,
 district: null,
 emergencyContactName: null,
 emergencyContactPhone: null,
 emergencyContactRelationship: null,
 },
 });

 // Populate form when profile data arrives
 useEffect(() => {
 if (!profileData) return;
 const initial: ProfileFormValues = {
 fullName: profileData.fullName ?? "",
 phone: profileData.phone ?? null,
 personalEmail: profileData.personalEmail ?? null,
 secondaryPhone: profileData.secondaryPhone ?? null,
 address: profileData.address ?? null,
 province: profileData.province ?? null,
 district: profileData.district ?? null,
 emergencyContactName: profileData.emergencyContactName ?? null,
 emergencyContactPhone: profileData.emergencyContactPhone ?? null,
 emergencyContactRelationship: profileData.emergencyContactRelationship ?? null,
 };
 initialValuesRef.current = initial;
 profileForm.reset(initial);
 }, [profileForm, profileData]);

 // ── PATCH mutation ──────────────────────────────────────────────────────────
 const updateMutation = useMutation({
 mutationFn: updateCurrentProfile,
 onSuccess(response) {
 // Use backend response to update cache directly (avoids extra GET)
 const updated = normalizeCurrentUserProfile(response);
 queryClient.setQueryData(["profile", "current"], updated);
 // Update initial values so next diff is computed from new baseline
 initialValuesRef.current = {
 fullName: updated.fullName ?? "",
 phone: updated.phone ?? null,
 personalEmail: updated.personalEmail ?? null,
 secondaryPhone: updated.secondaryPhone ?? null,
 address: updated.address ?? null,
 province: updated.province ?? null,
 district: updated.district ?? null,
 emergencyContactName: updated.emergencyContactName ?? null,
 emergencyContactPhone: updated.emergencyContactPhone ?? null,
 emergencyContactRelationship: updated.emergencyContactRelationship ?? null,
 };
 profileForm.reset(initialValuesRef.current);
 toast.success("Perfil actualizado correctamente.");
 // Also invalidate profile and auth session so nav bar, etc. refreshes
 void queryClient.invalidateQueries({ queryKey: ["profile", "current"] });
 void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
 },
 onError(error: unknown) {
 const code = getApiErrorCode(error);
 if (code === "INVALID_EMERGENCY_PHONE") {
 toast.error("El teléfono de contacto de emergencia debe tener 9 dígitos.");
 } else {
 toast.error(
 error instanceof Error ? error.message : "No se pudo actualizar el perfil.",
 );
 }
 },
 });

 // ── Photo upload mutation ───────────────────────────────────────────────────
 const uploadPhotoMutation = useMutation({
 mutationFn: uploadProfilePhoto,
 onSuccess(response) {
 const newUrl = normalizeCurrentUserProfile(response).avatarUrl;
 if (newUrl) {
 queryClient.setQueryData(["profile", "current"], (oldData: UserProfile | undefined) => {
 if (!oldData) return oldData;
 return {
 ...oldData,
 avatarUrl: newUrl,
 };
 });
 }
 toast.success("Foto de perfil actualizada correctamente.");
 void queryClient.invalidateQueries({ queryKey: ["profile", "current"] });
 void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
 void refreshSession();
 },
 onError(error: unknown) {
 const code = getApiErrorCode(error);
 const status = error instanceof ApiClientError ? error.status : null;
 if (code === "FILE_TOO_LARGE" || status === 413) {
 toast.error("La imagen excede el tamaño máximo permitido.");
 } else if (code === "UNSUPPORTED_MEDIA_TYPE" || status === 415) {
 toast.error("El formato de archivo no es válido. Solo se permiten imágenes.");
 } else {
 toast.error(getApiErrorMessage(error, "No se pudo subir la foto de perfil."));
 }
 },
 });

 // ── Password mutation ───────────────────────────────────────────────────────
 const passwordMutation = useMutation({
 mutationFn: changeProfilePassword,
 onSuccess(result) {
 toast.success(result?.message ?? "Contraseña actualizada correctamente.");
 void queryClient.invalidateQueries({ queryKey: ["profile", "current"] });
 },
 onError(error: unknown) {
 toast.error(
 error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
 );
 },
 });

 // ── Loading / error states ──────────────────────────────────────────────────
 if (isProfileLoading) {
 return <LoadingPanel title="Cargando perfil..." />;
 }

 if (isProfileError || !profileData) {
 return (
 <ErrorState
 title="No pudimos cargar el perfil"
 description="Hubo un problema al contactar con el servidor. Por favor, vuelve a intentarlo."
 onRetry={() => void refetchProfile()}
 />
 );
 }

 // ── Handlers ────────────────────────────────────────────────────────────────
 const handleProfileSubmit = async (values: ProfileFormValues) => {
 const payload = buildProfilePatchPayload(initialValuesRef.current, values as Partial<ProfileEditableFields>);
 if (Object.keys(payload).length === 0) {
 toast.info("No hay cambios para guardar.");
 return;
 }
 try {
 await updateMutation.mutateAsync(payload);
 } catch {
 // Error already handled in onError
 }
 };

 const handlePasswordSubmit = async (values: ChangePasswordFormValues) => {
 // Only send currentPassword + newPassword — never confirmPassword
 try {
 await passwordMutation.mutateAsync({
 currentPassword: values.currentPassword,
 newPassword: values.newPassword,
 });
 } catch {
 // Error already handled in onError
 }
 };

 return (
 <PageContainer variant="fluid" className="overflow-x-hidden">

 {/* ── Unified top section: eyebrow title + hero ── */}
 <div className="bg-background px-6 lg:px-8 pt-6 pb-5">
 {/* Eyebrow breadcrumb */}
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Cuenta</p>
 <h1 className="text-2xl font-bold text-foreground leading-tight tracking-tight">Mi Perfil</h1>
 </div>
 </div>

 {/* Hero card */}
 <ProfileHeaderCard
 user={profileData}
 onEditProfile={() => setActiveTab("personal")}
 onUploadPhoto={(file) => uploadPhotoMutation.mutate(file)}
 isUploading={uploadPhotoMutation.isPending}
 />
 </div>

 {/* ── Sticky tab bar ── */}
 <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-6 lg:px-8">
 <ProfileTabs
 tabs={tabsConfig}
 activeTab={activeTab}
 onChangeTab={setActiveTab}
 />
 </div>

 {/* ── Tab content ── */}
 <div className="flex-1 w-full px-6 lg:px-8 py-6 bg-background animate-[dashboard-rise_300ms_ease-out]">
 {activeTab === "overview" && <ProfileOverviewTab user={profileData} />}

 {activeTab === "personal" && (
 <ProfilePersonalTab
 user={profileData}
 form={profileForm}
 onSubmit={handleProfileSubmit}
 isPending={updateMutation.isPending}
 />
 )}

 {activeTab === "labor" && <ProfileLaborTab user={profileData} />}

 {activeTab === "security" && (
 <ProfileSecurityTab
 user={profileData}
 onChangePassword={handlePasswordSubmit}
 isPending={passwordMutation.isPending}
 />
 )}

 {activeTab === "preferences" && <ProfilePreferencesTab />}

 {activeTab === "activity" && <ProfileActivityTab user={profileData} />}
 </div>
 </PageContainer>
 );
}
