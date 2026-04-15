import { fetchProfilePhotos } from "#/lib/api/attendee/photos";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { GalleryDisplay } from "../GalleryDisplay";

export function AttendeeGallery({ profile_id }: { profile_id: string }) {
  const { data, isLoading, hasNextPage, fetchNextPage, isError } =
    useInfiniteQuery({
      queryKey: ["photos", profile_id],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => fetchProfilePhotos(profile_id, pageParam, 6),
      getNextPageParam: (lastPage, _, lastPageParam) =>
        lastPage.hasMore ? lastPageParam + 1 : undefined,
    });
  const photos = useMemo(() => {
    if (!data) return [];
    return data?.pages.flatMap((page) => page.data);
  }, [data]);
  console.log("photos...", photos);
  if (isLoading) {
    return (
      <div className="flex h-24 items-center rounded-lg border border-dashed border-(--line) bg-muted/20 px-3 text-sm text-muted-foreground">
        Loading photos...
      </div>
    );
  }
  return (
    <>
      {isError ? (
        <div> failed to fetch images</div>
      ) : (
        <GalleryDisplay
          photos={photos}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </>
  );
}
