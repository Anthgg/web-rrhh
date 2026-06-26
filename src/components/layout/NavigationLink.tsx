"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useCallback } from "react";

import { showLoading, hideLoading } from "@/store/loading-store";
import { cn } from "@/lib/utils/cn";

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  isActive?: boolean;
  onClick?: () => void;
  title?: string;
}

export function NavigationLink({
  href,
  children,
  className,
  activeClassName,
  isActive,
  onClick,
  title,
}: NavigationLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const currentPath = window.location.pathname;
      if (currentPath === href || currentPath === href + "/") {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      onClick?.();
      showLoading({ message: "Cargando..." });

      router.push(href);

      setTimeout(() => {
        hideLoading();
      }, 2000);
    },
    [href, onClick, router],
  );

  return (
    <Link
      href={href}
      title={title}
      className={cn(className, isActive && activeClassName)}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
