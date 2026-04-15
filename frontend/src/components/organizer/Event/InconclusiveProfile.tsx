import { ProfileLoader } from "#/components/Loaders/ProfileLoader";
import { fetchInconclusiveProfiles } from "#/lib/api/organizer/profiles";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DisplayProfile } from "../ProfileDisplay";

export function InconclusiveProfile({ event_id }: { event_id: string }) {
  const { isPending, data, isError } = useQuery({
    queryKey: ["inconclusive-crops", event_id, "preview"],
    queryFn: async () => fetchInconclusiveProfiles(event_id, 0, 10),
  });

  const { inconclusive_profiles, count, hasMore } = useMemo(() => {
    if (!data) return { inconclusive_profiles: [], count: 0, hasMore: false };
    return {
      inconclusive_profiles: data.data,
      count: data.data.length,
      hasMore: data.hasMore,
    };
  }, [data]);

  return (
    <div>
      {isPending ? (
        <ProfileLoader length={10} />
      ) : count === 0 ? (
        isError ? (
          <div className="flex h-9 w-full items-center rounded-lg border border-dashed border-(--line) bg-muted/30 px-3 text-xs text-muted-foreground">
            Could not load inconclusive profiles
          </div>
        ) : (
          <div className="flex h-9 w-full items-center rounded-lg border border-dashed border-(--line) bg-muted/20 px-3 text-xs text-muted-foreground">
            No inconclusive profiles found
          </div>
        )
      ) : (
        <DisplayProfile
          profiles={inconclusive_profiles}
          count={count}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
