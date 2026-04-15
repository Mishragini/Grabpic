import type { Event } from "#/lib/types/type";

export function EventHeader({ event }: { event: Event }) {
  return (
    <header className="rise-in border-b border-border/70 pb-5">
      <div>
        <h1 className="display-title mt-2 text-2xl font-semibold tracking-tight text-(--sea-ink) sm:text-3xl">
          {event?.name}
        </h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {event?.id}
        </p>
      </div>
    </header>
  );
}
