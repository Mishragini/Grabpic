import { AssignProfile } from "#/components/organizer/Event/AssignProfileDialog";
import { Gallery } from "#/components/organizer/Event/Gallery";
import { InconclusiveProfile } from "#/components/organizer/Event/InconclusiveProfile";
import { ProfileDialog } from "#/components/organizer/Event/ProfileDialog";
import { Profiles } from "#/components/organizer/Profiles";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/event/$eventId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId: event_id } = Route.useParams();

  return (
    <div className="page-wrap py-10 sm:py-12">
      <header className="rise-in border-b border-border/70 pb-5">
        <p className="island-kicker">Event Workspace</p>
        <h1 className="display-title mt-2 text-2xl font-semibold tracking-tight text-(--sea-ink) sm:text-3xl">
          Event Profiles
        </h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {event_id}
        </p>
      </header>

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
          <h2 className="text-sm font-semibold tracking-tight text-(--sea-ink)">
            Event gallery
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Scroll through uploaded photos.
          </p>
          <div className="mt-3">
            <Gallery event_id={event_id} />
          </div>
        </section>
      </div>
    </div>
  );
}
