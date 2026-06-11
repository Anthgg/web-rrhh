import { cn } from "@/lib/utils/cn";

interface CardProps {
 children: React.ReactNode;
 className?: string;
}

export function Card({ children, className }: CardProps) {
 return <div className={cn("shell-card rounded-4xl p-6", className)}>{children}</div>;
}
