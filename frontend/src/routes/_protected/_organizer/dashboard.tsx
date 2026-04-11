import EventDialog from "#/components/organizer/Event/EventDialog";
import { Card, CardHeader } from "#/components/ui/card";
import { getSpaces } from "#/lib/api/space";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/_organizer/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isFetching } = useInfiniteQuery({
    queryKey: ["spaces"],
    queryFn: ({ pageParam }) => getSpaces(pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 10 ? pages.length : undefined,
  });

  if (isFetching) {
    return <div>Loading....</div>;
  }

  if (data?.pages[0]?.length <= 0) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-12 space-y-4">
        <p className="text-4xl font-semibold">No events yet.</p>
        <EventDialog />
      </div>
    );
  }
  return (
    <div className="min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12 space-y-4">
      <div className="flex justify-end items-center">
        <EventDialog />
      </div>
      {data?.pages.flat().map((event) => (
        <Card className="max-w-xs">
          <CardHeader>{event.name}</CardHeader>
        </Card>
      ))}
    </div>
  );
}
