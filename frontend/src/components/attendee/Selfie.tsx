import { useCallback, useEffect, useRef, useState } from "react";
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

  const { mutate, isError, isPending } = useMutation({
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
        <div className="p-4">
          {step === 0 && (
            <>
              <div>Selfie</div>
              <video ref={camera.videoRef} autoPlay playsInline muted />
              <Button onClick={takePhoto}>Click</Button>
            </>
          )}
          {step === 1 && photo && (
            <div>
              <img src={photo} alt="Captured selfie" />
              <Button disabled={!photo} onClick={fetchSelfieProfile}>
                Fetch profile
              </Button>
            </div>
          )}
          {step === 2 && isError && (
            <div>
              <div>Could not find matching profiles</div>
              <div>Select your profilefrom the below profiles</div>
              <ProfileOptions
                event_id={event_id}
                setProfileId={setProfileId}
                profile_id={profile_id}
              />
              <Button
                onClick={() => {
                  if (!event_id || !profile_id) return;
                  navigate({
                    to: `/attendee/event/${event_id}/${profile_id}`,
                  });
                }}
              >
                fetch photos
              </Button>
            </div>
          )}
          {step === 2 && profileUrl && (
            <div>
              <div>confirm your profile</div>
              <img src={profileUrl} alt="profile" className="h-24 w-24" />
              <Button
                onClick={() => {
                  if (!event_id || !profile_id) return;
                  navigate({
                    to: `/attendee/event/${event_id}/${profile_id}`,
                  });
                }}
              >
                fetch photos
              </Button>
            </div>
          )}
        </div>
      </CommonDialogContent>
    </Dialog>
  );
}
