export default function ShellLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:py-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-base-300/60" />
        <div className="h-4 w-96 max-w-full rounded bg-base-300/40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 rounded border border-border bg-base-200/30" />
        <div className="h-48 rounded border border-border bg-base-200/30" />
      </div>
      <div className="h-32 rounded border border-border bg-base-200/30" />
    </div>
  );
}
