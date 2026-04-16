import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import { useForm, useWatch } from "react-hook-form";
import { StepTwo } from "./StepTwo";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { uploadPhotos } from "#/lib/api/organizer/photos";
import { toast } from "sonner";
import { StepFour } from "./StepFour";
import { useCallback, useState } from "react";
import { Thumbnails } from "./Thumbnails";
import {
  ButtonDialogTrigger,
  CommonDialogContent,
  CommonDialogFooter,
} from "#/components/CommonDialog";

const uploadPhotoSchema = z.object({
  photos: z.array(z.instanceof(File)),
});

type uploadPhotoSchema = z.infer<typeof uploadPhotoSchema>;

export function UploadPhotoDilaog({ event_id }: { event_id: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [task_id, setTaskId] = useState("");
  const {
    reset,
    setValue,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<uploadPhotoSchema>({
    defaultValues: {
      photos: [],
    },
  });

  const photos = useWatch({ control, name: "photos" });

  const { mutate, isPending } = useMutation({
    mutationKey: ["upload-photos"],
    mutationFn: (data: { photos: File[]; event_id: string }) =>
      uploadPhotos(data.photos, data.event_id),
    onError: (e) => {
      toast.error(e.message);
    },
    onSuccess: (data) => {
      setTaskId(data.task_id);
      setStep((c) => c + 1);
      toast.success("Photos uploaded successfully!");
    },
  });

  const handleUpload = () => {
    mutate({ photos, event_id });
  };
  const resetDialog = useCallback(() => {
    setStep(0);
    setTaskId("");
    reset();
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetDialog();
      }}
    >
      <ButtonDialogTrigger className="flex h-9 items-center rounded-lg border border-dashed border-(--line) bg-muted/30 px-3 text-xs text-muted-foreground">
        Upload photos to the event
      </ButtonDialogTrigger>
      <CommonDialogContent>
        {step === 0 ? (
          <form onSubmit={handleSubmit(handleUpload)} className="space-y-4">
            <StepTwo photos={photos} setValue={setValue} />
            {errors.photos?.message && (
              <p className="text-xs text-destructive" role="alert">
                {errors.photos.message}
              </p>
            )}
            {photos.length > 0 && (
              <Thumbnails photos={photos} setValue={setValue} />
            )}
            <CommonDialogFooter>
              <Button type="submit" disabled={photos.length <= 0 || isPending}>
                Upload
              </Button>
            </CommonDialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <StepFour
              task_id={task_id}
              total={photos.length}
              event_id={event_id}
            />
          </div>
        )}
      </CommonDialogContent>
    </Dialog>
  );
}
