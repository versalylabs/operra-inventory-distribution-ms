export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-7 w-72 rounded bg-slate-200" />
          <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-32 rounded-lg bg-slate-200" />
          <div className="h-9 w-36 rounded-lg bg-indigo-100" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
          >
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-7 w-36 rounded bg-slate-200" />
            <div className="h-3 w-44 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-64 rounded-lg bg-slate-100" />
          <div className="h-8 w-48 rounded-lg bg-slate-100" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-11 w-full rounded-lg bg-slate-100/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
