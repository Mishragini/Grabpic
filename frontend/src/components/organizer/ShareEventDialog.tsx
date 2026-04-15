import {
  ButtonDialogTrigger,
  CommonDialogContent,
  CommonDialogDescription,
  CommonDialogHeader,
  CommonDialogTitle,
} from "#/components/CommonDialog";
import { Button } from "#/components/ui/button";
import { Dialog } from "#/components/ui/dialog";
import type { Event } from "#/lib/types/type";
import { ClipboardCheck, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function ShareEventDialog({ event }: { event: Event }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      toast.error("Clipboard is not available.");
      return;
    }
    try {
      await navigator.clipboard.writeText(event?.invite_code);
      setCopied(true);
    } catch {
      toast.error("Could not copy.");
    }
  }, [event]);

  return (
    <Dialog>
      <ButtonDialogTrigger variant="outline" size="sm" className="shrink-0">
        Share event
      </ButtonDialogTrigger>
      <CommonDialogContent className="sm:max-w-md">
        <div className="space-y-5 p-6 pb-4">
          <CommonDialogHeader>
            <p className="island-kicker">Share</p>
            <CommonDialogTitle className="pr-7">
              {event?.name}
            </CommonDialogTitle>
            <CommonDialogDescription>
              Copy the invite code for guests to open this event.
            </CommonDialogDescription>
          </CommonDialogHeader>

          <div className="flex w-full items-center gap-2 rounded-lg border border-(--line) bg-muted/30 p-2 pl-3 shadow-[inset_0_1px_0_var(--inset-glint)]">
            <span
              className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-foreground"
              title={event?.invite_code}
            >
              {event?.invite_code}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 gap-1.5"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy invite code"}
            >
              {copied ? (
                <ClipboardCheck
                  className="size-3.5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </CommonDialogContent>
    </Dialog>
  );
}
