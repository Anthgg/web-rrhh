"use client";

import type { ReactNode } from "react";

import { AppLottie } from "@/components/ui/feedback/AppLottie";
import { FeedbackLayout } from "@/components/ui/feedback/FeedbackLayout";
import { feedbackAnimations } from "@/components/ui/feedback/animation-registry";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
 title: string;
 description: string;
 actionLabel?: string;
 onAction?: () => void;
 icon?: ReactNode;
 className?: string;
}

export function EmptyState({
 title,
 description,
 actionLabel,
 onAction,
 icon,
 className,
}: EmptyStateProps) {
 return (
 <FeedbackLayout
 className={className}
 animationClassName="h-[220px] w-[220px] md:h-[300px] md:w-[300px]"
 title={title}
 description={description}
 animation={
 icon ?? (
 <AppLottie
 src={feedbackAnimations.empty}
 className="size-full"
 ariaLabel="Sin informacion disponible"
 />
 )
 }
 actions={
 actionLabel && onAction ? (
 <Button onClick={onAction}>{actionLabel}</Button>
 ) : undefined
 }
 />
 );
}
