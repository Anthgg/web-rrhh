"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, LogOut, Settings2, UserCog } from "lucide-react";
import { useRef, useState } from "react";

import { FloatingBottomNav } from "@/components/layout/FloatingBottomNav";
import { NavbarToggleButton } from "@/components/layout/NavbarToggleButton";
import { SectionTopNav } from "@/components/layout/SectionTopNav";
import { useNavigationLayout } from "@/components/layout/use-navigation-layout";
import { PermissionState } from "@/components/shared/states";
import { useSession } from "@/features/auth/auth-provider";
import { apiClient } from "@/lib/api/client";
import { webApiEndpoints } from "@/lib/api/endpoints";
import { canAccessRoute, getRoleLabel, getRouteKey, routeLabels } from "@/lib/auth/access";
import { cn } from "@/lib/utils/cn";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { isAdminRequestManager } from "@/lib/utils/requests";
import type { PaginatedRequestsResponse } from "@/types/requests";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeKey = getRouteKey(pathname);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, status, logout } = useSession();
  const { bottomNavVisible } = useNavigationLayout();
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
        suppressUnauthorizedEvent: true,
      }),
    enabled: Boolean(user && canManageRequests),
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const pendingRequestsCount = pendingRequestsData?.total ?? 0;

  if (status === "loading" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <p className="text-sm text-muted-foreground">Validando sesion y permisos…</p>
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
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-header text-header-foreground px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-primary/10 p-1">
              <Image src="/logo.png" alt="FABRYOR" fill sizes="36px" className="object-contain" priority />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-bold tracking-tight text-foreground">FABRYOR</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Admin Panel
              </span>
            </div>
          </Link>

          <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

          <div className="min-w-0">
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
          <button
            type="button"
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
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-200 hover:bg-muted"
              onClick={() => setUserMenuOpen((value) => !value)}
              aria-label="Menu de usuario"
            >
              <div className="hidden max-w-[160px] text-right sm:block">
                <p className="truncate text-sm font-semibold text-foreground">{user.fullName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
              <UserAvatar src={user.avatarUrl} fullName={user.fullName} email={user.email} size="sm" rounded="xl" />
            </button>

            {userMenuOpen ? (
              <>
                <button
                  type="button"
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
                    <button
                      type="button"
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

      <SectionTopNav />

      <main className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8">
        <div
          className={cn(
            "page-grid animate-[dashboard-rise_300ms_ease-out]",
            bottomNavVisible ? "pb-28" : "pb-6",
          )}
        >
          {children}
        </div>
      </main>

      <FloatingBottomNav />
      <NavbarToggleButton />
    </div>
  );
}
