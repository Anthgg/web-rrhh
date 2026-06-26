import { cn } from "@/lib/utils/cn";

interface TableSkeletonProps {
 rows?: number;
 columns?: number;
 className?: string;
}

export function TableSkeleton({ rows = 6, columns = 5, className }: TableSkeletonProps) {
 return (
 <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
 <div
 className="grid border-b border-border bg-muted p-4"
 style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
 aria-hidden="true"
 >
 {Array.from({ length: columns }).map((_, index) => (
 <div key={index} className="mr-4 h-3 rounded-full bg-card" />
 ))}
 </div>
 <div className="divide-y divide-border">
 {Array.from({ length: rows }).map((_, rowIndex) => (
 <div
 key={rowIndex}
 className="grid p-4"
 style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
 >
 {Array.from({ length: columns }).map((_, columnIndex) => (
 <div
 key={columnIndex}
 className="mr-4 h-4 animate-pulse rounded-full bg-muted"
 />
 ))}
 </div>
 ))}
 </div>
 </div>
 );
}
