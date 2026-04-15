import { AttendeeGallery } from "#/components/attendee/Gallery";
import { EventHeader } from "#/components/EventHeader";
import { GalleryHeader } from "#/components/GalleryHeader";
import { GallerySection } from "#/components/GallerySection";
import { ScreenLoader } from "#/components/Loaders/ScreenLoader";
import { getSpaceById } from "#/lib/api/attendee/space";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_protected/attendee/event/$eventId/$profileId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { profileId: profile_id, eventId: event_id } = Route.useParams();

  const { data, isPending, isError } = useQuery({
    queryKey: ["space", profile_id],
    queryFn: async () => {
      const data = await getSpaceById(event_id);
      return data;
    },
  });

  if (isPending) {
    return <ScreenLoader loadingText="Loading the event details" />;
  }

  return (
    <div className="page-wrap py-10 sm:py-12">
      {isError ? (
        <div>Failed to load event details</div>
      ) : (
        <EventHeader event={data} />
      )}
      <div className="mt-7 grid gap-8">
        <GallerySection>
          <GalleryHeader />
          <div className="mt-3">
            <AttendeeGallery profile_id={profile_id} />
          </div>
        </GallerySection>
      </div>
    </div>
  );
}
