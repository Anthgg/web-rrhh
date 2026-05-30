"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings2,
  ShieldCheck,
  UserCog,
  UserRoundCog,
  Users2,
  X,
  Network,
  MapPin,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { PermissionState } from "@/components/shared/states";
import { useSession } from "@/features/auth/auth-provider";
import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { canAccessRoute, getRoleLabel, getRouteKey, routeLabels } from "@/lib/auth/access";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
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
      { href: "/work-locations", label: "Lugares de trabajo", icon: MapPin },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, status, logout } = useSession();
  const canManageRequests = isAdminRequestManager(user?.role);
  const pendingRequestsQuery = useQuery({
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
  const pendingRequestsCount = pendingRequestsQuery.data?.total ?? 0;

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <p className="text-sm text-slate-500">Validando sesion y permisos...</p>
        </div>
      </main>
    );
  }

  if (!canAccessRoute(user.role, pathname)) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
        <PermissionState moduleName={routeLabels[routeKey] ?? "este modulo"} />
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-brand/10 p-1">
              <Image
                src="/logo.png"
                alt="FABRYOR"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-ink">FABRYOR</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">
                Admin Panel
              </span>
            </div>
          </Link>
          <button type="button"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Menu principal
            </span>
          </div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(pathname, item, navigation);
              const isExpanded = expandedGroups[item.href] ?? active;

              if (item.children?.length) {
                return (
                  <div key={item.href} className="grid gap-1">
                    <div
                      className={cn(
                        "group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200",
                        active ? "bg-brand/5" : "hover:bg-brand/5",
                      )}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-[13px] font-medium transition",
                          active ? "text-brand" : "text-slate-600 group-hover:text-brand",
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                            active ? "text-brand" : "text-slate-400 group-hover:text-brand",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGroups((current) => ({
                            ...current,
                            [item.href]: !isExpanded,
                          }))
                        }
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-brand"
                        aria-label={`Expandir ${item.label}`}
                      >
                        <ChevronDown
                          className={cn("size-4 transition-transform", isExpanded && "rotate-180")}
                        />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="ml-5 grid gap-1 border-l border-slate-200 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isNavItemActive(pathname, child, item.children);
                          const isPendingChild = child.href === "/dashboard/requests/pending";

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium transition-all duration-200",
                                childActive
                                  ? "bg-brand/10 text-brand shadow-sm"
                                  : "text-slate-600 hover:bg-brand/5 hover:text-brand",
                              )}
                              onClick={() => setMobileOpen(false)}
                            >
                              <ChildIcon
                                className={cn(
                                  "size-4 shrink-0 transition-colors duration-200",
                                  childActive ? "text-brand" : "text-slate-400 group-hover:text-brand",
                                )}
                              />
                              <span className="flex-1">{child.label}</span>
                              {isPendingChild && canManageRequests ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                  {pendingRequestsCount}
                                </span>
                              ) : null}
                              {childActive ? <ChevronRight className="size-3.5 text-brand/50" /> : null}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "bg-brand/10 text-brand shadow-sm"
                      : "text-slate-600 hover:bg-brand/5 hover:text-brand",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                      active ? "text-brand" : "text-slate-400 group-hover:text-brand",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active ? <ChevronRight className="size-3.5 text-brand/50" /> : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-emerald-600 text-xs font-bold text-white">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
                <p className="truncate text-[11px] text-ink-soft">{getRoleLabel(user.role)}</p>
              </div>
            </div>
            {user.project ? (
              <p className="mt-2 truncate text-[11px] text-ink-soft">
                {user.project} - {user.position}
              </p>
            ) : null}
          </div>
          <button type="button"
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600"
            onClick={() => void logout()}
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Cerrar sesion</span>
          </button>
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
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="section-title text-base font-bold text-ink sm:text-lg">
                {routeLabels[routeKey] ?? "Modulo"}
              </h1>
              <p className="hidden text-xs text-ink-soft sm:block">
                Panel administrativo y operativo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button"
              className="relative rounded-xl p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-ink"
              aria-label="Notificaciones"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-white" />
            </button>

            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

            <div className="relative" ref={userMenuRef}>
              <button type="button"
                className="flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-200 hover:bg-slate-50"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-label="Menu de usuario"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-ink">{user.fullName}</p>
                  <p className="text-[11px] text-ink-soft">{user.email}</p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-emerald-600 text-xs font-bold text-white">
                  {getInitials(user.fullName)}
                </div>
              </button>

              {userMenuOpen ? (
                <>
                  <button type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                    aria-label="Cerrar menu"
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-[dashboard-rise_200ms_ease-out]">
                    <div className="border-b border-slate-100 p-4">
                      <p className="text-sm font-semibold text-ink">{user.fullName}</p>
                      <p className="text-xs text-ink-soft">{user.email}</p>
                      <span className="mt-2 inline-flex items-center rounded-lg bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/perfil"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-ink"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserCog className="size-4" />
                        Mi perfil
                      </Link>
                      <button type="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="page-grid animate-[dashboard-rise_300ms_ease-out] pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
