import { InfiniteScrollLoader } from "#/components/InfiniteScrollLoader";
import { EventCard } from "#/components/organizer/Event/EventCard";
import EventDialog from "#/components/organizer/Event/EventDialog";
import { getSpaces } from "#/lib/api/space";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";

export const Route = createFileRoute("/_protected/_organizer/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, fetchNextPage, hasNextPage, isLoading } =
    useInfiniteQuery({
    queryKey: ["spaces"],
    queryFn: ({ pageParam }) => getSpaces(pageParam, 24),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 24 ? pages.length : undefined,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] w-full flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="size-7 animate-spin text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Loading events
          </p>
        </div>
      </div>
    );
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 overflow-y-auto">
          {data?.pages.flat().map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}
