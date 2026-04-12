import dynamic from "next/dynamic";

const CoachConversation = dynamic(
  () =>
    import("@/components/app/coach-conversation").then(
      (module) => module.CoachConversation,
    ),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-none border border-border bg-base-200/35" />
        <div className="h-[32rem] animate-pulse rounded-none border border-border bg-base-200/35" />
      </div>
    ),
  },
);

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-10">
      <CoachConversation />
    </div>
  );
}
