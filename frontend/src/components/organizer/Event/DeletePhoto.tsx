import { useCallback, useState } from "react";
import { DeleteDialog } from "../DeleteDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deletePhoto } from "#/lib/api/organizer/photos";

export function DeletePhoto({
  photo_id,
  event_id,
}: {
  photo_id: string;
  event_id: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationKey: ["delete-photo", photo_id, event_id],
    mutationFn: () => deletePhoto(photo_id, event_id),
    onSuccess: () => {
      toast.success("Photo deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["photos", event_id] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message ? error.message : "Failed to delete photo.");
    },
  });

  const handleDelete = useCallback(() => {
    mutate();
  }, [mutate]);
  return (
    <DeleteDialog
      open={open}
      setOpen={setOpen}
      handleDelete={handleDelete}
      is_pending={isPending}
      dialog_title="Delete this photo ?"
      dialog_description="This will permanently remove the photo and all associated profiles."
    />
  );
}
