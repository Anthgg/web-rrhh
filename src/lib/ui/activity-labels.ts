export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
 create: "Creación",
 created: "Creación",
 update: "Actualización",
 updated: "Actualización",
 delete: "Eliminación",
 deleted: "Eliminación",
 login: "Inicio de sesión",
 logout: "Cierre de sesión",
 password_reset: "Restablecimiento de contraseña",
 passwordReset: "Restablecimiento de contraseña",
 role_update: "Cambio de rol",
 roleUpdate: "Cambio de rol",
 status_update: "Cambio de estado",
 statusUpdate: "Cambio de estado",
};

export function formatActivityAction(action: string): string {
 if (!action) return "Actividad";

 const normalized = action.trim();

 return (
 ACTIVITY_ACTION_LABELS[normalized] ??
 ACTIVITY_ACTION_LABELS[normalized.toLowerCase()] ??
 normalized
 );
}

export function formatActivityDescription(activity: any): string {
 if (!activity) return "";
 const actor = activity.actorName || activity.actor_name || "Usuario del sistema";
 const rawAction = activity.action || activity.type || "";
 const actionText = formatActivityAction(rawAction);

 // If there's an explicit description, let's clean it up or translate it
 if (activity.description) {
 let desc = activity.description;
 // Replace raw action names in descriptions if present
 Object.entries(ACTIVITY_ACTION_LABELS).forEach(([key, val]) => {
 const regex = new RegExp(`\\b${key}\\b`, "gi");
 desc = desc.replace(regex, val);
 });
 return desc;
 }

 // Handle scope based phrasing
 const scope = activity.scope;
 if (scope === "actor") {
 return `${actionText} realizada por el usuario ${actor}.`;
 }
 if (scope === "target") {
 return `${actionText} realizada sobre este usuario por ${actor}.`;
 }

 return `${actionText} realizada por ${actor}.`;
}
