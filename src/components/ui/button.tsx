"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
 primary:
 "bg-primary text-primary-foreground shadow-[0_16px_32px_rgba(15,118,110,0.22)] hover:bg-primary/90",
 secondary:
 "bg-card text-foreground border border-border hover:border-primary hover:text-primary",
 ghost: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
 danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: ButtonVariant;
 ref?: React.Ref<HTMLButtonElement>;
}

// React 19: ref is a regular prop — forwardRef is no longer needed
export function Button({
 className,
 variant = "primary",
 type = "button",
 ref,
 ...props
}: ButtonProps) {
 return (
 <button
 ref={ref}
 type={type}
 className={cn(
 "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
 variantStyles[variant],
 className,
 )}
 {...props}
 />
 );
}

Button.displayName = "Button";
