import type { Profile } from "#/lib/types/type";
import { cn } from "#/lib/utils";
import { Check } from "lucide-react";
import { Button } from "../ui/button";

export function DialogProfilePreview({
  toggle,
  page,
  selected,
}: {
  toggle: (page: Profile) => void;
  page: Profile;
  selected: boolean | "true" | "false" | "mixed" | undefined;
}) {
  return (
    <Button
      key={page.id}
      type="button"
      variant="ghost"
      onClick={() => toggle(page)}
      aria-pressed={selected}
      className={cn(
        "relative h-auto w-full min-h-0 overflow-hidden rounded-lg border p-0 shadow-none transition-[box-shadow,transform,border-color] duration-200",
        "border-border/50 bg-muted/20 hover:bg-muted/35",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary/50 ring-2 ring-primary/35 ring-offset-2 ring-offset-background"
          : "hover:border-border",
      )}
    >
      <img
        src={page.photo_url}
        alt=""
        className="h-auto max-h-40 w-full object-contain"
      />
      {selected ? (
        <>
          <span
            className="pointer-events-none absolute inset-0 bg-foreground/6"
            aria-hidden
          />
          <span
            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
            aria-hidden
          >
            <Check className="size-3" strokeWidth={2.5} aria-hidden />
          </span>
        </>
      ) : null}
    </Button>
  );
}
