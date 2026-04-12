function LoadingCard({
  className,
}: {
  className?: string;
}) {
  return <div className={`animate-pulse rounded-none border border-border bg-base-200/35 ${className ?? ""}`} />;
}

export default function ShellLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 md:py-10">
      <div className="space-y-3">
        <LoadingCard className="h-12 w-72" />
        <LoadingCard className="h-5 w-[32rem] max-w-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <LoadingCard className="h-64" />
        <div className="grid gap-4">
          <LoadingCard className="h-40" />
          <LoadingCard className="h-32" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_220px]">
        <LoadingCard className="h-56" />
        <LoadingCard className="h-56" />
      </div>
    </div>
  );
}
