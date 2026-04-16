import {
  ButtonDialogTrigger,
  CommonDialogContent,
  CommonDialogDescription,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogTitle,
} from "../CommonDialog";
import { Trash2Icon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";

interface DeleteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dialog_title: string;
  dialog_description: string;
  is_pending: boolean;
  handleDelete: () => void;
}

export function DeleteDialog({
  open,
  setOpen,
  dialog_title,
  dialog_description,
  is_pending,
  handleDelete,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <ButtonDialogTrigger
        variant="ghost"
        className="text-destructive hover:bg-transparent!"
      >
        <Trash2Icon />
      </ButtonDialogTrigger>
      <CommonDialogContent>
        <div className="space-y-5 p-6 pb-4">
          <CommonDialogHeader>
            <p className="island-kicker">Delete</p>
            <CommonDialogTitle>{dialog_title}</CommonDialogTitle>
            <CommonDialogDescription>
              {dialog_description}
            </CommonDialogDescription>
          </CommonDialogHeader>
        </div>
        <CommonDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={is_pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={is_pending}
          >
            {is_pending ? "Deleting..." : "Delete"}
          </Button>
        </CommonDialogFooter>
      </CommonDialogContent>
    </Dialog>
  );
}
