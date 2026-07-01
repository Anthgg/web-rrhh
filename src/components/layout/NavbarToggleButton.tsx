"use client";

import { ChevronDown, LayoutDashboard } from "lucide-react";

import { useNavigationLayout } from "@/components/layout/use-navigation-layout";
import { cn } from "@/lib/utils/cn";

/**
 * Small floating button to hide/show the bottom dock. Sits at the
 * bottom-right, clear of the centered dock.
 */
export function NavbarToggleButton() {
  const { bottomNavVisible, toggleBottomNav } = useNavigationLayout();

  const label = bottomNavVisible ? "Ocultar navegacion" : "Mostrar navegacion";
  const Icon = bottomNavVisible ? ChevronDown : LayoutDashboard;

  return (
    <button
      type="button"
      onClick={toggleBottomNav}
      aria-label={label}
      aria-pressed={!bottomNavVisible}
      title={label}
      className={cn(
        "fixed bottom-5 right-5 z-50 grid size-11 place-items-center rounded-full",
        "border border-border/60 bg-card/70 text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl",
        "transition-all duration-200 hover:scale-110 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
