import InfiniteScroll from "react-infinite-scroll-component";
import { InfiniteScrollLoader } from "./Loaders/InfiniteScrollLoader";

interface EventProfilesDisplayProps {
  children: React.ReactNode;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  total_loaded: number;
}

export function EventProfilesDisplay({
  children,
  fetchNextPage,
  hasNextPage,
  total_loaded,
}: EventProfilesDisplayProps) {
  return (
    <div
      id="profile-scroll"
      className="max-h-[min(280px,42vh)] overflow-y-auto rounded-lg border border-border/60 bg-muted/15 p-3"
    >
      <InfiniteScroll
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        dataLength={total_loaded}
        loader={<InfiniteScrollLoader />}
        scrollableTarget="profile-scroll"
        className="grid grid-cols-3 gap-2.5 sm:gap-3"
      >
        {children}
      </InfiniteScroll>
    </div>
  );
}
