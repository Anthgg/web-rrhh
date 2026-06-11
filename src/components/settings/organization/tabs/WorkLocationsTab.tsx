"use client";

import { WorkLocationsWorkspace } from "@/features/work-locations/work-locations-workspace";

/**
 * Renders the Lugares de Trabajo tab inside the Estructura Organizacional workspace.
 * Delegates everything to WorkLocationsWorkspace (the feature-complete component)
 * so that create / edit / delete / toggle use the same form with map + autocomplete.
 */
export function WorkLocationsTab() {
 return <WorkLocationsWorkspace hideHeader />;
}
