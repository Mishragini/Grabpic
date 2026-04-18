import { fetchProfilePhotos } from "#/lib/api/attendee/photos";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { GalleryDisplay } from "../GalleryDisplay";
import { Button } from "../ui/button";
import { useDownload } from "#/hooks/downloadPhoto";
import { toast } from "sonner";

export function AttendeeGallery({ profile_id }: { profile_id: string }) {
  const { downloadMultiple, downloading } = useDownload();
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
  const handleDownloadAll = useCallback(async () => {
    try {
      await downloadMultiple(photos);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Failed to download images :(";
      toast.error(error_message);
    }
  }, [photos, downloadMultiple]);
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
        <div>
          <div className="py-4 w-full flex justify-end">
            <Button
              onClick={handleDownloadAll}
              disabled={photos.length <= 0 || downloading}
            >
              Download All
            </Button>
          </div>
          <GalleryDisplay
            photos={photos}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        </div>
      )}
    </>
  );
}
