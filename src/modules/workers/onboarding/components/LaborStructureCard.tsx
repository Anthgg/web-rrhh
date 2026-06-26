import { LaborOrganizationFields } from "./LaborOrganizationFields";
import { LaborWorkAssignmentFields } from "./LaborWorkAssignmentFields";
import type { LaborOrganizationFieldsProps, LaborWorkAssignmentFieldsProps } from "./labor-data.types";

interface LaborStructureCardProps extends LaborOrganizationFieldsProps, LaborWorkAssignmentFieldsProps {}

export function LaborStructureCard(props: LaborStructureCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Asignacion Laboral / Estructura Organizativa
      </h4>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <LaborOrganizationFields {...props} />
        <LaborWorkAssignmentFields {...props} />
      </div>
    </div>
  );
}

