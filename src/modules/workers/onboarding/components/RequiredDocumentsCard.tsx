import type { UseFormReturn } from "react-hook-form";

import type { OnboardingFormValues } from "../schemas/onboarding.schema";

interface RequiredDocumentsCardProps {
  form: UseFormReturn<OnboardingFormValues>;
}

export function RequiredDocumentsCard({ form }: RequiredDocumentsCardProps) {
  const { watch, setValue } = form;
  const selectedDocs = watch("requiredDocuments") || [];

  const handleToggle = (type: string, title: string) => {
    const isSelected = selectedDocs.some((document) => document.type === type);
    if (isSelected) {
      setValue(
        "requiredDocuments",
        selectedDocs.filter((document) => document.type !== type),
        { shouldValidate: true, shouldDirty: true },
      );
    } else {
      setValue("requiredDocuments", [...selectedDocs, { type, title }], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const documentTypes = [
    { type: "DNI", title: "DNI" },
    { type: "CV", title: "CV" },
    { type: "MEDICAL_CERTIFICATE", title: "Certificado médico" },
    { type: "BACKGROUND_CHECK", title: "Certificado de antecedentes" },
    { type: "STUDIES_CERTIFICATE", title: "Certificado de estudios" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Documentos Requeridos al Ingreso
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Selecciona los documentos requeridos para el alta. Se crearán en estado &quot;Falta cargar&quot; (missing).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {documentTypes.map((documentType) => {
          const isChecked = selectedDocs.some((document) => document.type === documentType.type);
          return (
            <label
              key={documentType.type}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-muted/50 ${
                isChecked
                  ? "bg-primary/5 border-primary/30 text-foreground"
                  : "bg-background border-border text-muted-foreground"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(documentType.type, documentType.title)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
              />
              <span className="text-sm font-medium">{documentType.title}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
