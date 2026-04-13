import { Button } from "#/components/ui/button";
import { useCallback, useEffect, useMemo } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
} from "react-hook-form";
import { XIcon } from "lucide-react";

function PhotoThumbnail({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-background">
      <img src={objectUrl} alt={file.name} className="size-full object-cover" />
      <Button
        type="button"
        size="icon-sm"
        onClick={onRemove}
        variant="secondary"
        className="absolute top-1 right-1 size-7 rounded-full border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Remove ${file.name}`}
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}

export function Thumbnails<T extends FieldValues & { photos: File[] }>({
  photos,
  setValue,
}: {
  photos: File[];
  setValue: UseFormSetValue<T>;
}) {
  const removePhoto = useCallback(
    (index: number) => {
      const filtered_photos = photos.filter((_, i) => i !== index);
      setValue("photos" as Path<T>, filtered_photos as PathValue<T, Path<T>>);
    },
    [photos, setValue],
  );
  return (
    <div className="space-y-2">
      <p className="island-kicker">Selected</p>
      <div className="max-h-40 overflow-y-auto rounded-xl border border-border/80 bg-muted/15 p-3">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((file, index) => (
            <PhotoThumbnail
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removePhoto(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
