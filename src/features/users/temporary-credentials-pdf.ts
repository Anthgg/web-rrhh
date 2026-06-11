"use client";

import { jsPDF } from "jspdf";

import type { UserProfile } from "@/types";
import { filenameSafe } from "@/services/users.service";

interface TemporaryCredentialsPdfInput {
 user: UserProfile;
 temporaryPassword: string;
 generatedAt: string;
 generatedBy: string;
}

export const buildTemporaryCredentialsFileName = (userName: string, generatedAt: string) => {
 const date = new Date(generatedAt);
 const stamp = Number.isNaN(date.getTime())
 ? new Date().toISOString().slice(0, 10)
 : date.toISOString().slice(0, 10);
 return `credenciales-temporales-${filenameSafe(userName).toLowerCase()}-${stamp}.pdf`;
};

export const createTemporaryCredentialsPdf = ({
 user,
 temporaryPassword,
 generatedAt,
 generatedBy,
}: TemporaryCredentialsPdfInput) => {
 const doc = new jsPDF();
 const generatedDate = new Date(generatedAt);
 const generatedLabel = Number.isNaN(generatedDate.getTime())
 ? new Date().toLocaleString()
 : generatedDate.toLocaleString();
 const accessUser = user.email || user.documentNumber || user.id;

 doc.setFillColor(15, 118, 110);
 doc.rect(0, 0, 210, 34, "F");
 doc.setTextColor(255, 255, 255);
 doc.setFont("helvetica", "bold");
 doc.setFontSize(18);
 doc.text("FABRYOR", 16, 16);
 doc.setFontSize(10);
 doc.text("Documento administrativo generado por el sistema", 16, 24);

 doc.setTextColor(15, 23, 42);
 doc.setFontSize(18);
 doc.text("Credenciales temporales de acceso", 16, 50);

 doc.setFont("helvetica", "normal");
 doc.setFontSize(11);
 const rows: Array<[string, string]> = [
 ["Trabajador", user.fullName],
 ["Documento de identidad", user.documentNumber || user.worker?.personal_id || "No informado"],
 ["Correo o usuario de acceso", accessUser],
 ["Contrasena temporal", temporaryPassword],
 ["Fecha y hora de generacion", generatedLabel],
 ["Administrador responsable", generatedBy || "Administrador del sistema"],
 ];

 let y = 66;
 rows.forEach(([label, value]) => {
 doc.setFont("helvetica", "bold");
 doc.text(label, 16, y);
 doc.setFont("helvetica", "normal");
 doc.text(String(value || "No informado"), 72, y);
 y += 11;
 });

 doc.setFillColor(241, 245, 249);
 doc.roundedRect(16, y + 4, 178, 34, 3, 3, "F");
 doc.setFont("helvetica", "bold");
 doc.text("Nota de seguridad", 22, y + 16);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(10);
 doc.text(
 "Esta contrasena es temporal. El trabajador debera cambiarla al iniciar sesion por primera vez. Por seguridad, este documento debe ser entregado unicamente al titular de la cuenta.",
 22,
 y + 24,
 { maxWidth: 166 },
 );

 return doc;
};

export const downloadTemporaryCredentialsPdf = (input: TemporaryCredentialsPdfInput) => {
 const doc = createTemporaryCredentialsPdf(input);
 doc.save(buildTemporaryCredentialsFileName(input.user.fullName, input.generatedAt));
};

export const temporaryCredentialsPdfBase64 = (input: TemporaryCredentialsPdfInput) => {
 const doc = createTemporaryCredentialsPdf(input);
 return doc.output("datauristring").split(",")[1] ?? "";
};
