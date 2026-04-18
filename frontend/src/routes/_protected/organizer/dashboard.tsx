import { InfiniteScrollLoader } from "#/components/Loaders/InfiniteScrollLoader";
import { ScreenLoader } from "#/components/Loaders/ScreenLoader";
import { EventCard } from "#/components/organizer/Dashboard/EventCard";
import EventDialog from "#/components/organizer/Dashboard/EventDialog";
import { getSpaces } from "#/lib/api/organizer/space";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import InfiniteScroll from "react-infinite-scroll-component";

export const Route = createFileRoute("/_protected/organizer/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["spaces"],
    queryFn: ({ pageParam }) => getSpaces(pageParam, 24),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === 24 ? lastPageParam + 1 : undefined,
  });

  if (isLoading) {
    return <ScreenLoader loadingText="Loading Events" />;
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
      <InfiniteScroll
        dataLength={data?.pages.flat().length!}
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={<InfiniteScrollLoader />}
      >
        <div className="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
          {data?.pages.flat().map((event) => (
            <EventCard key={event?.id} event={event} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}
