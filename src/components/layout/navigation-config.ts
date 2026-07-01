import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Home,
  Inbox,
  Library,
  Network,
  Settings2,
  ShieldCheck,
  UserCog,
  UserRoundCog,
  Users2,
  UsersRound,
  XCircle,
} from "lucide-react";

export type NavIcon = React.ComponentType<{ className?: string }>;

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  children?: NavItem[];
};

/**
 * Single source of truth for the primary navigation. Consumed by the
 * MiniSidebar (full tree, with children/flyouts) and the FloatingBottomNav
 * (top-level dock entries).
 */
export const MAIN_NAV: NavItem[] = [
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
      { href: "/dashboard/schedule/analytics", label: "Analitica de asistencia", icon: BarChart3 },
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

/**
 * Destinations rendered in the floating bottom dock. Every top-level section
 * is exposed as an icon (with tooltip); sub-sections live in the contextual
 * top navigation. `children` are kept so the active section can be detected
 * even when the current route is a sub-route.
 */
export const DOCK_NAV: NavItem[] = MAIN_NAV;

export type SectionTab = {
  href: string;
  label: string;
  icon: NavIcon;
  /** When true, the tab matches only on exact pathname (no prefix match). */
  exact?: boolean;
};

/**
 * Contextual top navigation per module. Keyed by the route-key prefix returned
 * by `getRouteKey` (see `@/lib/auth/access`). A section with no entry simply
 * renders no contextual bar.
 */
export const SECTION_TABS: Record<string, SectionTab[]> = {
  "/dashboard/requests": [
    { href: "/dashboard/requests/my", label: "Todas las solicitudes", icon: ClipboardList },
    { href: "/dashboard/requests/new", label: "Nueva solicitud", icon: FilePlus2 },
    { href: "/dashboard/requests/pending", label: "Pendientes", icon: Clock3 },
    { href: "/dashboard/requests/reports", label: "Reportes", icon: FileSpreadsheet },
    { href: "/dashboard/requests/templates", label: "Plantillas", icon: Library },
    { href: "/dashboard/vacations", label: "Vacaciones", icon: CalendarDays },
  ],
  "/reports": [
    { href: "/reports", label: "PDF corporativos", icon: FileText, exact: true },
    { href: "/reports/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/reports/generator", label: "Generador", icon: FileSpreadsheet },
    { href: "/reports/templates", label: "Plantillas", icon: Library },
  ],
  "/dashboard/schedule": [
    { href: "/dashboard/schedule/policies", label: "Politicas", icon: Settings2 },
    { href: "/dashboard/schedule/shifts", label: "Turnos", icon: Clock3 },
    { href: "/dashboard/schedule/assignments", label: "Asignaciones", icon: UserCog },
    { href: "/dashboard/schedule/worker-schedule", label: "Horario de personal", icon: Users2 },
    { href: "/dashboard/schedule/attendance-summary", label: "Resumen", icon: FileSpreadsheet },
    { href: "/dashboard/schedule/analytics", label: "Analitica", icon: BarChart3 },
    { href: "/dashboard/schedule/holidays", label: "Feriados", icon: ClipboardList },
  ],
  "/dashboard/settings/company": [
    { href: "/dashboard/settings/company", label: "Datos de empresa", icon: Building2 },
    { href: "/estructura", label: "Estructura", icon: Network },
    { href: "/dashboard/settings/organization", label: "Estructura (Legacy)", icon: Users2 },
  ],
  "/trabajadores": [
    { href: "/trabajadores", label: "Lista de Personal", icon: Users2, exact: true },
    { href: "/trabajadores/alta", label: "Alta de Colaborador", icon: FilePlus2 },
  ],
};

// Re-export icons that callers may reuse for status-style tabs without importing lucide directly.
export const StatusIcons = { Inbox, CheckCircle2, XCircle };

/**
 * Whether a nav item (top-level or child) should be highlighted for the given
 * pathname. Mirrors the previous in-shell logic: groups defer to their
 * children, `/dashboard` matches exactly, and the longest sibling prefix wins.
 */
export function isNavItemActive(
  pathname: string,
  item: { href: string; children?: { href: string; children?: unknown[] }[] },
  siblings?: { href: string }[],
): boolean {
  if (item.children?.length) {
    return item.children.some((child) =>
      isNavItemActive(pathname, child as NavItem, item.children as NavItem[]),
    );
  }

  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  const isPrefixMatch = pathname === item.href || pathname.startsWith(item.href + "/");
  if (!isPrefixMatch) return false;

  if (siblings) {
    const betterMatchExists = siblings.some((sibling) => {
      if (sibling.href === item.href) return false;
      const siblingMatches =
        pathname === sibling.href || pathname.startsWith(sibling.href + "/");
      return siblingMatches && sibling.href.length > item.href.length;
    });
    if (betterMatchExists) return false;
  }

  return true;
}

/** Active check for contextual tabs (supports `exact`). */
export function isTabActive(pathname: string, tab: SectionTab, tabs: SectionTab[]): boolean {
  if (tab.exact) return pathname === tab.href;

  const isPrefixMatch = pathname === tab.href || pathname.startsWith(tab.href + "/");
  if (!isPrefixMatch) return false;

  const betterMatchExists = tabs.some((other) => {
    if (other.href === tab.href) return false;
    const otherMatches =
      pathname === other.href || pathname.startsWith(other.href + "/");
    return otherMatches && other.href.length > tab.href.length;
  });

  return !betterMatchExists;
}
