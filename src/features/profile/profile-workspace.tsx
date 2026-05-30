"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, LoadingPanel } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldFrame, Input } from "@/components/ui/fields";
import { formatRole } from "@/lib/utils/format";
import { profileService } from "@/services/profile.service";
import type { ChangePasswordInput, ProfileUpdateInput } from "@/types";

const profileSchema = z.object({
  fullName: z.string().min(3, "Ingresa el nombre completo."),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Ingresa la contraseña actual."),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirma la nueva contraseña."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export function ProfileWorkspace() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.get,
    retry: false,
  });

  const profileForm = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      position: "",
      department: "",
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const currentUser = profileQuery.data.user;
    profileForm.reset({
      fullName: currentUser.fullName,
      phone: currentUser.phone ?? "",
      position: currentUser.position,
      department: currentUser.department ?? "",
    });
  }, [profileForm, profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: profileService.update,
    onSuccess() {
      toast.success("Perfil actualizado.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess(result) {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      passwordForm.reset();
    },
  });

  if (profileQuery.isLoading) {
    return <LoadingPanel title="Cargando perfil." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        title="No pudimos cargar el perfil"
        description="El perfil del usuario se resuelve desde la sesión y también está listo para edición desacoplada."
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const currentUser = profileQuery.data.user;

  return (
    <>
      <PageHeader
        eyebrow="Cuenta"
        title="Perfil de usuario"
        description="Consulta y actualización de datos permitidos del usuario autenticado."
      />

      <section className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Card className="grid gap-4">
          <div className="grid gap-1">
            <h2 className="section-title text-2xl font-semibold text-ink">{currentUser.fullName}</h2>
            <p className="text-sm text-ink-soft">{currentUser.email}</p>
          </div>

          <div className="grid gap-3 rounded-3xl bg-surface-muted p-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-soft">Rol</span>
              <strong className="text-ink">{formatRole(currentUser.role)}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-soft">Cargo</span>
              <strong className="text-ink">{currentUser.position}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-soft">Proyecto</span>
              <strong className="text-ink">{currentUser.project ?? "No asignado"}</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-soft">Sesión</span>
              <strong className="text-ink">{profileQuery.data.source.toUpperCase()}</strong>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-5">
            <div className="grid gap-1">
              <h2 className="section-title text-2xl font-semibold text-ink">Datos personales</h2>
              <p className="text-sm text-ink-soft">
                Solo se editan campos permitidos para el entorno web administrativo.
              </p>
            </div>

            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={profileForm.handleSubmit(async (values) => {
                try {
                  await updateMutation.mutateAsync(values);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "No se pudo actualizar el perfil.",
                  );
                }
              })}
            >
              <FieldFrame label="Nombre completo" error={profileForm.formState.errors.fullName?.message}>
                <Input {...profileForm.register("fullName")} />
              </FieldFrame>
              <FieldFrame label="Teléfono" error={profileForm.formState.errors.phone?.message}>
                <Input {...profileForm.register("phone")} />
              </FieldFrame>
              <FieldFrame label="Cargo" error={profileForm.formState.errors.position?.message}>
                <Input {...profileForm.register("position")} />
              </FieldFrame>
              <FieldFrame label="Área" error={profileForm.formState.errors.department?.message}>
                <Input {...profileForm.register("department")} />
              </FieldFrame>

              <div className="md:col-span-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Card>

          <Card className="grid gap-5">
            <div className="grid gap-1">
              <h2 className="section-title text-2xl font-semibold text-ink">Seguridad</h2>
              <p className="text-sm text-ink-soft">
                Cambio de contraseña preparado. Si el backend no expone la ruta final, la interfaz
                ya informa esa limitación con claridad.
              </p>
            </div>

            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={passwordForm.handleSubmit(async (values) => {
                try {
                  await passwordMutation.mutateAsync(values);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
                  );
                }
              })}
            >
              <FieldFrame
                label="Contraseña actual"
                error={passwordForm.formState.errors.currentPassword?.message}
              >
                <Input type="password" {...passwordForm.register("currentPassword")} />
              </FieldFrame>
              <div />
              <FieldFrame
                label="Nueva contraseña"
                error={passwordForm.formState.errors.newPassword?.message}
              >
                <Input type="password" {...passwordForm.register("newPassword")} />
              </FieldFrame>
              <FieldFrame
                label="Confirmar contraseña"
                error={passwordForm.formState.errors.confirmPassword?.message}
              >
                <Input type="password" {...passwordForm.register("confirmPassword")} />
              </FieldFrame>

              <div className="md:col-span-2">
                <Button type="submit" disabled={passwordMutation.isPending}>
                  Cambiar contraseña
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </>
  );
}
