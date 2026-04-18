import { Role, type Photo } from "#/lib/types/type";
import InfiniteScroll from "react-infinite-scroll-component";
import { InfiniteScrollLoader } from "./Loaders/InfiniteScrollLoader";
import { DeletePhoto } from "./organizer/Event/DeletePhoto";
import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useCallback } from "react";
import { useDownload } from "#/hooks/downloadPhoto";
import { toast } from "sonner";

interface GalleryDisplayProps {
  photos: Photo[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

export function GalleryDisplay({
  photos,
  fetchNextPage,
  hasNextPage,
}: GalleryDisplayProps) {
  const user = useAppSelector(selectUser);
  const { download, downloading } = useDownload();
  const handleDownload = useCallback(
    async (id: string, url: string) => {
      try {
        await download(id, url);
      } catch (error) {
        const error_message =
          error instanceof Error ? error.message : "Download Failed";
        toast.error(error_message);
      }
    },
    [download],
  );
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
            <div className="relative" key={photo.id}>
              <figure className="mb-3 break-inside-avoid">
                <img
                  src={photo.public_url}
                  alt="Event capture"
                  className="h-auto w-full rounded-md object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <div className="absolute right-0 top-0">
                {user?.role === Role.attendee && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleDownload(photo.id, photo.public_url);
                    }}
                    disabled={downloading}
                  >
                    <Download />
                  </Button>
                )}
                {user?.role === Role.organizer && (
                  <DeletePhoto photo_id={photo.id} event_id={photo.event_id} />
                )}
              </div>
            </div>
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
