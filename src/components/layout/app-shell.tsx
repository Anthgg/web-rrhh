"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationLink } from "@/components/layout/NavigationLink";
import { useQuery } from "@tanstack/react-query";
import {
 BarChart3,
 Bell,
 Building2,
 ChevronDown,
 ChevronRight,
 ClipboardList,
 Clock3,
 FileText,
 FilePlus2,
 FileSpreadsheet,
 Home,
 Library,
 LogOut,
 Menu,
 PanelLeftClose,
 PanelLeftOpen,
 Settings2,
 ShieldCheck,
 UserCog,
 UserRoundCog,
 Users2,
 UsersRound,
 X,
 Network,
 CalendarDays,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { PermissionState } from "@/components/shared/states";
import { useSession } from "@/features/auth/auth-provider";
import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { canAccessRoute, getRoleLabel, getRouteKey, routeLabels } from "@/lib/auth/access";
import { cn } from "@/lib/utils/cn";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { isAdminRequestManager } from "@/lib/utils/requests";
import type { PaginatedRequestsResponse } from "@/types/requests";

type NavItem = {
 href: string;
 label: string;
 icon: React.ComponentType<{ className?: string }>;
 children?: NavItem[];
};

const navItems: NavItem[] = [
 { href: "/dashboard", label: "Dashboard", icon: Home },
 {
 href: "/dashboard/requests/my",
 label: "Solicitudes",
 icon: FileText,
 children: [
 { href: "/dashboard/requests/my", label: "Mis solicitudes", icon: ClipboardList },
 { href: "/dashboard/requests/new", label: "Nueva solicitud", icon: FilePlus2 },
 { href: "/dashboard/vacations", label: "Mis vacaciones", icon: CalendarDays },
 { href: "/dashboard/requests/pending", label: "Pendientes", icon: Clock3 },
 { href: "/dashboard/requests/reports", label: "Reportes", icon: FileSpreadsheet },
 { href: "/dashboard/requests/templates", label: "Plantillas", icon: Library },
 ],
 },
 { href: "/documentos", label: "Documentos", icon: ShieldCheck },
 { href: "/usuarios", label: "Usuarios", icon: UserRoundCog },
 {
 href: "/trabajadores",
 label: "Trabajadores",
 icon: Users2,
 children: [
 { href: "/trabajadores", label: "Lista de Personal", icon: Users2 },
 { href: "/trabajadores/alta", label: "Alta de Colaborador", icon: FilePlus2 },
 ],
 },
 { href: "/equipos-de-trabajo", label: "Equipos de Trabajo", icon: UsersRound },
 {
    href: "/dashboard/schedule",
    label: "Horarios y Asistencia",
    icon: Clock3,
    children: [
      { href: "/dashboard/schedule/policies", label: "Politicas laborales", icon: Settings2 },
      { href: "/dashboard/schedule/shifts", label: "Turnos", icon: Clock3 },
      { href: "/dashboard/schedule/assignments", label: "Asignaciones", icon: UserCog },
      { href: "/dashboard/schedule/worker-schedule", label: "Horario de personal", icon: Users2 },
      { href: "/dashboard/schedule/attendance-summary", label: "Resumen de asistencia", icon: FileSpreadsheet },
      { href: "/dashboard/schedule/analytics", label: "Analítica de asistencia", icon: BarChart3 },
      { href: "/dashboard/schedule/holidays", label: "Feriados", icon: ClipboardList },
    ],
  },
 {
 href: "/reports",
 label: "Reportes",
 icon: BarChart3,
 children: [
 { href: "/reports", label: "PDF corporativos", icon: FileText },
 { href: "/reports/dashboard", label: "Dashboard", icon: BarChart3 },
 { href: "/reports/generator", label: "Generador", icon: FileSpreadsheet },
 { href: "/reports/templates", label: "Plantillas", icon: Library },
 ],
 },
 {
 href: "/dashboard/settings/company",
 label: "Configuracion",
 icon: Settings2,
 children: [
 { href: "/dashboard/settings/company", label: "Datos de empresa", icon: Building2 },
 { href: "/estructura", label: "Estructura", icon: Network },
 { href: "/dashboard/settings/organization", label: "Estructura (Legacy)", icon: Users2 },
 ],
 },
 { href: "/perfil", label: "Perfil", icon: UserCog },
];

function isNavItemActive(pathname: string, item: NavItem, siblings?: NavItem[]): boolean {
 if (item.children?.length) {
 return item.children.some((child) => isNavItemActive(pathname, child, item.children));
 }

 if (item.href === "/dashboard") {
 return pathname === "/dashboard";
 }

 const isPrefixMatch = pathname === item.href || pathname.startsWith(item.href + "/");
 if (!isPrefixMatch) return false;

 if (siblings) {
 const betterMatchExists = siblings.some((sibling) => {
 if (sibling.href === item.href) return false;
 const siblingMatches = pathname === sibling.href || pathname.startsWith(sibling.href + "/");
 return siblingMatches && sibling.href.length > item.href.length;
 });
 if (betterMatchExists) return false;
 }

 return true;
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const routeKey = getRouteKey(pathname);
 const [mobileOpen, setMobileOpen] = useState(false);
 const [collapsed, setCollapsed] = useState(false);
 const [userMenuOpen, setUserMenuOpen] = useState(false);
 const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
 const userMenuRef = useRef<HTMLDivElement>(null);
 const { user, status, logout } = useSession();
 const canManageRequests = isAdminRequestManager(user?.role);
 const { data: pendingRequestsData } = useQuery({
 queryKey: ["sidebar-pending-requests"],
 queryFn: () =>
 apiClient<PaginatedRequestsResponse>(webApiEndpoints.requests.pending, {
 query: {
 page: 1,
 pageSize: 1,
 status: "pending",
 sortBy: "newest",
 softFail: 1,
 },
 }),
 enabled: Boolean(user && canManageRequests),
 retry: false,
 staleTime: 5 * 60_000,
 refetchOnWindowFocus: false,
 });
 const pendingRequestsCount = pendingRequestsData?.total ?? 0;

 const navigation = useMemo(() => {
 if (!user) return [];

 return navItems
 .map((item) => {
 if (!item.children?.length) {
 return canAccessRoute(user.role, item.href) ? item : null;
 }

 const children = item.children.filter((child) => {
 if (child.href === "/dashboard/requests/pending" && !canManageRequests) {
 return false;
 }
 if (
 child.href === "/trabajadores/alta" &&
 !(user.role === "admin" || user.role === "hr" || user.role === "super_admin")
 ) {
 return false;
 }

 return canAccessRoute(user.role, child.href);
 });

 if (!children.length) return null;

 return {
 ...item,
 children,
 };
 })
 .filter((item): item is NavItem => Boolean(item));
 }, [canManageRequests, user]);

 if (status === "loading" || !user) {
 return (
 <main className="flex min-h-screen items-center justify-center bg-background px-6">
 <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
 <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
 <div className="h-24 animate-pulse rounded-xl bg-muted" />
 <p className="text-sm text-muted-foreground">Validando sesion y permisos...</p>
 </div>
 </main>
 );
 }

 if (!canAccessRoute(user.role, pathname)) {
 return (
 <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 bg-background">
 <PermissionState moduleName={routeLabels[routeKey] ?? "este modulo"} />
 </main>
 );
 }

 const sectionLabel = routeLabels[routeKey] ?? "Modulo";

 return (
 <div className="flex h-screen overflow-hidden bg-background text-foreground">
 <aside
 className={cn(
 "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[transform,width] duration-300 ease-in-out lg:static lg:translate-x-0",
 mobileOpen ? "translate-x-0" : "-translate-x-full",
 collapsed && "lg:w-[76px]",
 )}
 >
 <div className={cn("flex h-16 shrink-0 items-center border-b border-border/50", collapsed ? "lg:justify-center lg:px-0 px-5 justify-between" : "justify-between px-5")}>
 <Link href="/dashboard" className="flex items-center gap-2.5">
 <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-primary/10 p-1">
 <Image
 src="/logo.png"
 alt="FABRYOR"
 fill
 sizes="32px"
 className="object-contain"
 priority
 />
 </div>
 <div className={cn("flex flex-col", collapsed && "lg:hidden")}>
 <span className="text-sm font-bold tracking-tight text-foreground">FABRYOR</span>
 <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
 Admin Panel
 </span>
 </div>
 </Link>
 {/* Colapsar (desktop) */}
 <button
 type="button"
 className={cn(
 "hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:block",
 collapsed && "lg:hidden",
 )}
 onClick={() => setCollapsed(true)}
 aria-label="Colapsar menu"
 title="Colapsar menu"
 >
 <PanelLeftClose className="size-5" />
 </button>
 {/* Cerrar (mobile) */}
 <button type="button"
 className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
 onClick={() => setMobileOpen(false)}
 aria-label="Cerrar menu"
 >
 <X className="size-5" />
 </button>
 </div>

 {/* Expandir cuando está colapsado */}
 {collapsed ? (
 <button
 type="button"
 className="mx-auto mt-3 hidden size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:grid"
 onClick={() => setCollapsed(false)}
 aria-label="Expandir menu"
 title="Expandir menu"
 >
 <PanelLeftOpen className="size-5" />
 </button>
 ) : null}

 <nav className="flex-1 overflow-y-auto px-3 py-4">
 <div className={cn("mb-2 px-3", collapsed && "lg:hidden")}>
 <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
 Menu principal
 </span>
 </div>
 <div className="space-y-1">
 {navigation.map((item) => {
 const Icon = item.icon;
 const active = isNavItemActive(pathname, item, navigation);
 const isExpanded = expandedGroups[item.href] ?? active;

 // Modo colapsado (desktop): solo icono con tooltip; los grupos navegan a su href.
 if (collapsed) {
 return (
 <NavigationLink
 key={item.href}
 href={item.href}
 title={item.label}
 className={cn(
 "group hidden lg:flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
 active
 ? "bg-sidebar-active text-primary"
 : "text-sidebar-foreground/70 hover:bg-sidebar-active/50 hover:text-primary",
 )}
 onClick={() => setMobileOpen(false)}
 >
 <Icon
 className={cn(
 "h-[20px] w-[20px] shrink-0",
 active ? "text-primary" : "text-muted-foreground/80 group-hover:text-primary",
 )}
 />
 </NavigationLink>
 );
 }

 if (item.children?.length) {
 return (
 <div key={item.href} className="grid gap-1">
 <div
 className={cn(
 "group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200",
 active ? "bg-sidebar-active" : "hover:bg-sidebar-active/50",
 )}
 >
 <NavigationLink
 href={item.href}
 className={cn(
 "flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-[13px] font-medium transition",
 active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
 )}
 onClick={() => {
 setMobileOpen(false);
 setExpandedGroups((current) => ({
 ...current,
 [item.href]: !isExpanded,
 }));
 }}
 >
 <Icon
 className={cn(
 "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
 active ? "text-primary" : "text-muted-foreground/80 group-hover:text-primary",
 )}
 />
 <span className="truncate">{item.label}</span>
 </NavigationLink>

 <button
 type="button"
 onClick={() =>
 setExpandedGroups((current) => ({
 ...current,
 [item.href]: !isExpanded,
 }))
 }
 className="rounded-lg p-1.5 text-muted-foreground/80 transition hover:bg-card hover:text-primary"
 aria-label={`Expandir ${item.label}`}
 >
 <ChevronDown
 className={cn("size-4 transition-transform", isExpanded && "rotate-180")}
 />
 </button>
 </div>

 {isExpanded ? (
 <div className="ml-5 grid gap-1 border-l border-border pl-3">
 {item.children.map((child) => {
 const ChildIcon = child.icon;
 const childActive = isNavItemActive(pathname, child, item.children);
 const isPendingChild = child.href === "/dashboard/requests/pending";

 return (
 <NavigationLink
 key={child.href}
 href={child.href}
 className={cn(
 "group flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-200",
 childActive
 ? "bg-sidebar-active text-primary shadow-sm"
 : "text-sidebar-foreground/70 hover:bg-sidebar-active/50 hover:text-primary",
 )}
 onClick={() => setMobileOpen(false)}
 >
 <ChildIcon
 className={cn(
 "size-4 shrink-0 transition-colors duration-200",
 childActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-primary",
 )}
 />
 <span className="flex-1">{child.label}</span>
 {isPendingChild && canManageRequests ? (
 <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
 {pendingRequestsCount}
 </span>
 ) : null}
 {childActive ? <ChevronRight className="size-3.5 text-primary/50" /> : null}
 </NavigationLink>
 );
 })}
 </div>
 ) : null}
 </div>
 );
 }

 return (
 <NavigationLink
 key={item.href}
 href={item.href}
 className={cn(
 "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
 active
 ? "bg-sidebar-active text-primary shadow-sm"
 : "text-sidebar-foreground/70 hover:bg-sidebar-active/50 hover:text-primary",
 )}
 onClick={() => setMobileOpen(false)}
 >
 <Icon
 className={cn(
 "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
 active ? "text-primary" : "text-muted-foreground/80 group-hover:text-primary",
 )}
 />
 <span className="flex-1">{item.label}</span>
 {active ? <ChevronRight className="size-3.5 text-primary/50" /> : null}
 </NavigationLink>
 );
 })}
 </div>
 </nav>

 <div className="shrink-0 border-t border-border/50 p-3">
 {collapsed ? (
 <div className="hidden flex-col items-center gap-2 lg:flex">
 <UserAvatar
 src={user.avatarUrl}
 fullName={user.fullName}
 email={user.email}
 size="sm"
 rounded="xl"
 />
 <button
 type="button"
 className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
 onClick={() => void logout()}
 aria-label="Cerrar sesion"
 title="Cerrar sesion"
 >
 <LogOut className="h-[18px] w-[18px]" />
 </button>
 </div>
 ) : (
 <>
 <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
 <UserAvatar
 src={user.avatarUrl}
 fullName={user.fullName}
 email={user.email}
 size="sm"
 rounded="xl"
 />
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
 <p className="truncate text-[11px] text-muted-foreground">{getRoleLabel(user.role)}</p>
 </div>
 <button
 type="button"
 className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
 onClick={() => void logout()}
 aria-label="Cerrar sesion"
 title="Cerrar sesion"
 >
 <LogOut className="size-4" />
 </button>
 </div>
 {user.project ? (
 <p className="mt-2 truncate px-1 text-[11px] text-muted-foreground">
 {user.project} - {user.position}
 </p>
 ) : null}
 </>
 )}
 </div>
 </aside>

 {mobileOpen ? (
 <button type="button"
 className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition-opacity lg:hidden"
 onClick={() => setMobileOpen(false)}
 aria-label="Cerrar menu"
 />
 ) : null}

 <div className="flex min-w-0 flex-1 flex-col">
 <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-header text-header-foreground px-4 sm:px-6">
 <div className="flex min-w-0 items-center gap-3">
 <button type="button"
 className="rounded-lg p-2 text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground lg:hidden"
 onClick={() => setMobileOpen(true)}
 aria-label="Abrir menu"
 >
 <Menu className="size-5" />
 </button>
 <div className="min-w-0">
 {/* Breadcrumb */}
 <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Ruta">
 <Link href="/dashboard" className="transition-colors hover:text-foreground">
 Panel
 </Link>
 <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
 <span className="truncate font-medium text-foreground">{sectionLabel}</span>
 </nav>
 <h1 className="section-title truncate text-base font-bold text-foreground sm:text-lg">
 {sectionLabel}
 </h1>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button type="button"
 className="relative rounded-xl p-2 text-muted-foreground/80 transition-colors duration-200 hover:bg-muted hover:text-foreground"
 aria-label="Notificaciones"
 >
 <Bell className="size-5" />
 {canManageRequests && pendingRequestsCount > 0 ? (
 <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-tight text-white ring-2 ring-header">
 {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
 </span>
 ) : (
 <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
 )}
 </button>

 <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

 <div className="relative" ref={userMenuRef}>
 <button type="button"
 className="flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-200 hover:bg-muted"
 onClick={() => setUserMenuOpen((value) => !value)}
 aria-label="Menu de usuario"
 >
 <div className="hidden max-w-[160px] text-right sm:block">
 <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
 <p className="truncate text-[11px] text-muted-foreground">{getRoleLabel(user.role)}</p>
 </div>
 <UserAvatar
 src={user.avatarUrl}
 fullName={user.fullName}
 email={user.email}
 size="sm"
 rounded="xl"
 />
 </button>

 {userMenuOpen ? (
 <>
 <button type="button"
 className="fixed inset-0 z-40"
 onClick={() => setUserMenuOpen(false)}
 aria-label="Cerrar menu"
 />
 <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl animate-[dashboard-rise_200ms_ease-out]">
 <div className="border-b border-border/50 p-4">
 <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
 <p className="truncate text-xs text-muted-foreground">{user.email}</p>
 <span className="mt-2 inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
 {getRoleLabel(user.role)}
 </span>
 </div>
 <div className="p-2">
 <Link
 href="/perfil"
 className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
 onClick={() => setUserMenuOpen(false)}
 >
 <UserCog className="size-4" />
 Mi perfil
 </Link>
 <Link
 href="/dashboard/settings/company"
 className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
 onClick={() => setUserMenuOpen(false)}
 >
 <Settings2 className="size-4" />
 Preferencias
 </Link>
 <button type="button"
 className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
 onClick={() => {
 setUserMenuOpen(false);
 void logout();
 }}
 >
 <LogOut className="size-4" />
 Cerrar sesion
 </button>
 </div>
 </div>
 </>
 ) : null}
 </div>
 </div>
 </header>

 <main className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8">
 <div className="page-grid animate-[dashboard-rise_300ms_ease-out] pb-6">
 {children}
 </div>
 </main>
 </div>
 </div>
 );
}
