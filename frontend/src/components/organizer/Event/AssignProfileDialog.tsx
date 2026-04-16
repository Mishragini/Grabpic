import { InfiniteScrollLoader } from "#/components/Loaders/InfiniteScrollLoader";
import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import {
  assignInconclusiveProfile,
  fetchInconclusiveProfiles,
} from "#/lib/api/organizer/profiles";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { DialogProfilePreview } from "../DialogProfilesPreview";
import type { Profile } from "#/lib/types/type";
import { KeepProfile } from "../KeepProfile";
import { toast } from "sonner";
import {
  CommonDialogContent,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogTitle,
  CommonDialogTrigger,
  DialogStep,
} from "#/components/CommonDialog";
import { ScreenLoader } from "#/components/Loaders/ScreenLoader";
import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";
import { fetchEventProfiles } from "#/lib/api/fetchProfile";

export function AssignProfile({ event_id }: { event_id: string }) {
  const user = useAppSelector(selectUser);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedInconclusive, setSelectedInconclusive] = useState<
    string | null
  >(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const resetDialog = useCallback(() => {
    setStep(0);
    setSelectedInconclusive(null);
    setSelectedProfile(null);
  }, []);

  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["event-profiles", event_id, "paginated"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      if (!user) return;
      return fetchEventProfiles(event_id, pageParam, 6, user.role);
    },
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage?.hasMore ? lastPageParam + 1 : undefined,
    enabled: step === 1,
  });

  const {
    data: inconclusive_data,
    hasNextPage: hasNextInconclusive,
    fetchNextPage: fetchNextInconclusive,
    isPending: pendingInconclusive,
  } = useInfiniteQuery({
    queryKey: ["inconclusive-crops", event_id, "paginated"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchInconclusiveProfiles(event_id, pageParam, 6),
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  const toggleProfile = useCallback(
    (profile: Profile) => {
      selectedInconclusive === profile.id
        ? setSelectedInconclusive(null)
        : setSelectedInconclusive(profile.id);
    },
    [selectedInconclusive],
  );

  const inconclusive_profiles = useMemo(() => {
    if (!inconclusive_data) return [];
    return inconclusive_data.pages.flatMap((page) => page.data);
  }, [inconclusive_data]);

  const profiles = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page?.profiles);
  }, [data]);

  const { mutate, isPending: isAssigning } = useMutation({
    mutationKey: ["assign-profile"],
    mutationFn: (data: { inconclusive_id: string; profile_id?: string }) =>
      assignInconclusiveProfile(data.inconclusive_id, data.profile_id),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["inconclusive-crops", event_id],
          exact: false,
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["event-profiles", event_id],
          exact: false,
          refetchType: "all",
        }),
      ]);
      resetDialog();
      setOpen(false);
      toast.success("Profile assigment Successfull");
    },
  });

  const handleAssignment = useCallback(() => {
    if (!selectedInconclusive) return;
    selectedProfile
      ? mutate({
          inconclusive_id: selectedInconclusive,
          profile_id: selectedProfile,
        })
      : mutate({ inconclusive_id: selectedInconclusive });
  }, [mutate, selectedProfile, selectedInconclusive]);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetDialog();
      }}
    >
      <CommonDialogTrigger>Assign profile</CommonDialogTrigger>
      <CommonDialogContent>
        <div className="space-y-5 p-6 pb-4">
          <CommonDialogHeader>
            <DialogStep step={step} totalSteps={2} />
            <CommonDialogTitle>
              {step === 0
                ? "Select an inconclusive crop"
                : "Pick an existing profile"}
            </CommonDialogTitle>
          </CommonDialogHeader>
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select one crop, then either create a new profile or map it to
                an existing one.
              </p>
              <div
                id="inconclusive-scroll-target"
                className="h-52 overflow-y-auto rounded-xl border bg-muted/10 p-2"
              >
                {pendingInconclusive ? (
                  <ScreenLoader loadingText="Loading..." />
                ) : (
                  <InfiniteScroll
                    hasMore={!!hasNextInconclusive}
                    next={fetchNextInconclusive}
                    dataLength={inconclusive_profiles.length}
                    loader={<InfiniteScrollLoader />}
                    className="grid grid-cols-3 gap-2"
                    scrollableTarget="inconclusive-scroll-target"
                  >
                    {inconclusive_profiles.map((profile) => (
                      <DialogProfilePreview
                        key={profile.id}
                        toggle={toggleProfile}
                        page={profile}
                        selected={selectedInconclusive === profile.id}
                      />
                    ))}
                  </InfiniteScroll>
                )}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose one profile to keep this crop under.
              </p>
              <div
                id="scroll-target"
                className="h-52 overflow-y-auto rounded-xl border bg-muted/10 p-2"
              >
                <InfiniteScroll
                  hasMore={!!hasNextPage}
                  next={fetchNextPage}
                  dataLength={profiles.length}
                  loader={<InfiniteScrollLoader />}
                  className="grid grid-cols-3 gap-2"
                  scrollableTarget="scroll-target"
                >
                  {profiles.map((profile) => (
                    <KeepProfile
                      key={profile.id}
                      page={profile}
                      setKeeper={setSelectedProfile}
                      isKeeper={profile.id === selectedProfile}
                    />
                  ))}
                </InfiniteScroll>
              </div>
            </div>
          )}
        </div>
        <CommonDialogFooter>
          {step === 0 && (
            <>
              <Button
                disabled={!selectedInconclusive || isAssigning}
                onClick={handleAssignment}
              >
                {isAssigning ? "Saving..." : "Create new profile"}
              </Button>

              <Button
                variant="secondary"
                disabled={!selectedInconclusive}
                onClick={() => {
                  setStep((c) => c + 1);
                  setSelectedProfile(null);
                }}
              >
                Assign to existing profile
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setStep((c) => c - 1);
                }}
              >
                Previous
              </Button>

              <Button
                disabled={!selectedProfile || isAssigning}
                onClick={handleAssignment}
              >
                {isAssigning ? "Saving..." : "Assign selected profile"}
              </Button>
            </>
          )}
        </CommonDialogFooter>
      </CommonDialogContent>
    </Dialog>
  );
}
