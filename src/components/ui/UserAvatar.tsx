"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

export interface UserAvatarProps {
 src?: string | null;
 fullName?: string | null;
 name?: string | null;
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
 name,
 email,
 size = "md",
 className,
 rounded = "full",
 showStatusDot = false,
 status = null,
 alt,
}: UserAvatarProps) {
 const resolvedName = fullName || name;

 // Use src URL directly from backend
 const normalizedSrc = src;
 const [failedSrc, setFailedSrc] = useState<string | null>(null);
 const hasImageError = Boolean(normalizedSrc) && failedSrc === normalizedSrc;

 if (process.env.NODE_ENV === "development") {
   console.log(`[UserAvatar DevLog] User: ${resolvedName || email || "Unknown"}`, {
     receivedSrc: src,
     normalizedSrc,
     hasImageError,
   });
 }

 const handleImageError = () => {
   if (process.env.NODE_ENV === "development") {
     console.warn(`[UserAvatar Error] Failed to load image for ${resolvedName || email || "Unknown"}. URL attempted:`, normalizedSrc);
   }
   setFailedSrc(normalizedSrc ?? null);
 };

 const initials = getUserInitials(resolvedName, email);
 const shouldShowImage = Boolean(normalizedSrc) && !hasImageError;

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
 "flex items-center justify-center overflow-hidden border border-border/50 bg-primary/10 font-bold text-primary shadow-sm leading-none",
 sizeClass,
 roundedClass,
 )}
 >
 {shouldShowImage ? (
 /* eslint-disable-next-line @next/next/no-img-element */
 <img
 src={normalizedSrc || undefined}
 alt={alt ?? resolvedName ?? "Usuario"}
 className="h-full w-full object-cover"
 onError={handleImageError}
 />
 ) : (
 <span className="leading-none">{initials}</span>
 )}
 </div>

 {showStatusDot && status ? (
 <span
 className={cn(
 "absolute bottom-0 right-0 rounded-full border-2 border-background ring-0",
 size === "xs" || size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5",
 status === "active"
 ? "bg-emerald-500"
 : status === "inactive"
 ? "bg-muted-foreground"
 : "bg-amber-400",
 )}
 />
 ) : null}
 </div>
 );
}
