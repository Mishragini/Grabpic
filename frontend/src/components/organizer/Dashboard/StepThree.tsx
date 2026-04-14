import {
  CommonDialogDescription,
  CommonDialogHeader,
  CommonDialogTitle,
} from "#/components/CommonDialog";

interface StepThreeProps {
  event_name: string;
  photos: File[];
}

export function StepThree({ event_name, photos }: StepThreeProps) {
  return (
    <>
      <CommonDialogHeader>
        <CommonDialogTitle>Review</CommonDialogTitle>
        <CommonDialogDescription>
          Confirm details before creating the event.
        </CommonDialogDescription>
      </CommonDialogHeader>
      <div className="island-shell space-y-4 rounded-xl p-4">
        <div className="space-y-1">
          <p className="island-kicker text-[0.65rem]">Event</p>
          <p className="text-sm font-medium text-foreground">{event_name}</p>
        </div>
        <div className="h-px bg-border/80" aria-hidden />
        <div className="space-y-1">
          <p className="island-kicker text-[0.65rem]">Photos</p>
          <p className="text-sm text-muted-foreground">
            {photos.length} file{photos.length === 1 ? "" : "s"} selected
          </p>
        </div>
      </div>
    </>
  );
}
