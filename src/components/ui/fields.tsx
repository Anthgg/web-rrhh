"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface FieldFrameProps {
 label: string;
 hint?: string;
 error?: string;
 children: React.ReactNode;
}

export function FieldFrame({ label, hint, error, children }: FieldFrameProps) {
 return (
 <label className="grid gap-2 text-sm text-muted-foreground">
 <span className="font-medium text-foreground">{label}</span>
 {children}
 {error ? (
 <span className="text-xs font-medium text-destructive">{error}</span>
 ) : hint ? (
 <span className="text-xs text-muted-foreground">{hint}</span>
 ) : null}
 </label>
 );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
 return (
 <input
 {...props}
 className={cn(
 "h-11 rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20",
 props.className,
 )}
 />
 );
}

export function Select({
 className,
 children,
 ref,
 ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.Ref<HTMLSelectElement> }) {
 type OptionElementProps = React.OptionHTMLAttributes<HTMLOptionElement> & {
 value?: string | number | readonly string[];
 children?: React.ReactNode;
 };
 const [isOpen, setIsOpen] = React.useState(false);
 const containerRef = React.useRef<HTMLDivElement>(null);
 const internalSelectRef = React.useRef<HTMLSelectElement | null>(null);
 
 const [currentValue, setCurrentValue] = React.useState(props.defaultValue ?? "");
 const selectedValue = props.value ?? currentValue;

 const setRefs = React.useCallback(
 (node: HTMLSelectElement | null) => {
 internalSelectRef.current = node;
 if (typeof ref === "function") {
 ref(node);
 } else if (ref) {
 (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
 }
 },
 [ref]
 );

 const options: Array<{ value: string; label: React.ReactNode; disabled?: boolean }> = [];
 React.Children.forEach(children, (child) => {
 if (React.isValidElement(child) && child.type === "option") {
 const optionProps = child.props as OptionElementProps;
 options.push({
 value: String(optionProps.value ?? ""),
 label: optionProps.children,
 disabled: optionProps.disabled,
 });
 }
 });

 const selectedOption = options.find((opt) => String(opt.value) === String(selectedValue)) || options[0];

 React.useEffect(() => {
 const handleOutsideClick = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setIsOpen(false);
 }
 };
 if (isOpen) {
 document.addEventListener("mousedown", handleOutsideClick);
 }
 return () => document.removeEventListener("mousedown", handleOutsideClick);
 }, [isOpen]);

 React.useEffect(() => {
 if (props.value !== undefined) return;
 
 const selectElement = internalSelectRef.current;
 if (!selectElement) return;

 let frameId: number;
 const checkValue = () => {
 if (selectElement.value !== currentValue) {
 setCurrentValue(selectElement.value);
 }
 frameId = requestAnimationFrame(checkValue);
 };
 
 frameId = requestAnimationFrame(checkValue);
 return () => cancelAnimationFrame(frameId);
 }, [currentValue, props.value]);

 const handleSelect = (val: string) => {
 if (props.value === undefined) {
 setCurrentValue(val);
 }
 if (internalSelectRef.current) {
 internalSelectRef.current.value = val;
 }
 if (props.onChange) {
 const fakeEvent = {
 target: { name: props.name, value: val },
 currentTarget: { name: props.name, value: val },
 } as React.ChangeEvent<HTMLSelectElement>;
 props.onChange(fakeEvent);
 }
 setIsOpen(false);
 };

 return (
 <div ref={containerRef} className={cn("relative", className)}>
 <select ref={setRefs} className="hidden" {...props} value={selectedValue} onChange={() => {}}>
 {children}
 </select>

 <button
 type="button"
 disabled={props.disabled}
 onClick={() => setIsOpen(!isOpen)}
 className={cn(
 "flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
 isOpen && "border-primary ring-2 ring-primary/20"
 )}
 >
 <span className="truncate">{selectedOption ? selectedOption.label : "Seleccione..."}</span>
 <ChevronDown
 className={cn("size-4 shrink-0 opacity-50 transition-transform", isOpen && "rotate-180")}
 />
 </button>

 {isOpen && (
 <div
 className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
 >
 <ul className="max-h-[200px] overflow-y-auto p-1" style={{ scrollbarWidth: "thin" }}>
 {options.map((opt) => (
 <li key={String(opt.value)}>
 <button
 type="button"
 disabled={opt.disabled}
 onClick={() => handleSelect(String(opt.value))}
 className={cn(
 "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
 opt.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted text-foreground",
 String(opt.value) === String(selectedValue) && "bg-primary/10 font-medium text-primary hover:bg-primary/20"
 )}
 >
 <span className="truncate">{opt.label}</span>
 </button>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
 return (
 <textarea
 {...props}
 className={cn(
 "min-h-28 rounded-3xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20",
 props.className,
 )}
 />
 );
}
