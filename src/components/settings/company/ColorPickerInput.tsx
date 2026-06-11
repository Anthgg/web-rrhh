"use client";

import { AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/fields";
import { cn } from "@/lib/utils/cn";

interface ColorPickerInputProps {
 error?: string;
 hint: string;
 label: string;
 onChange: (value: string) => void;
 value: string;
}

function resolveColor(value: string) {
 return /^#([0-9A-F]{6})$/i.test(value.trim()) ? value.trim().toUpperCase() : "#0F172A";
}

export function ColorPickerInput({ error, hint, label, onChange, value }: ColorPickerInputProps) {
 const resolvedColor = resolveColor(value);

 return (
 <label className="grid gap-2 text-sm text-foreground-soft">
 <span className="font-medium text-foreground">{label}</span>
 <div
 className={cn(
 "grid grid-cols-[48px_minmax(0,1fr)] overflow-hidden rounded-lg border bg-card transition focus-within:ring-2 focus-within:ring-primary/15",
 error ? "border-rose-300" : "border-border focus-within:border-primary",
 )}
 >
 <input
 type="color"
 value={resolvedColor}
 onChange={(event) => onChange(event.target.value.toUpperCase())}
 className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1"
 aria-label={label}
 />
 <Input
 value={value}
 onChange={(event) => onChange(event.target.value.toUpperCase())}
 placeholder="#1E3A8A"
 className="h-11 rounded-none border-0 border-l border-border font-mono focus:ring-0"
 />
 </div>
 {error ? (
 <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
 <AlertCircle className="size-3.5" />
 {error}
 </span>
 ) : (
 <span className="text-xs text-foreground-soft">{hint}</span>
 )}
 </label>
 );
}
