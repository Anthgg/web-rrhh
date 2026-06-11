import { cn } from "@/lib/utils/cn";

export interface Column<T> {
 key: string;
 header: string;
 className?: string;
 render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
 columns: Column<T>[];
 rows: T[];
 rowKey: (item: T) => string;
 compact?: boolean;
}

export function DataTable<T>({
 columns,
 rows,
 rowKey,
 compact = false,
}: DataTableProps<T>) {
 return (
 <div className="overflow-hidden rounded-3xl border border-border">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead className="bg-card-muted text-left">
 <tr>
 {columns.map((column) => (
 <th
 key={column.key}
 className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-soft"
 >
 {column.header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-card">
 {rows.map((row) => (
 <tr key={rowKey(row)} className="align-top">
 {columns.map((column) => (
 <td
 key={column.key}
 className={cn(
 compact ? "px-4 py-3" : "p-4",
 "text-sm text-foreground",
 column.className,
 )}
 >
 {column.render(row)}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
