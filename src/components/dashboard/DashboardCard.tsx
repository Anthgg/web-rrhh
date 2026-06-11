import { cn } from "@/lib/utils/cn";

interface DashboardCardProps {
 children: React.ReactNode;
 className?: string;
 style?: React.CSSProperties;
}

export function DashboardCard({ children, className, style }: DashboardCardProps) {
 return (
 <section
 style={style}
 className={cn(
 "animate-[dashboard-rise_420ms_ease-out_both] rounded-[1.75rem] border border-border bg-card text-card-foreground p-5 shadow-[0_20px_54px_rgba(20,33,43,0.08)]",
 className,
 )}
 >
 {children}
 </section>
 );
}
