import { Check, Clock, Sun, Moon, CalendarDays, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/types/schedule";

interface ShiftCardProps {
  shift: Shift;
  isSelected: boolean;
  onClick: () => void;
}

function getShiftIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("noche") || n.includes("madrugada")) return <Moon className="size-5" />;
  if (n.includes("tarde")) return <Sun className="size-5 text-amber-500" />;
  return <Sun className="size-5 text-amber-500" />;
}

export function ShiftCard({ shift, isSelected, onClick }: ShiftCardProps) {
  const startTime = shift.start_time?.slice(0, 5) || "00:00";
  const endTime = shift.end_time?.slice(0, 5) || "00:00";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full text-left p-4 rounded-2xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 flex flex-col gap-3 group",
        isSelected
          ? "bg-primary/5 border-primary/40 shadow-md ring-1 ring-primary/20"
          : "bg-card border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md hover:bg-accent/20"
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50">
          <Check className="size-3.5 stroke-[3]" />
        </div>
      )}

      <div className="flex items-center gap-3 pr-8">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
        )}>
          {getShiftIcon(shift.name)}
        </div>
        <div className="min-w-0">
          <h4 className={cn("font-bold text-base truncate transition-colors", isSelected ? "text-primary" : "text-foreground")}>
            {shift.name}
          </h4>
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mt-0.5">
            <Clock className="size-3.5" />
            <span>{startTime} - {endTime}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
          <Timer className="size-3.5 shrink-0" />
          <span className="truncate">{shift.tolerance_minutes ?? shift.toleranceMinutes} min tol.</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
          <CalendarDays className="size-3.5 shrink-0" />
          <span className="truncate">{Math.round((shift.weekly_target_minutes ?? shift.weeklyTargetMinutes ?? 0) / 60)}h semanales</span>
        </div>
      </div>
    </button>
  );
}
