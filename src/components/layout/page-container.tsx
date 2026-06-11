/**
 * PageContainer — layout variant system for admin pages.
 *
 * The app-shell wraps all protected pages in:
 * <main className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8">
 * <div className="page-grid ..."> ← owns px-4/sm:px-6/lg:px-8
 * {children} ← your page workspace here
 * </div>
 * </main>
 *
 * By default, every workspace already gets correct horizontal padding
 * from `.page-grid`. Use PageContainer when a page needs to deviate:
 *
 * Variants
 * ─────────
 * "standard" → default. No extra wrapper needed; the page-grid already
 * provides correct padding. Use this for typical list/form pages.
 *
 * "wide" → Removes max-width cap. Identical horizontal padding as standard
 * but lets the content grow to fill very large screens.
 * Use for pages with large tables, reports, or complex grids.
 *
 * "fluid" → Full-bleed: cancels page-grid's horizontal padding using
 * negative margins, then re-applies clean px-6/px-8 per section.
 * Use for dashboard-style pages like /perfil that need their
 * hero banner or tabs to reach edge-to-edge.
 *
 * "bare" → No padding, no margins. The child owns everything.
 * Use only when embedding maps, canvas, or iframes.
 */

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type PageContainerVariant = "standard" | "wide" | "fluid" | "bare";

interface PageContainerProps {
 variant?: PageContainerVariant;
 className?: string;
 children: ReactNode;
}

/**
 * Negative-margin values that cancel the px-4/sm:px-6/lg:px-8 applied by
 * `.page-grid` in globals.css. Keep in sync if page-grid breakpoints change.
 */
const FLUID_ESCAPE =
 "-mx-4 sm:-mx-6 lg:-mx-8" as const;

export function PageContainer({
 variant = "standard",
 className,
 children,
}: PageContainerProps) {
 if (variant === "standard") {
 // page-grid already handles padding — no extra wrapper needed.
 // Return children directly so the DOM stays flat.
 return <>{children}</>;
 }

 if (variant === "wide") {
 // Same padding as standard but unconstrained width.
 return (
 <div className={cn("w-full max-w-none", className)}>{children}</div>
 );
 }

 if (variant === "fluid") {
 /*
 * Escapes page-grid's horizontal padding so the child can render
 * full-bleed sections. The child is responsible for adding its own
 * px-6 lg:px-8 where needed. Vertical top margin is NOT cancelled
 * because pages should still respect the shell's top spacing.
 */
 return (
 <div className={cn(FLUID_ESCAPE, "flex flex-col min-h-full", className)}>
 {children}
 </div>
 );
 }

 // bare
 return <div className={cn("w-full", className)}>{children}</div>;
}
