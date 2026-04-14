import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { Button } from "../../ui/button";
import { Dialog } from "../../ui/dialog";
import { useCallback, useRef, useState } from "react";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { StepThree } from "./StepThree";
import { Thumbnails } from "./Thumbnails";
import { createEvent } from "#/lib/api/event";
import { StepFour } from "./StepFour";
import {
  ButtonDialogTrigger,
  CommonDialogContent,
  CommonDialogFooter,
  DialogStep,
} from "#/components/CommonDialog";

const createEventSchema = z.object({
  name: z.string().min(3, "Event name should be at least 3 characters."),
  photos: z.array(z.instanceof(File)),
});

type createEventSchema = z.infer<typeof createEventSchema>;

export default function EventDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [task_id, setTaskId] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const createEventLoadingId = useRef<null | number | string>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<createEventSchema>({
    defaultValues: {
      name: "",
      photos: [],
    },
    resolver: zodResolver(createEventSchema),
  });

  const { isPending, mutate } = useMutation({
    mutationFn: (data: createEventSchema) => createEvent(data),
    onError: (error) => {
      createEventLoadingId.current &&
        toast.dismiss(createEventLoadingId.current);
      toast.error(error.message);
      createEventLoadingId.current = null;
    },
    onSuccess: (data) => {
      createEventLoadingId.current &&
        toast.dismiss(createEventLoadingId.current);
      toast.success("Event created!");
      setStep((c) => c + 1);
      setTaskId(data.task_id);
      setCreatedEventId(data.event_id);
      createEventLoadingId.current = null;
    },
  });

  const handleCreateEvent: SubmitHandler<createEventSchema> = useCallback(
    async (data) => {
      createEventLoadingId.current = toast.loading("Creating Event...");
      mutate(data);
    },
    [],
  );
  const name = useWatch({ control, name: "name" });
  const photos = useWatch({ control, name: "photos" });

  const isNextDisabled = useCallback(
    (step: number) => {
      switch (step) {
        case 0:
          return !name;
        case 1:
          return photos.length === 0;
        case 2:
          return !name || photos.length === 0;
        default:
          return false;
      }
    },
    [name, photos],
  );

  const resetDialog = useCallback(() => {
    setStep(0);
    setTaskId(null);
    setCreatedEventId(null);
    reset();
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          resetDialog();
        }
      }}
    >
      <ButtonDialogTrigger>Create Event</ButtonDialogTrigger>
      <CommonDialogContent>
        <form
          onSubmit={handleSubmit(handleCreateEvent)}
          className="flex flex-col"
        >
          <div className="space-y-6 p-6 pb-4">
            <DialogStep step={step} totalSteps={4} />

            <div className="space-y-6">
              {step === 0 && <StepOne register={register} errors={errors} />}
              {step === 1 && <StepTwo setValue={setValue} photos={photos} />}
              {step === 2 && <StepThree event_name={name} photos={photos} />}
              {step === 3 && task_id && createdEventId && (
                <StepFour
                  task_id={task_id}
                  total={photos.length}
                  event_id={createdEventId}
                />
              )}
              {photos.length > 0 && step > 0 && step <= 2 && (
                <Thumbnails photos={photos} setValue={setValue} />
              )}
            </div>
          </div>

          <CommonDialogFooter>
            {step > 0 && step < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep((c) => c - 1);
                }}
              >
                Previous
              </Button>
            )}
            {step < 2 && (
              <Button
                type="button"
                onClick={() => {
                  setStep((c) => c + 1);
                }}
                disabled={isNextDisabled(step)}
              >
                Next
              </Button>
            )}

            {step === 2 && (
              <Button disabled={isPending} type="submit">
                Create Event
              </Button>
            )}
          </CommonDialogFooter>
        </form>
      </CommonDialogContent>
    </Dialog>
  );
}
