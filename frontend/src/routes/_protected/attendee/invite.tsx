import { Selfie } from "#/components/attendee/Selfie";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { fetchEventByInviteCode } from "#/lib/api/attendee/space";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const inviteCodeSchema = z.object({
  invite_code: z.string().min(1),
});

type inviteCodeSchem = z.infer<typeof inviteCodeSchema>;

export const Route = createFileRoute("/_protected/attendee/invite")({
  component: RouteComponent,
});

function RouteComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [event_id, setEventId] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<inviteCodeSchem>({
    defaultValues: {
      invite_code: "",
    },
  });

  const fetchEvent = useCallback(async (data: inviteCodeSchem) => {
    const res = await fetchEventByInviteCode(data.invite_code);
    if (!res?.id) {
      return;
    }
    setEventId(res.id);
    setDialogOpen(true);
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md">
        <p className="island-kicker">Attendee Access</p>
        <h1 className="display-title mt-2 text-2xl text-foreground">
          Join your event
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your invite code to continue and verify your profile.
        </p>
        <form onSubmit={handleSubmit(fetchEvent)} className="mt-6 space-y-3">
          <Input
            placeholder="Invite code"
            required
            className="h-11 rounded-xl border-border/70 bg-background/80"
            {...register("invite_code")}
          />
          {errors.invite_code?.message && (
            <p className="text-sm text-destructive">
              {errors.invite_code.message}
            </p>
          )}
          <Button type="submit" className="h-11 w-full rounded-xl">
            Continue
          </Button>
        </form>
      </div>

      {event_id && (
        <Selfie
          event_id={event_id}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
        />
      )}
    </div>
  );
}
