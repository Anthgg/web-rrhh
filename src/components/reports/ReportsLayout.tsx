import { PageHeader } from "@/components/shared/page-header";

export function ReportsLayout({
 title,
 description,
 action,
 children,
}: {
 title: string;
 description: string;
 action?: React.ReactNode;
 children: React.ReactNode;
}) {
 return (
 <div className="grid gap-6">
 <PageHeader
 eyebrow="Analitica de solicitudes"
 title={title}
 description={description}
 action={action}
 />

 {children}
 </div>
 );
}
