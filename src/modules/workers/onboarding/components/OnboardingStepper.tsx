"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface OnboardingStep {
 id: number;
 label: string;
 fieldPrefix: string;
}

interface OnboardingStepperProps {
 step: number;
 setStep: (step: number) => void;
 visibleSteps: OnboardingStep[];
 missingFields: string[];
 completionMode: boolean;
}

export function OnboardingStepper({
 step,
 setStep,
 visibleSteps,
 missingFields,
 completionMode,
}: OnboardingStepperProps) {
 return (
 <nav className="overflow-x-auto rounded-2xl border border-border bg-card p-3 shadow-sm" aria-label="Pasos de alta">
 <ol className="flex min-w-max gap-2">
 {visibleSteps.map((item) => {
 const isActive = item.id === step;
 const isDone = item.id < step;
 const hasMissingFields = completionMode && item.fieldPrefix
 ? missingFields.some((field) => field.startsWith(item.fieldPrefix))
 : false;

 return (
 <li key={item.id}>
 <button
 type="button"
 onClick={() => setStep(item.id)}
 className={cn(
 "flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
 isActive
 ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
 : "border-border bg-card text-muted-foreground hover:border-indigo-200 hover:text-indigo-700",
 )}
 >
 {hasMissingFields ? (
 <AlertTriangle className="size-4 text-amber-500" />
 ) : isDone ? (
 <CheckCircle2 className="size-4" />
 ) : (
 <span className="grid size-5 place-items-center rounded-full border border-current text-xs">{item.id}</span>
 )}
 {item.label}
 </button>
 </li>
 );
 })}
 </ol>
 </nav>
 );
}
