"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

export interface UserAvatarProps {
 src?: string | null;
 fullName?: string | null;
 email?: string | null;
 size?: UserAvatarSize;
 className?: string;
 rounded?: "full" | "xl" | "2xl";
 showStatusDot?: boolean;
 status?: "active" | "inactive" | "pending" | string | null;
 alt?: string;
}

export function getUserInitials(fullName?: string | null, email?: string | null): string {
 const name = fullName?.trim();

 if (name) {
 const parts = name.split(/\s+/).filter(Boolean);

 if (parts.length >= 2) {
 return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
 }

 return parts[0].slice(0, 2).toUpperCase();
 }

 if (email) {
 return email.slice(0, 2).toUpperCase();
 }

 return "U";
}

export function UserAvatar({
 src,
 fullName,
 email,
 size = "md",
 className,
 rounded = "full",
 showStatusDot = false,
 status = null,
 alt,
}: UserAvatarProps) {
 const [hasImageError, setHasImageError] = useState(false);
 const [prevSrc, setPrevSrc] = useState(src);
 if (src !== prevSrc) {
 setPrevSrc(src);
 setHasImageError(false);
 }

 const initials = getUserInitials(fullName, email);
 const shouldShowImage = Boolean(src) && !hasImageError;

 const sizeClass = {
 xs: "h-6 w-6 text-[10px]",
 sm: "h-8 w-8 text-xs",
 md: "h-10 w-10 text-sm",
 lg: "h-12 w-12 text-base",
 xl: "h-16 w-16 text-lg",
 hero: "h-20 w-20 lg:h-24 lg:w-24 text-2xl",
 }[size];

 const roundedClass = {
 full: "rounded-full",
 xl: "rounded-xl",
 "2xl": "rounded-2xl",
 }[rounded];

 return (
 <div className={cn("relative inline-flex shrink-0 select-none", className)}>
 <div
 className={cn(
 "flex items-center justify-center overflow-hidden border border-white/40 bg-indigo-50 font-bold text-indigo-700 shadow-sm leading-none",
 sizeClass,
 roundedClass,
 )}
 >
 {shouldShowImage ? (
 /* eslint-disable-next-line @next/next/no-img-element */
 <img
 src={src || undefined}
 alt={alt ?? fullName ?? "Usuario"}
 className="h-full w-full object-cover"
 onError={() => setHasImageError(true)}
 />
 ) : (
 <span className="leading-none">{initials}</span>
 )}
 </div>

 {showStatusDot && status ? (
 <span
 className={cn(
 "absolute bottom-0 right-0 rounded-full border-2 border-white ring-0",
 size === "xs" || size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5",
 status === "active"
 ? "bg-emerald-500"
 : status === "inactive"
 ? "bg-slate-400"
 : "bg-amber-400",
 )}
 />
 ) : null}
 </div>
 );
}
