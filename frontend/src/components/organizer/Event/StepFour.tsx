import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
    <div className="space-y-4">
      {completed ? (
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="display-title text-lg font-medium tracking-tight">
            All set
          </DialogTitle>
          <DialogDescription>Processing complete.</DialogDescription>
        </DialogHeader>
      ) : (
        <>
          <DialogHeader className="gap-1.5 text-left">
            <DialogTitle className="display-title text-lg font-medium tracking-tight">
              Processing
            </DialogTitle>
            <DialogDescription>
              This can take a moment for large uploads.
            </DialogDescription>
          </DialogHeader>
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
