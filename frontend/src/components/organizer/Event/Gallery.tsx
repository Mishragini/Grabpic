import { InfiniteScrollLoader } from "#/components/Loaders/InfiniteScrollLoader";
import { fetchEventPhotos } from "#/lib/api/photos";
import type { Photo } from "#/lib/types/type";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

export function Gallery({ event_id }: { event_id: string }) {
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["photos", event_id],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchEventPhotos(event_id, pageParam, 6),
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });
  const photos = useMemo(() => {
    if (!data) return [];
    return data?.pages.flatMap((page) => page.data);
  }, [data]);
  if (isLoading) {
    return (
      <div className="flex h-24 items-center rounded-lg border border-dashed border-(--line) bg-muted/20 px-3 text-sm text-muted-foreground">
        Loading photos...
      </div>
    );
  }
  return (
    <div
      id="gallery-scroll-target"
      className="max-h-[min(520px,68vh)] overflow-y-auto"
    >
      <InfiniteScroll
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={<InfiniteScrollLoader />}
        dataLength={photos.length}
        className="columns-2 gap-3 sm:columns-3"
        scrollableTarget="gallery-scroll-target"
      >
        {photos.length > 0 ? (
          photos.map((photo: Photo) => (
            <figure key={photo.id} className="mb-3 break-inside-avoid">
              <img
                src={photo.image_url}
                alt="Event capture"
                className="h-auto w-full rounded-md object-contain"
              />
            </figure>
          ))
        ) : (
          <div className="col-span-full flex h-24 items-center rounded-lg border border-dashed border-(--line) bg-muted/20 px-3 text-sm text-muted-foreground">
            No photos uploaded yet
          </div>
        )}
      </InfiniteScroll>
    </div>
  );
}
