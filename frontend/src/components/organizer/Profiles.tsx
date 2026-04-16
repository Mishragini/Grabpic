import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { UploadPhotoDilaog } from "./Dashboard/UploadPhotosDialog";
import { ProfileLoader } from "../Loaders/ProfileLoader";
import { DisplayProfile } from "./ProfileDisplay";
import { fetchEventProfiles } from "#/lib/api/fetchProfile";
import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";

export function Profiles({
  per_page,
  event_id,
}: {
  per_page: number;
  event_id: string;
}) {
  const user = useAppSelector(selectUser);
  const { isPending, isError, data } = useQuery({
    queryKey: ["event-profiles", event_id, "preview"],
    queryFn: async () => {
      if (!user) return;
      const data = await fetchEventProfiles(event_id, 0, per_page,user.role);
      return data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load profiles.", {
        id: `event-profiles-${event_id}`,
      });
    }
  }, [isError, event_id]);

  const { profiles, count, hasMore } = useMemo(() => {
    if (!data) return { profiles: [], count: 0, hasMore: false };
    return {
      profiles: data.profiles,
      count: data.profiles.length,
      hasMore: data.hasMore,
    };
  }, [data]);
  return (
    <>
      {isPending ? (
        <ProfileLoader length={per_page} />
      ) : count === 0 ? (
        isError ? (
          <Button
            disabled
            className="flex h-9 w-full items-center justify-start rounded-lg border border-dashed border-(--line) bg-muted/30 px-3 text-xs text-muted-foreground"
          >
            Could not load previews
          </Button>
        ) : (
          <UploadPhotoDilaog event_id={event_id} />
        )
      ) : (
        <DisplayProfile profiles={profiles} hasMore={hasMore} count={count} />
      )}
    </>
  );
}
