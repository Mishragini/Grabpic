import { Loader2Icon } from "lucide-react";

export function InfiniteScrollLoader() {
  return (
    <div
      className="col-span-full flex justify-center py-4"
      role="status"
      aria-live="polite"
    >
      <Loader2Icon
        className="size-5 animate-spin text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}
