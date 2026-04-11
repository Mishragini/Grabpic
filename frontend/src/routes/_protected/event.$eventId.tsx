import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/event/$eventId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  return (
    <div className="page-wrap py-10">
      <h1 className="display-title text-2xl font-semibold tracking-tight text-(--sea-ink)">
        Event
      </h1>
      <p className="mt-2 text-sm text-muted-foreground font-mono">{eventId}</p>
    </div>
  );
}
