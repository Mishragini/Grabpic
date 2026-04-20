import { GalleryDisplay } from "#/components/GalleryDisplay";
import { fetchEventPhotos } from "#/lib/api/organizer/photos";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function OrganizerGallery({ event_id }: { event_id: string }) {
  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["photos", event_id],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchEventPhotos(event_id, pageParam, 6),
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage?.hasMore ? lastPageParam + 1 : undefined,
  });
  const photos = useMemo(() => {
    if (!data) return [];
    return data?.pages.flatMap((page) => page?.data ?? []);
  }, [data]);
  if (isLoading) {
    return (
      <div className="flex h-24 items-center rounded-lg border border-dashed border-(--line) bg-muted/20 px-3 text-sm text-muted-foreground">
        Loading photos...
      </div>
    );
  }
  return (
    <GalleryDisplay
      photos={photos}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}
