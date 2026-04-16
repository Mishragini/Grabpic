import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEvent } from "#/lib/api/organizer/space";
import { toast } from "sonner";
import { DeleteDialog } from "./DeleteDialog";

export function DeleteEvent({ event_id }: { event_id: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationKey: ["delete-event", event_id],
    mutationFn: (data: { event_id: string }) => deleteEvent(data.event_id),
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message ? error.message : "Failed to delete event");
    },
  });
  const handleDelete = useCallback(() => {
    mutate({ event_id });
  }, [mutate, event_id]);

  return (
    <DeleteDialog
      open={open}
      setOpen={setOpen}
      handleDelete={handleDelete}
      is_pending={isPending}
      dialog_title="Delete this event ?"
      dialog_description="This will permanently remove the event and all associated photos and profiles."
    />
  );
}
