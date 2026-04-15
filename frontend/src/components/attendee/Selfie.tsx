import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { matchSelfie } from "#/lib/api/attendee/profiles";
import { useNavigate } from "@tanstack/react-router";

export function Selfie({ event_id }: { event_id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [profile_id, setProfileId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (step !== 0) return;
    let stream: MediaStream | null = null;
    const fetchUserMediaStream = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    };
    fetchUserMediaStream();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [step]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    setPhoto(dataUrl);
    setStep((c) => (c = 1));
  }, [canvasRef, videoRef]);

  const fetchSelfieProfile = useCallback(async () => {
    if (!photo) {
      console.log("here");
      return;
    }
    const res = await matchSelfie(photo, event_id);
    setProfileUrl(res.photo_url);
    setStep((c) => c + 1);
    console.log("res...", res);
    setProfileId(res.profile_id);
  }, [photo]);

  return (
    <div className="p-4">
      {step === 0 && (
        <>
          <div>Selfie</div>
          <video ref={videoRef} autoPlay playsInline muted />
          <Button onClick={takePhoto}>Click</Button>
          <canvas ref={canvasRef} className="hidden" />
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
      {step === 2 && profileUrl && (
        <div>
          <div>confirm your profile</div>
          <img src={profileUrl} alt="profile" className="h-24 w-24" />
          <Button
            onClick={() => {
              if (!event_id || !profile_id) return;
              navigate({ to: `/attendee/event/${event_id}/${profile_id}` });
            }}
          >
            fetch photos
          </Button>
        </div>
      )}
    </div>
  );
}
