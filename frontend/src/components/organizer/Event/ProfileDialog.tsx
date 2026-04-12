import { InfiniteScrollLoader } from "#/components/InfiniteScrollLoader";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { fetchEventProfiles, mergeProfiles } from "#/lib/api/profiles";
import type { Profile } from "#/lib/types/type";
import { cn } from "#/lib/utils";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";

export function ProfileDialog({ event_id }: { event_id: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [profiles_to_merge, setProfilesToMerge] = useState<Profile[]>([]);
  const [profile_to_merge_with, setProfileToMergeWith] = useState<
    string | null
  >(null);

  const [step, setStep] = useState(0);

  const { fetchNextPage, hasNextPage, data, isPending } = useInfiniteQuery({
    queryKey: ["face-profiles", event_id],
    queryFn: ({ pageParam }) => fetchEventProfiles(event_id, pageParam, 6),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  const toggleProfile = useCallback((page: Profile) => {
    setProfilesToMerge((prev) =>
      prev.some((p) => p.id === page.id)
        ? prev.filter((p) => p.id !== page.id)
        : [...prev, page],
    );
  }, []);

  const profiles = useMemo(
    () => data?.pages.flatMap((p) => p.profiles) ?? [],
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
      void queryClient.invalidateQueries({
        queryKey: ["face-profiles", event_id],
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

  const totalLoaded = profiles.length;

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
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto shrink-0 px-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:bg-transparent! hover:text-foreground hover:underline hover:cursor-pointer"
        >
          Manage Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="space-y-5 p-6 pb-4">
          <DialogHeader className="gap-0 space-y-0 text-left">
            <div className="border-b border-border/70 pb-4">
              <p className="island-kicker">Step {step + 1} of 2</p>
              <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/25 transition-[width] duration-300 ease-out"
                  style={{ width: `${((step + 1) / 2) * 100}%` }}
                />
              </div>
            </div>
            <DialogTitle className="mt-4 font-heading text-lg tracking-tight text-(--sea-ink)">
              Merge face profiles
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-pretty">
              {step === 0
                ? "Select every face that belongs to the same person. You need at least two."
                : "Tap one of the faces you selected — that profile stays; the others are merged into it."}
            </DialogDescription>
          </DialogHeader>

          {isPending && (
            <div
              className="flex items-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="size-4 shrink-0 animate-spin"
                strokeWidth={1.5}
                aria-hidden
              />
              Loading profiles…
            </div>
          )}

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
              <div
                id="profile-scroll"
                className="max-h-[min(280px,42vh)] overflow-y-auto rounded-lg border border-border/60 bg-muted/15 p-3"
              >
                <InfiniteScroll
                  next={fetchNextPage}
                  hasMore={!!hasNextPage}
                  dataLength={totalLoaded}
                  loader={<InfiniteScrollLoader />}
                  scrollableTarget="profile-scroll"
                  className="grid grid-cols-3 gap-2.5 sm:gap-3"
                >
                  {profiles.map((page: Profile) => {
                    const selected = selected_ids.has(page.id);
                    return (
                      <Button
                        key={page.id}
                        type="button"
                        variant="ghost"
                        onClick={() => toggleProfile(page)}
                        aria-pressed={selected}
                        className={cn(
                          "relative aspect-square h-auto w-full min-h-0 overflow-hidden rounded-xl border p-0 shadow-none transition-[box-shadow,transform,border-color] duration-200",
                          "border-border/50 bg-muted/20 hover:bg-muted/35 hover:scale-[1.02] active:scale-[0.99]",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          selected
                            ? "border-primary/50 ring-2 ring-primary/35 ring-offset-2 ring-offset-background"
                            : "hover:border-border",
                        )}
                      >
                        <img
                          src={page.photo_url}
                          alt=""
                          className="size-full object-cover transition-transform duration-200 group-hover/button:scale-[1.03]"
                        />
                        {selected ? (
                          <>
                            <span
                              className="pointer-events-none absolute inset-0 bg-foreground/6"
                              aria-hidden
                            />
                            <span
                              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                              aria-hidden
                            >
                              <Check
                                className="size-3"
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            </span>
                          </>
                        ) : null}
                      </Button>
                    );
                  })}
                </InfiniteScroll>
              </div>
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
                    const isKeeper = profile_to_merge_with === page.id;
                    return (
                      <Button
                        key={page.id}
                        type="button"
                        variant="ghost"
                        onClick={() => setProfileToMergeWith(page.id)}
                        aria-pressed={isKeeper}
                        className={cn(
                          "relative aspect-square h-auto w-full min-h-0 overflow-hidden rounded-xl border p-0 shadow-none transition-[box-shadow,transform,border-color] duration-200",
                          "border-border/50 bg-muted/20 hover:bg-muted/35 hover:scale-[1.02] active:scale-[0.99]",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          isKeeper
                            ? "border-primary/50 ring-2 ring-primary/35 ring-offset-2 ring-offset-background"
                            : "hover:border-border",
                        )}
                      >
                        <img
                          src={page.photo_url}
                          alt=""
                          className="size-full object-cover transition-transform duration-200 group-hover/button:scale-[1.03]"
                        />
                        {isKeeper ? (
                          <>
                            <span
                              className="pointer-events-none absolute inset-0 bg-foreground/6"
                              aria-hidden
                            />
                            <span
                              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                              aria-hidden
                            >
                              <Check
                                className="size-3"
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            </span>
                            <span className="pointer-events-none absolute bottom-1.5 left-1/2 max-w-[calc(100%-0.75rem)] -translate-x-1/2 truncate rounded-full bg-background/90 px-2 py-0.5 text-center text-[0.6rem] font-medium text-foreground shadow-sm ring-1 ring-border/50 backdrop-blur-sm">
                              Keep
                            </span>
                          </>
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 rounded-none border-border/80 bg-muted/40 px-6 py-4 sm:rounded-b-xl">
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
                    <Loader2 className="size-4 animate-spin" aria-hidden />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
