export type FeedbackAnimationType = "404" | "500" | "503" | "empty";

interface GetErrorFeedbackInput {
 statusCode?: number | string | null;
 errorCode?: string | null;
 message?: string | null;
}

interface ErrorFeedback {
 title: string;
 description: string;
 animationType: FeedbackAnimationType;
 retryable: boolean;
}

export function getErrorFeedback({
 statusCode,
 errorCode,
 message,
}: GetErrorFeedbackInput): ErrorFeedback {
 const normalizedStatus = statusCode ? String(statusCode) : "";
 const normalizedCode = (errorCode ?? "").toLowerCase();
 const normalizedMessage = (message ?? "").toLowerCase();

 if (normalizedStatus === "404") {
 return {
 title: "Recurso no encontrado",
 description: message ?? "No encontramos la informacion solicitada.",
 animationType: "404",
 retryable: false,
 };
 }

 if (normalizedStatus === "503" || normalizedCode.includes("network") || normalizedMessage.includes("network")) {
 return {
 title: "Servicio no disponible",
 description: message ?? "No pudimos conectar con el servidor. Puedes intentar nuevamente.",
 animationType: "503",
 retryable: true,
 };
 }

 if (
 normalizedStatus === "504" ||
 normalizedCode.includes("timeout") ||
 normalizedMessage.includes("tiempo de espera")
 ) {
 return {
 title: "Tiempo de espera agotado",
 description: message ?? "El servidor demoro demasiado en responder.",
 animationType: "503",
 retryable: true,
 };
 }

 if (normalizedCode.includes("empty")) {
 return {
 title: "Sin informacion disponible",
 description: message ?? "No hay datos para mostrar con los criterios seleccionados.",
 animationType: "empty",
 retryable: false,
 };
 }

 return {
 title: normalizedStatus === "500" ? "Error interno del servidor" : "No pudimos completar la accion",
 description: message ?? "Ocurrio un error inesperado. Intenta nuevamente.",
 animationType: "500",
 retryable: true,
 };
}
