import { cn } from "@/lib/utils/cn";

interface CardSkeletonProps {
 count?: number;
 className?: string;
}

export function CardSkeleton({ count = 3, className }: CardSkeletonProps) {
 return (
 <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)} aria-hidden="true">
 {Array.from({ length: count }).map((_, index) => (
 <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
 <div className="mb-5 size-10 animate-pulse rounded-xl bg-muted" />
 <div className="grid gap-3">
 <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
 <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
 <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
 </div>
 </div>
 ))}
 </div>
 );
}
