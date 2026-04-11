import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { cn } from "#/lib/utils";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { type UseFormSetValue } from "react-hook-form";

interface StepTwoProps {
  setValue: UseFormSetValue<{
    name: string;
    photos: File[];
  }>;
  photos: File[];
}

export function StepTwo({ setValue, photos }: StepTwoProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log("photos...", photos);
      setValue("photos", [...photos, ...acceptedFiles]);
    },
    [photos],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return (
    <>
      <DialogHeader className="gap-1.5 text-left">
        <DialogTitle className="display-title text-lg font-medium tracking-tight">
          Add photos
        </DialogTitle>
        <DialogDescription>
          Drag in files or click to browse. You can add more than one.
        </DialogDescription>
      </DialogHeader>
      <div
        {...getRootProps()}
        className={cn(
          "island-shell cursor-pointer rounded-xl px-6 py-10 text-center transition-colors",
          isDragActive
            ? "border-primary/40 ring-2 ring-ring/30"
            : "hover:border-foreground/20",
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-foreground">
          Drop images here or{" "}
          <span className="text-foreground underline decoration-border underline-offset-2">
            browse
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, JPG, GIF, WebP — multiple files supported
        </p>
      </div>
    </>
  );
}
