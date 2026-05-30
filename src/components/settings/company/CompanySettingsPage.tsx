"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  FileCheck2,
  FileSignature,
  ImageIcon,
  Palette,
  Save,
  ShieldCheck,
  Stamp,
} from "lucide-react";

import { BrandPaletteForm } from "@/components/settings/company/BrandPaletteForm";
import { CompanySettingsHeader } from "@/components/settings/company/CompanySettingsHeader";
import { CompanySettingsTabs } from "@/components/settings/company/CompanySettingsTabs";
import { type CompanySettingsSection } from "@/components/settings/company/company-settings-tabs.constants";
import { CorporatePreview } from "@/components/settings/company/CorporatePreview";
import { LegalInfoForm } from "@/components/settings/company/LegalInfoForm";
import { OfficialFilesManager } from "@/components/settings/company/OfficialFilesManager";
import { SettingsStatusCard } from "@/components/settings/company/SettingsStatusCard";
import { CompanySettingsSkeleton } from "@/components/settings/company/CompanySettingsSkeleton";
import { ErrorState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useOfficialFileUpload } from "@/hooks/useOfficialFileUpload";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const HEX_REGEX = /^#([0-9A-F]{6})$/i;

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function CompanySettingsPage() {
  const [activeSection, setActiveSection] = useState<CompanySettingsSection>("summary");
  const {
    applyAssetChange,
    canSave,
    error,
    fetchSettings,
    formData,
    hasLoaded,
    isConfigured,
    isDirty,
    isLoading,
    isSaving,
    resetForm,
    saveSettings,
    settings,
    updateField,
    validationErrors,
  } = useCompanySettings();

  const {
    deleteOfficialFile,
    fileStates,
    isDeletingAny,
    isUploadingAny,
    uploadOfficialFile,
  } = useOfficialFileUpload({
    isConfigured,
    onAssetChange: applyAssetChange,
    onRefresh: () =>
      fetchSettings({
        showLoader: false,
        suppressError: true,
        syncForm: false,
      }),
  });

  const completion = useMemo(() => {
    const legalComplete =
      formData.razon_social.trim().length >= 3 && /^\d{11}$/.test(formData.ruc.replace(/\D/g, ""));
    const logoComplete = Boolean(settings?.logo_url);
    const signatureComplete = Boolean(settings?.firma_url);
    const sealComplete = Boolean(settings?.sello_url);
    const colorsComplete =
      HEX_REGEX.test(formData.color_primario.trim()) &&
      HEX_REGEX.test(formData.color_secundario.trim()) &&
      HEX_REGEX.test(formData.color_texto.trim());
    const documentReady =
      legalComplete && logoComplete && signatureComplete && sealComplete && colorsComplete;

    const items = [
      legalComplete,
      logoComplete,
      signatureComplete,
      sealComplete,
      colorsComplete,
      documentReady,
    ];

    return {
      legalComplete,
      logoComplete,
      signatureComplete,
      sealComplete,
      colorsComplete,
      documentReady,
      completedCount: items.filter(Boolean).length,
      totalCount: items.length,
    };
  }, [formData, settings]);

  const hasAnyConfiguration =
    isConfigured ||
    hasText(formData.razon_social) ||
    hasText(formData.ruc) ||
    Boolean(settings?.logo_url || settings?.firma_url || settings?.sello_url);

  const status = completion.documentReady ? "active" : hasAnyConfiguration ? "pending" : "empty";
  const lastUpdatedLabel = settings?.updated_at
    ? formatDateTime(settings.updated_at)
    : "Sin actualizaciones registradas";
  const isMutating = isSaving || isUploadingAny || isDeletingAny;
  const isPreviewOnly = activeSection === "preview";

  if (isLoading) {
    return <CompanySettingsSkeleton />;
  }

  if (!hasLoaded && error) {
    return (
      <ErrorState
        title="No pudimos cargar la configuracion corporativa"
        description={error}
        onRetry={() => void fetchSettings()}
      />
    );
  }

  const summaryCards = [
    {
      icon: Building2,
      title: "Legal",
      isComplete: completion.legalComplete,
      label: completion.legalComplete ? "Completado" : "Pendiente",
      description: completion.legalComplete
        ? "RUC, razon social y base legal registrados."
        : "Completa razon social y RUC para activar la configuracion.",
    },
    {
      icon: ImageIcon,
      title: "Logo",
      isComplete: completion.logoComplete,
      label: completion.logoComplete ? "Cargado" : "Pendiente",
      description: completion.logoComplete
        ? "Logo disponible para encabezados y reportes."
        : "Sube el logo corporativo en archivos oficiales.",
    },
    {
      icon: FileSignature,
      title: "Firma",
      isComplete: completion.signatureComplete,
      label: completion.signatureComplete ? "Cargada" : "Pendiente",
      description: completion.signatureComplete
        ? "Firma lista para constancias y validaciones."
        : "Agrega la firma digital del representante.",
    },
    {
      icon: Stamp,
      title: "Sello",
      isComplete: completion.sealComplete,
      label: completion.sealComplete ? "Cargado" : "Pendiente",
      description: completion.sealComplete
        ? "Sello institucional disponible."
        : "Sube el sello para documentos oficiales.",
    },
    {
      icon: Palette,
      title: "Colores",
      isComplete: completion.colorsComplete,
      label: completion.colorsComplete ? "Definidos" : "Pendiente",
      description: completion.colorsComplete
        ? "Paleta institucional en formato HEX valido."
        : "Define primario, secundario y color de texto.",
    },
    {
      icon: FileCheck2,
      title: "Documento",
      isComplete: completion.documentReady,
      label: completion.documentReady ? "Listo" : "En progreso",
      description: completion.documentReady
        ? "La plantilla tiene datos, marca y archivos oficiales."
        : "Faltan elementos para emitir documentos completos.",
    },
  ];

  return (
    <div className="grid gap-5" aria-busy={isMutating}>
      <CompanySettingsHeader
        canRestore={isDirty}
        canSave={canSave}
        isSaving={isSaving}
        lastUpdatedLabel={lastUpdatedLabel}
        onRestore={resetForm}
        onSave={() => void saveSettings()}
        status={status}
      />

      <CompanySettingsTabs activeSection={activeSection} onSectionChange={setActiveSection} />

      {isDirty ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Save className="mt-0.5 size-4 shrink-0" />
            <p>
              Cambios pendientes sin guardar. El boton principal permanecera disponible al hacer scroll.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            Pendiente
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="grid gap-1">
            <p className="font-semibold">Incidente reciente</p>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid items-start gap-6",
          isPreviewOnly ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]",
        )}
      >
        <div className="grid min-w-0 gap-6">
          {activeSection === "summary" ? (
            <Card className="grid content-start gap-6 rounded-lg border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid gap-2">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    <ShieldCheck className="size-3.5" />
                    Resumen
                  </span>
                  <div className="grid gap-1">
                    <h2 className="section-title text-xl font-semibold text-ink">
                      Estado general de configuracion
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-ink-soft">
                      Revisa que los datos legales, colores y archivos oficiales esten listos para generar documentos.
                    </p>
                  </div>
                </div>

                <div className="min-w-[180px] rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
                    Progreso
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-ink">
                      {completion.completedCount}
                    </span>
                    <span className="pb-1 text-sm text-ink-soft">/ {completion.totalCount}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(completion.completedCount / completion.totalCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {summaryCards.map((card) => (
                  <SettingsStatusCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    label={card.label}
                    description={card.description}
                    isComplete={card.isComplete}
                  />
                ))}
              </div>
            </Card>
          ) : null}

          {activeSection === "legal" ? (
            <LegalInfoForm
              formData={formData}
              onFieldChange={updateField}
              validationErrors={validationErrors}
            />
          ) : null}

          {activeSection === "brand" ? (
            <BrandPaletteForm
              formData={formData}
              onFieldChange={updateField}
              validationErrors={validationErrors}
            />
          ) : null}

          {activeSection === "files" ? (
            <OfficialFilesManager
              fileStates={fileStates}
              isConfigured={isConfigured}
              settings={settings}
              onUpload={uploadOfficialFile}
              onDelete={deleteOfficialFile}
            />
          ) : null}

          {activeSection === "preview" ? (
            <CorporatePreview
              formData={formData}
              isConfigured={isConfigured}
              logoUrl={settings?.logo_url}
              signatureUrl={settings?.firma_url}
              stampUrl={settings?.sello_url}
              className="xl:mx-auto xl:w-full xl:max-w-5xl"
            />
          ) : null}
        </div>

        {!isPreviewOnly ? (
          <aside className="hidden min-w-0 xl:block">
            <CorporatePreview
              compact
              formData={formData}
              isConfigured={isConfigured}
              logoUrl={settings?.logo_url}
              signatureUrl={settings?.firma_url}
              stampUrl={settings?.sello_url}
              className="sticky top-32"
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
