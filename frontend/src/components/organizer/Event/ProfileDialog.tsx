import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import { mergeProfiles } from "#/lib/api/organizer/profiles";
import type { Profile } from "#/lib/types/type";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DialogProfilePreview } from "../DialogProfilesPreview";
import { KeepProfile } from "../KeepProfile";
import {
  CommonDialogContent,
  CommonDialogDescription,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogTitle,
  CommonDialogTrigger,
  DialogStep,
} from "#/components/CommonDialog";
import { ScreenLoader } from "#/components/Loaders/ScreenLoader";
import { fetchEventProfiles } from "#/lib/api/fetchProfile";
import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";
import { EventProfilesDisplay } from "#/components/EventProfiles";

export function ProfileDialog({ event_id }: { event_id: string }) {
  const user = useAppSelector(selectUser);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [profiles_to_merge, setProfilesToMerge] = useState<Profile[]>([]);
  const [profile_to_merge_with, setProfileToMergeWith] = useState<
    string | null
  >(null);

  const [step, setStep] = useState(0);

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

  const toggleProfile = useCallback((page: Profile) => {
    setProfilesToMerge((prev) =>
      prev.some((p) => p.id === page.id)
        ? prev.filter((p) => p.id !== page.id)
        : [...prev, page],
    );
  }, []);

  const profiles = useMemo(
    () => data?.pages.flatMap((p) => p?.profiles ?? []) ?? [],
    [data],
  );

  const selected_ids = useMemo(() => {
    return new Set(profiles_to_merge.map((p) => p.id));
  }, [profiles_to_merge]);

  const { mutate, isPending: isMergePending } = useMutation({
    mutationKey: ["merge-profiles"],
    mutationFn: (data: {
      profiles_to_merge: string[];
      profile_to_merge_with: string;
    }) => mergeProfiles(data.profiles_to_merge, data.profile_to_merge_with),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Profiles merged successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["event-profiles", event_id],
      });
      resetDialog();
      setOpen(false);
    },
  });

  const handleMerge = useCallback(() => {
    if (selected_ids.size === 0 || !profile_to_merge_with) return;
    const duplicate_ids = Array.from(selected_ids).filter(
      (id) => id !== profile_to_merge_with,
    );
    if (duplicate_ids.length === 0) return;
    mutate({
      profiles_to_merge: duplicate_ids,
      profile_to_merge_with,
    });
  }, [selected_ids, profile_to_merge_with, mutate]);

  const totalLoaded = useMemo(() => {
    return profiles.length;
  }, [profiles]);

  const resetDialog = useCallback(() => {
    setStep(0);
    setProfilesToMerge([]);
    setProfileToMergeWith(null);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        resetDialog();
      }}
    >
      <CommonDialogTrigger>Manage Duplicates</CommonDialogTrigger>
      <CommonDialogContent>
        <div className="space-y-5 p-6 pb-4">
          <CommonDialogHeader>
            <DialogStep step={step} totalSteps={2} />
            <CommonDialogTitle>Merge face profiles</CommonDialogTitle>
            <CommonDialogDescription>
              {step === 0
                ? "Select every face that belongs to the same person. You need at least two."
                : "Tap one of the faces you selected — that profile stays; the others are merged into it."}
            </CommonDialogDescription>
          </CommonDialogHeader>

          {isPending && <ScreenLoader loadingText="Loading profiles" />}

          {data && !isPending && step === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {totalLoaded} profile{totalLoaded === 1 ? "" : "s"} loaded
                </span>
                {hasNextPage ? (
                  <span className="text-[0.7rem] font-medium uppercase tracking-wide text-(--kicker)">
                    Scroll for more
                  </span>
                ) : null}
              </div>
              <EventProfilesDisplay
                hasNextPage={hasNextPage}
                total_loaded={totalLoaded}
                fetchNextPage={fetchNextPage}
              >
                {profiles.map((page: Profile) => {
                  return (
                    <DialogProfilePreview
                      page={page}
                      selected={selected_ids.has(page.id)}
                      toggle={toggleProfile}
                    />
                  );
                })}
              </EventProfilesDisplay>
              {hasNextPage && profiles_to_merge.length > 0 ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Load every profile in this list (scroll to the end) before
                  continuing, so nothing is left out of the merge.
                </p>
              ) : null}
            </div>
          )}

          {data && !isPending && step === 1 && (
            <div className="space-y-3">
              <p className="island-kicker">Choose the profile to keep</p>
              <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {profiles_to_merge.map((page: Profile) => {
                    return (
                      <KeepProfile
                        isKeeper={profile_to_merge_with === page.id}
                        page={page}
                        setKeeper={setProfileToMergeWith}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <CommonDialogFooter>
          {step === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep((c) => c - 1);
                  setProfileToMergeWith(null);
                }}
                disabled={profiles_to_merge.length <= 0}
              >
                Back
              </Button>
              <Button
                onClick={handleMerge}
                disabled={
                  isMergePending ||
                  !profile_to_merge_with ||
                  selected_ids.size === 0
                }
              >
                {isMergePending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    Merging…
                  </>
                ) : (
                  "Merge profiles"
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setStep(1)}
              disabled={
                profiles_to_merge.length < 2 || !!hasNextPage || isPending
              }
            >
              Continue
            </Button>
          )}
        </CommonDialogFooter>
      </CommonDialogContent>
    </Dialog>
  );
}
