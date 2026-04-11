import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { cn } from "#/lib/utils";
import { fetchEventProfiles } from "#/lib/api/profiles";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { UploadPhotoDilaog } from "./UploadPhotosDialog";

interface Profile {
  representative_crop_path: string;
  id: string;
  photo_url: string;
}

const PREVIEW_LIMIT = 5;

export function EventCard({ event }: { event: { name: string; id: string } }) {
  const { isLoading, isError, data } = useQuery({
    queryKey: ["event-profiles", event.id],
    queryFn: async () => {
      const { data } = await fetchEventProfiles(event.id, 0, PREVIEW_LIMIT + 1);
      return data;
    },
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load profiles.", {
        id: `event-profiles-${event.id}`,
      });
    }
  }, [isError, event.id]);

  const profiles = data ?? [];
  const hasMore = profiles.length > PREVIEW_LIMIT;
  const displayProfiles = hasMore ? profiles.slice(0, PREVIEW_LIMIT) : profiles;
  const count = displayProfiles.length;

  return (
    <Card
      className={cn(
        "flex h-full  min-h-48 max-w-xs flex-col overflow-hidden rounded-xl border border-(--line) bg-card/20 transition-[transform,box-shadow] duration-200",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--line)_70%,var(--sea-ink)_30%)] hover:shadow-md",
      )}
    >
      {isLoading ? (
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="flex -space-x-2">
            {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
              <div
                key={i}
                className="size-9 shrink-0 animate-pulse rounded-full border-2 border-(--foam) bg-muted"
              />
            ))}
          </div>
          <div className="mt-auto h-8 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <>
          <CardHeader className="gap-1 space-y-0 pb-2 pt-5">
            <p className="island-kicker">Event</p>
            <h3
              className="display-title line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-(--sea-ink)"
              title={event.name}
            >
              {event.name}
            </h3>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 pb-5 pt-0">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {isError
                  ? "Photos unavailable"
                  : count === 0
                    ? "No profiles yet"
                    : "Face profiles"}
              </p>
              <div className="flex min-h-9 items-center">
                {count === 0 ? (
                  isError ? (
                    <Button
                      disabled
                      className="flex h-9 w-full items-center rounded-lg border border-dashed border-(--line) bg-muted/30 px-3 text-xs text-muted-foreground"
                    >
                      Could not load previews
                    </Button>
                  ) : (
                    <UploadPhotoDilaog event_id={event.id} />
                  )
                ) : (
                  <div className="flex gap-2 items-end">
                    <div className="flex -space-x-2">
                      {displayProfiles.map((profile: Profile, i: number) => (
                        <img
                          key={profile.id}
                          src={profile.photo_url}
                          alt=""
                          className="size-9 rounded-full object-cover shadow-sm ring-1 ring-black/5"
                          style={{ zIndex: PREVIEW_LIMIT - i }}
                        />
                      ))}
                    </div>
                    {hasMore ? <div>+ more</div> : null}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 flex w-full justify-end hover:bg-transparent! hover:text-muted-foreground! dark:hover:bg-transparent!"
                asChild
              >
                <Link to="/event/$eventId" params={{ eventId: event.id }}>
                  View event
                  <ArrowRight className="size-3.5 opacity-70 transition-transform group-hover/button:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
