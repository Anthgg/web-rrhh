interface PageHeaderProps {
 eyebrow: string;
 title: string;
 description: string;
 action?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
 return (
 <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
 <div className="grid gap-2">
 <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
 {eyebrow}
 </span>
 <div className="grid gap-2">
 <h1 className="section-title text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
 <p className="max-w-3xl text-sm leading-6 text-foreground-soft">{description}</p>
 </div>
 </div>
 {action ? <div className="shrink-0">{action}</div> : null}
 </div>
 );
}
