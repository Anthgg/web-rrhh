"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { NavigationLink } from "@/components/layout/NavigationLink";
import {
  DOCK_NAV,
  isNavItemActive,
  type NavItem,
} from "@/components/layout/navigation-config";
import { useNavigationLayout } from "@/components/layout/use-navigation-layout";
import { useSession } from "@/features/auth/auth-provider";
import { canAccessRoute } from "@/lib/auth/access";
import { cn } from "@/lib/utils/cn";

// Theme-adaptive gradient for the active item (follows the --primary token).
const ACTIVE_GRADIENT =
  "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 62%, #000))";

function NavTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 translate-y-1 whitespace-nowrap",
        "rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md",
        "opacity-0 transition-all duration-200 ease-out",
        "group-hover:-translate-y-0 group-hover:opacity-100 group-focus-visible:-translate-y-0 group-focus-visible:opacity-100",
      )}
    >
      {label}
      {/* Arrow pointing down to the icon */}
      <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rotate-45 size-2 bg-slate-900/90" />
    </span>
  );
}

function BottomNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <div className="group relative shrink-0">
      <NavigationLink
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative grid size-11 place-items-center rounded-2xl transition-transform duration-200 outline-none",
          "hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-primary/60",
          active
            ? "text-[var(--primary-foreground)] shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-2xl transition-opacity duration-200",
            active ? "opacity-100" : "opacity-0",
          )}
          style={{ background: ACTIVE_GRADIENT }}
        />
        <Icon className="relative size-5" />
      </NavigationLink>
      <NavTooltip label={item.label} />
    </div>
  );
}

export function FloatingBottomNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const { bottomNavVisible } = useNavigationLayout();

  const items = useMemo(() => {
    if (!user) return [];
    return DOCK_NAV.filter((item) => canAccessRoute(user.role, item.href));
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <nav
      aria-label="Navegacion principal"
      aria-hidden={!bottomNavVisible}
      className={cn(
        "fixed bottom-5 left-1/2 z-40 -translate-x-1/2 transition-all duration-300 ease-out",
        bottomNavVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-[160%] opacity-0",
      )}
    >
      <div
        className={cn(
          "flex max-w-[calc(100vw-2.5rem)] items-center gap-1.5 overflow-x-auto rounded-[26px] border border-border/60 bg-card/70 p-2 px-2.5",
          "shadow-[0_18px_50px_rgba(15,23,42,0.22)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/60",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {items.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            active={isNavItemActive(pathname, item, items)}
          />
        ))}
      </div>
    </nav>
  );
}
