import { Card } from "@/components/ui/card";

export function CompanySettingsSkeleton() {
  return (
    <div className="grid gap-5">
      <section className="-mx-4 border-b border-slate-200 bg-slate-50 p-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-44 animate-pulse rounded-full bg-slate-200" />
              <div className="h-7 w-64 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="grid gap-2">
              <div className="h-9 w-80 max-w-full animate-pulse rounded-lg bg-slate-200" />
              <div className="h-5 w-[38rem] max-w-full animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200 sm:w-44" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-slate-300 sm:w-44" />
          </div>
        </div>
      </section>

      <Card className="rounded-lg border-slate-200 bg-white p-2 shadow-sm">
        <div className="hidden gap-1 md:flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 flex-1 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
        <div className="h-11 animate-pulse rounded-lg bg-slate-100 md:hidden" />
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <Card className="grid content-start gap-6 rounded-lg border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-2">
              <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
              <div className="h-7 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />
              <div className="h-5 w-[34rem] max-w-full animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100 sm:w-44" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
            ))}
          </div>
        </Card>

        <Card className="hidden rounded-lg border-slate-200 bg-white p-4 shadow-sm xl:grid">
          <div className="grid gap-4">
            <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-[560px] animate-pulse rounded-lg bg-slate-100" />
          </div>
        </Card>
      </div>
    </div>
  );
}
