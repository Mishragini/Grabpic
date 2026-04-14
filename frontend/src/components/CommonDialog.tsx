import { cn } from "#/lib/utils";
import type { ComponentProps } from "react";
import { Button } from "./ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface DialogCompProps {
  children: React.ReactNode;
  className?: string;
}
function CommonDialogTrigger({ children, className }: DialogCompProps) {
  return (
    <DialogTrigger
      className={cn(
        "h-auto shrink-0 px-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:bg-transparent! hover:text-foreground hover:underline hover:cursor-pointer",
        className,
      )}
    >
      {children}
    </DialogTrigger>
  );
}

function ButtonDialogTrigger({
  children,
  className,
  ...buttonProps
}: Omit<ComponentProps<typeof Button>, "asChild">) {
  return (
    <DialogTrigger asChild>
      <Button className={cn("cursor-pointer", className)} {...buttonProps}>
        {children}
      </Button>
    </DialogTrigger>
  );
}

function DialogStep({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <div className={cn(step < totalSteps && "border-b border-border/70 pb-4")}>
      <p className="island-kicker">
        Step {step + 1} of {totalSteps}
      </p>
      {step < totalSteps && (
        <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/25 transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

function CommonDialogContent({ children, className }: DialogCompProps) {
  return (
    <DialogContent
      className={cn("gap-0 overflow-hidden p-0 sm:max-w-lg", className)}
    >
      {children}
    </DialogContent>
  );
}

function CommonDialogFooter({ children, className }: DialogCompProps) {
  return (
    <DialogFooter
      className={cn(
        "m-0 rounded-none border-border/80 bg-muted/40 px-6 py-4 sm:rounded-b-xl",
        className,
      )}
    >
      {children}
    </DialogFooter>
  );
}

function CommonDialogHeader({ children, className }: DialogCompProps) {
  return (
    <DialogHeader className={cn("gap-1.5 text-left", className)}>
      {children}
    </DialogHeader>
  );
}

function CommonDialogTitle({ children, className }: DialogCompProps) {
  return (
    <DialogTitle
      className={cn(
        "display-title text-lg font-medium tracking-tight",
        className,
      )}
    >
      {children}
    </DialogTitle>
  );
}

function CommonDialogDescription({ children, className }: DialogCompProps) {
  return (
    <DialogDescription className={cn("mt-1.5 text-pretty", className)}>
      {children}
    </DialogDescription>
  );
}

export {
  CommonDialogTrigger,
  ButtonDialogTrigger,
  DialogStep,
  CommonDialogContent,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogTitle,
  CommonDialogDescription,
};
