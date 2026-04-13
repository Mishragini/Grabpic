export function ProfileLoader({ length }: { length: number }) {
  return (
    <div className="flex min-h-9 min-w-0 flex-1 items-center overflow-hidden shrink-0 -space-x-2">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="size-9 shrink-0 animate-pulse rounded-full border-2 border-(--foam) bg-muted"
        />
      ))}
    </div>
  );
}
