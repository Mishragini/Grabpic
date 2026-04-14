import { Loader2Icon } from "lucide-react";

export function ScreenLoader({ loadingText }: { loadingText: string }) {
  return (
    <div className="flex min-h-[calc(100vh-120px)] w-full flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2Icon
          className="size-7 animate-spin text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {loadingText}
        </p>
      </div>
    </div>
  );
}
