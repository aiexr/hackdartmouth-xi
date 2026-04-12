function SettingsSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-28 animate-pulse rounded-none bg-base-300/45" />
      <div className="rounded-none border border-border bg-base-100/80 p-8">
        <div className="flex items-start gap-4">
          <div className="size-11 animate-pulse rounded-none bg-base-300/45" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-5 w-32 animate-pulse rounded-none bg-base-300/50" />
            <div className="h-4 w-full animate-pulse rounded-none bg-base-300/35" />
            <div className="h-4 w-3/4 animate-pulse rounded-none bg-base-300/35" />
          </div>
          <div className="mt-1 h-8 w-24 animate-pulse rounded-none bg-base-300/45" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8 md:px-10 md:py-10">
      <div className="space-y-3">
        <div className="h-10 w-40 animate-pulse rounded-none bg-base-300/55" />
        <div className="h-5 w-72 max-w-full animate-pulse rounded-none bg-base-300/35" />
      </div>

      <SettingsSectionSkeleton />
      <SettingsSectionSkeleton />

      <div className="flex items-center gap-3 pt-2">
        <div className="h-9 w-20 animate-pulse rounded-none bg-base-300/45" />
        <div className="h-9 w-20 animate-pulse rounded-none bg-base-300/45" />
      </div>
    </div>
  );
}
