import { Selfie } from "#/components/attendee/Selfie";
import { CommonDialogContent } from "#/components/CommonDialog";
import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
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
    setEventId(res.id);
    setDialogOpen(true);
  }, []);

  return (
    <div>
      <div>Enter your invite code for the space you want to access</div>
      <form onSubmit={handleSubmit(fetchEvent)}>
        <Input
          placeholder="Invite code"
          required
          {...register("invite_code")}
        />
        {errors.invite_code?.message && <p>{errors.invite_code.message}</p>}
        <Button type="submit">Submit</Button>
      </form>
      {event_id && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <CommonDialogContent>
            <Selfie event_id={event_id} />
          </CommonDialogContent>
        </Dialog>
      )}
    </div>
  );
}
