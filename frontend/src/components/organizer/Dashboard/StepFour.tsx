import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import {
  CommonDialogDescription,
  CommonDialogHeader,
  CommonDialogTitle,
} from "#/components/CommonDialog";

export function StepFour({
  task_id,
  total,
  event_id,
}: {
  task_id: string;
  total: number;
  event_id: string;
}) {
  const queryClient = useQueryClient();
  const [processed, setProcessed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/progress/${task_id}`);
    ws.onmessage = (event) => {
      let data: {
        processed?: number;
        completed?: boolean;
        error?: boolean;
      };
      try {
        data = JSON.parse(event.data) as typeof data;
      } catch {
        toast.error("Could not read processing update.");
        return;
      }
      if (typeof data.processed === "number") setProcessed(data.processed);
      if (data.completed) {
        setCompleted(true);
        ws.close();
      } else if (data.error) {
        setError(true);
        toast.error("Unexpected error while processing.");
        ws.close();
      }
    };
    ws.onerror = () => {
      toast.error("Lost connection to processing updates.");
    };

    return () => ws.close();
  }, [task_id]);

  useEffect(() => {
    if (!completed) return;
    void queryClient.invalidateQueries({
      queryKey: ["event-profiles", event_id],
    });
  }, [completed, event_id, queryClient]);
  return (
    <div className="space-y-4 p-4">
      {error ? (
        <>
          <CommonDialogHeader>
            <CommonDialogTitle>Processing failed</CommonDialogTitle>
            <CommonDialogDescription>
              We couldn&apos;t finish processing your photos.
            </CommonDialogDescription>
          </CommonDialogHeader>
          <div
            className="island-shell rise-in flex gap-3 rounded-xl p-4 ring-1 ring-destructive/20"
            role="alert"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              aria-hidden
            >
              <TriangleAlertIcon className="size-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
                Something went wrong on our end
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Close this dialog and try uploading again. If it keeps failing,
                try a smaller batch or check your connection.
              </p>
            </div>
          </div>
        </>
      ) : completed ? (
        <CommonDialogHeader className="gap-1.5 text-left">
          <CommonDialogTitle className="display-title text-lg font-medium tracking-tight">
            All set
          </CommonDialogTitle>
          <CommonDialogDescription>
            Processing complete.
          </CommonDialogDescription>
        </CommonDialogHeader>
      ) : (
        <>
          <CommonDialogHeader>
            <CommonDialogTitle className="display-title text-lg font-medium tracking-tight">
              Processing
            </CommonDialogTitle>
            <CommonDialogDescription>
              This can take a moment for large uploads.
            </CommonDialogDescription>
          </CommonDialogHeader>
          <div className="island-shell space-y-3 rounded-xl p-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="tabular-nums text-foreground">
                {processed} / {total}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/30 transition-[width] duration-300 ease-out"
                style={{
                  width:
                    total > 0
                      ? `${Math.min(100, (processed / total) * 100)}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
