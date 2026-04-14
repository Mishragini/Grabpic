import {
  CommonDialogDescription,
  CommonDialogHeader,
  CommonDialogTitle,
} from "#/components/CommonDialog";
import { cn } from "#/lib/utils";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormSetValue,
} from "react-hook-form";

interface StepTwoProps<T extends FieldValues & { photos: File[] }> {
  setValue: UseFormSetValue<T>;
  photos: File[];
}

export function StepTwo<T extends FieldValues & { photos: File[] }>({
  setValue,
  photos,
}: StepTwoProps<T>) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setValue(
        "photos" as Path<T>,
        [...photos, ...acceptedFiles] as PathValue<T, Path<T>>,
      );
    },
    [photos],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return (
    <div className="p-4 space-y-2">
      <CommonDialogHeader>
        <CommonDialogTitle>Add photos</CommonDialogTitle>
        <CommonDialogDescription>
          Drag in files or click to browse. You can add more than one.
        </CommonDialogDescription>
      </CommonDialogHeader>
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
    </div>
  );
}
