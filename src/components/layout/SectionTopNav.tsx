"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { NavigationLink } from "@/components/layout/NavigationLink";
import { isTabActive, SECTION_TABS } from "@/components/layout/navigation-config";
import { useSession } from "@/features/auth/auth-provider";
import { canAccessRoute, getRouteKey } from "@/lib/auth/access";
import { cn } from "@/lib/utils/cn";

/**
 * Contextual horizontal navigation rendered under the header. Shows the tabs
 * for the current module (if any) and highlights the active one with a soft
 * background + bottom indicator. Scrolls horizontally on small screens.
 */
export function SectionTopNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const routeKey = getRouteKey(pathname);

  const tabs = useMemo(() => {
    const sectionTabs = SECTION_TABS[routeKey];
    if (!sectionTabs || !user) return [];
    return sectionTabs.filter((tab) => canAccessRoute(user.role, tab.href));
  }, [routeKey, user]);

  if (tabs.length === 0) return null;

  return (
    <div className="border-b border-border/60 bg-header/70 backdrop-blur-sm">
      <nav
        aria-label="Navegacion de seccion"
        className="page-grid !block overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(pathname, tab, tabs);

            return (
              <NavigationLink
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
                {/* Bottom indicator (does not rely on color alone) */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -bottom-2 left-3 right-3 h-0.5 rounded-full bg-primary transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              </NavigationLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
