import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { cn } from "#/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Profiles } from "../Profiles";
import { ShareEventDialog } from "../ShareEventDialog";

export function EventCard({
  event,
}: {
  event: { name: string; id: string; invite_code: string };
}) {
  return (
    <Card
      className={cn(
        "flex h-full  min-h-48 max-w-xs flex-col overflow-hidden rounded-xl border border-(--line) bg-card/20 transition-[transform,box-shadow] duration-200",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--line)_70%,var(--sea-ink)_30%)] hover:shadow-md",
      )}
    >
      <>
        <CardHeader className="gap-1 space-y-0 pb-2 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="island-kicker">Event</p>
              <h3
                className="display-title line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-(--sea-ink)"
                title={event?.name}
              >
                {event?.name}
              </h3>
            </div>
            <ShareEventDialog event={event} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pb-5 pt-0">
          <Profiles event_id={event?.id} per_page={5} />
          <div className="mt-auto">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 flex w-full justify-end hover:bg-transparent! hover:text-muted-foreground! dark:hover:bg-transparent!"
              asChild
            >
              <Link
                to="/organizer/event/$eventId"
                params={{ eventId: event?.id }}
              >
                View event
                <ArrowRight className="size-3.5 opacity-70 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </>
    </Card>
  );
}
