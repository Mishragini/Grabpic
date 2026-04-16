import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { matchSelfie } from "#/lib/api/attendee/profiles";
import { useNavigate } from "@tanstack/react-router";
import { CommonDialogContent } from "../CommonDialog";
import { Dialog } from "../ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileOptions } from "./ProfileOptions";
import { useCamera } from "#/hooks/camera";

export function Selfie({
  event_id,
  dialogOpen,
  setDialogOpen,
}: {
  event_id: string;
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const camera = useCamera();
  const [photo, setPhoto] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [profile_id, setProfileId] = useState<string | null>(null);

  const navigate = useNavigate();

  const resetDialog = useCallback(() => {
    setStep(0);
    setPhoto(null);
    setProfileId(null);
    setProfileUrl(null);
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      camera.start();
    } else {
      camera.stop();
      resetDialog();
    }
  }, [dialogOpen]);

  const takePhoto = useCallback(() => {
    const url = camera.capture();
    if (url) {
      setPhoto(url);
    }
    camera.stop();
    setStep((c) => c + 1);
  }, [camera, setStep]);

  const { mutate, isError } = useMutation({
    mutationKey: ["user-profile"],
    mutationFn: async (data: { photo: string; event_id: string }) => {
      const res = await matchSelfie(data.photo, data.event_id);
      setProfileUrl(res.photo_url);
      setProfileId(res.profile_id);
    },
    onSuccess: () => {
      toast.success("Fetched matching profile.");
      setStep((c) => c + 1);
    },

    onError: (data) => {
      toast.error(data.message);
      setStep((c) => c + 1);
    },
  });

  const fetchSelfieProfile = useCallback(async () => {
    if (!photo) {
      return;
    }
    mutate({ photo, event_id });
  }, [photo, mutate, event_id]);

  return (
    <Dialog open={dialogOpen} onOpenChange={(val) => setDialogOpen(val)}>
      <CommonDialogContent>
        <div className="space-y-4 p-5 sm:p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <p className="island-kicker">Step 1</p>
                <h2 className="display-title mt-1 text-xl text-foreground">
                  Capture a selfie
                </h2>
              </div>
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-4/3 w-full rounded-xl border border-border/70 bg-muted object-cover"
              />
              <Button onClick={takePhoto} className="w-full rounded-xl">
                Capture
              </Button>
            </div>
          )}
          {step === 1 && photo && (
            <div className="space-y-4">
              <div>
                <p className="island-kicker">Step 2</p>
                <h2 className="display-title mt-1 text-xl text-foreground">
                  Confirm selfie
                </h2>
              </div>
              <img
                src={photo}
                alt="Captured selfie"
                className="aspect-4/3 w-full rounded-xl border border-border/70 object-cover"
              />
              <Button
                disabled={!photo}
                onClick={fetchSelfieProfile}
                className="w-full rounded-xl"
              >
                Find my profile
              </Button>
            </div>
          )}
          {step === 2 && isError && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  We could not find an exact match
                </p>
                <p className="text-sm text-muted-foreground">
                  Select your profile from the list below.
                </p>
              </div>
              <ProfileOptions
                event_id={event_id}
                setProfileId={setProfileId}
                profile_id={profile_id}
              />
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  if (!event_id || !profile_id) return;
                  navigate({
                    to: `/attendee/event/${event_id}/${profile_id}`,
                  });
                }}
              >
                Continue to photos
              </Button>
            </div>
          )}
          {step === 2 && profileUrl && (
            <div className="space-y-4">
              <div>
                <p className="island-kicker">Final Step</p>
                <h2 className="display-title mt-1 text-xl text-foreground">
                  Confirm your profile
                </h2>
              </div>
              <img
                src={profileUrl}
                alt="profile"
                className="h-28 w-28 rounded-full border border-border/70 object-cover"
              />
              <Button
                className="w-full rounded-xl"
                onClick={() => {
                  if (!event_id || !profile_id) return;
                  navigate({
                    to: `/attendee/event/${event_id}/${profile_id}`,
                  });
                }}
              >
                Continue to photos
              </Button>
            </div>
          )}
        </div>
      </CommonDialogContent>
    </Dialog>
  );
}
