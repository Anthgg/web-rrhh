import { cn } from "@/lib/utils/cn";
import { AttendanceSummary } from "@/types/schedule";

interface PaymentTypeBadgeProps {
  paymentType?: AttendanceSummary["paymentType"] | AttendanceSummary["payment_type"];
  className?: string;
}

export function PaymentTypeBadge({ paymentType, className }: PaymentTypeBadgeProps) {
  if (!paymentType || paymentType === "regular") return null;

  let styles = "";
  let label = "";

  switch (paymentType) {
    case "rest_day":
      styles = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
      label = "Descanso";
      break;
    case "paid_holiday":
      styles = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50";
      label = "Feriado Pagado";
      break;
    case "holiday_worked":
      styles = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50";
      label = "Feriado Trabajado";
      break;
    default:
      return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mt-1",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
