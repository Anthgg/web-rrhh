import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-soft">
        Pagina <span className="font-semibold text-ink">{page}</span> de{" "}
        <span className="font-semibold text-ink">{totalPages}</span> - {total} registros
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {pageSizeOptions?.length && onPageSizeChange ? (
          <label className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm text-ink-soft">
            <span>Ver</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="bg-transparent text-sm font-semibold text-ink outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <Button
          variant="secondary"
          className="h-10 px-3"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="secondary"
          className="h-10 px-3"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
