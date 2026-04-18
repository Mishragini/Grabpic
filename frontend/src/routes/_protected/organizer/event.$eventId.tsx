import { EventHeader } from "#/components/EventHeader";
import { GalleryHeader } from "#/components/GalleryHeader";
import { ScreenLoader } from "#/components/Loaders/ScreenLoader";
import { DeleteEvent } from "#/components/organizer/DeleteEvent";
import { AssignProfile } from "#/components/organizer/Event/AssignProfileDialog";
import { OrganizerGallery } from "#/components/organizer/Event/Gallery";
import { InconclusiveProfile } from "#/components/organizer/Event/InconclusiveProfile";
import { ProfileDialog } from "#/components/organizer/Event/ProfileDialog";
import { Profiles } from "#/components/organizer/Profiles";
import { ShareEventDialog } from "#/components/organizer/ShareEventDialog";
import { getSpaceById } from "#/lib/api/organizer/space";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/organizer/event/$eventId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId: event_id } = Route.useParams();

  const { data, isPending, isError, isLoading } = useQuery({
    queryKey: ["space", event_id],
    queryFn: async () => {
      const data = await getSpaceById(event_id);
      return data;
    },
  });

  if (isPending || isLoading) {
    return <ScreenLoader loadingText="Loading the event details" />;
  }

  return (
    <div className="page-wrap py-10 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {isError ? (
          <div>Failed to load event details</div>
        ) : (
          <EventHeader event={data} />
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ShareEventDialog event={data} />
          <DeleteEvent event_id={event_id} />
        </div>
      </div>

      <div className="mt-7 grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <section className="rise-in space-y-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-(--sea-ink)">
                Confirmed profiles
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Review generated face profiles and merge duplicates.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Profiles event_id={event_id} per_page={10} />
              <ProfileDialog event_id={event_id} />
            </div>
          </section>

          <section className="rise-in space-y-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-(--sea-ink)">
                Inconclusive faces
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Assign unmatched crops to an existing profile or create a new
                one.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <InconclusiveProfile event_id={event_id} />
              <AssignProfile event_id={event_id} />
            </div>
          </section>
        </div>

        <section className="rise-in border-t border-border/70 pt-6">
          <GalleryHeader />
          <div className="mt-3">
            <OrganizerGallery event_id={event_id} />
          </div>
        </section>
      </div>
    </div>
  );
}
