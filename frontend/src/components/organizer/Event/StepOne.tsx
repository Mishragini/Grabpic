import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface StepOneProps {
  register: UseFormRegister<{
    name: string;
    photos: File[];
  }>;
  errors: FieldErrors<{
    name: string;
  }>;
}

export function StepOne({ register, errors }: StepOneProps) {
  return (
    <>
      <DialogHeader className="gap-1.5 text-left">
        <DialogTitle className="display-title text-lg font-medium tracking-tight">
          New event
        </DialogTitle>
        <DialogDescription>
          Choose a name guests will recognize.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label className="text-foreground" htmlFor="event-name">
          Event name
        </Label>
        <Input
          id="event-name"
          autoComplete="off"
          placeholder="e.g. Annual meetup 2026"
          {...register("name")}
          required
        />
        {errors.name?.message && (
          <p className="text-xs text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>
    </>
  );
}
