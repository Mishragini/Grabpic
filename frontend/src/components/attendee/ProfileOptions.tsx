import { useInfiniteQuery } from "@tanstack/react-query";
import { EventProfilesDisplay } from "../EventProfiles";
import { fetchEventProfiles } from "#/lib/api/fetchProfile";
import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";
import { useCallback, useMemo } from "react";
import { DialogProfilePreview } from "../organizer/DialogProfilesPreview";
import type { Profile } from "#/lib/types/type";
import { ScreenLoader } from "../Loaders/ScreenLoader";

export function ProfileOptions({
  event_id,
  setProfileId,
  profile_id,
}: {
  event_id: string;
  setProfileId: React.Dispatch<React.SetStateAction<string | null>>;
  profile_id: string | null;
}) {
  const user = useAppSelector(selectUser);
  const { fetchNextPage, hasNextPage, data, isPending } = useInfiniteQuery({
    queryKey: ["event-profiles", event_id, "paginated"],
    queryFn: ({ pageParam }) => {
      if (!user) return;
      return fetchEventProfiles(event_id, pageParam, 6, user?.role);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage?.hasMore ? lastPageParam + 1 : undefined,
  });

  const { profiles, total_loaded } = useMemo(() => {
    if (!data) return { profiles: [], total_loaded: 0 };
    const profiles = data?.pages.flatMap((p) => p?.profiles);
    return { profiles, total_loaded: profiles.length };
  }, [data]);

  const toggleProfile = useCallback((profile: Profile) => {
    profile_id === profile.id ? setProfileId(null) : setProfileId(profile.id);
  }, []);

  return (
    <>
      {isPending ? (
        <ScreenLoader loadingText="Loading..." />
      ) : (
        <EventProfilesDisplay
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          total_loaded={total_loaded}
        >
          {profiles.map((profile) => (
            <DialogProfilePreview
              key={profile.id}
              toggle={toggleProfile}
              page={profile}
              selected={profile_id === profile.id}
            />
          ))}
        </EventProfilesDisplay>
      )}
    </>
  );
}
