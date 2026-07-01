import { ProtectedShell } from "@/components/layout/app-shell";
import { NavigationLayoutProvider } from "@/components/layout/use-navigation-layout";

export default function ProtectedLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <NavigationLayoutProvider>
 <ProtectedShell>{children}</ProtectedShell>
 </NavigationLayoutProvider>
 );
}
