import { ProtectedShell } from "@/components/layout/app-shell";

export default function ProtectedLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <ProtectedShell>{children}</ProtectedShell>;
}
