"use client";

import { useSession } from "@/features/auth/auth-provider";
import { useDownloadReportPdf, type UseDownloadReportPdfOptions } from "@/hooks/reports/useDownloadReportPdf";
import { REPORT_CONFIGS, type ReportPdfType } from "@/constants/reportEndpoints";
import { Button, type ButtonProps } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CustomDataPayload } from "@/services/reports/downloadReportPdf";

export interface DownloadPdfButtonProps extends UseDownloadReportPdfOptions {
 reportType: ReportPdfType;
 filters?: Record<string, unknown>;
 reportTitle?: string;
 documentType?: string;
 internalLabel?: string;
 customData?: CustomDataPayload;
 filename?: string;
 className?: string;
 variant?: ButtonProps["variant"];
 disabled?: boolean;
 children?: React.ReactNode;
 showIconOnly?: boolean;
}

export function DownloadPdfButton({
 reportType,
 filters,
 reportTitle,
 documentType,
 internalLabel,
 customData,
 filename,
 className,
 variant = "primary",
 disabled = false,
 children,
 showIconOnly = false,
 onStart,
 onSuccess,
 onError,
}: DownloadPdfButtonProps) {
 const { user } = useSession();
 const config = REPORT_CONFIGS[reportType];

 // El administrador, super_admin y hr tienen acceso global.
 // Los demás roles deben poseer el permiso explícito en su perfil.
 const hasPermission =
 user?.role === "admin" ||
 user?.role === "super_admin" ||
 user?.role === "hr" ||
 (user?.permissions && user.permissions.includes(config.permission));

 const { download, isDownloading } = useDownloadReportPdf(reportType, {
 onStart,
 onSuccess,
 onError,
 });

 const handleDownload = () => {
 download({
 filename,
 filters,
 reportTitle,
 documentType,
 internalLabel,
 customData,
 });
 };

 const buttonContent = isDownloading ? (
 <>
 <Loader2 className={cn("size-4 animate-spin", !showIconOnly && "mr-2")} />
 {!showIconOnly && (children || "Generando PDF...")}
 </>
 ) : (
 <>
 <FileText className={cn("size-4", !showIconOnly && "mr-2")} />
 {!showIconOnly && (children || "Exportar PDF")}
 </>
 );

 if (!hasPermission) {
 return (
 <div className="relative group inline-block">
 <Button
 variant={variant}
 className={cn("cursor-not-allowed opacity-60", className)}
 disabled
 >
 <FileText className={cn("size-4 text-muted-foreground", !showIconOnly && "mr-2")} />
 {!showIconOnly && (children || "Exportar PDF")}
 </Button>
 <div className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 scale-95 rounded-lg bg-foreground px-3 py-2 text-center text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 pointer-events-none">
 No tienes permisos para descargar este reporte corporativo.
 <div className="absolute top-full left-1/2 -mt-1 size-2 -translate-x-1/2 rotate-45 bg-foreground" />
 </div>
 </div>
 );
 }

 return (
 <Button
 variant={variant}
 className={className}
 disabled={disabled || isDownloading}
 onClick={handleDownload}
 >
 {buttonContent}
 </Button>
 );
}
