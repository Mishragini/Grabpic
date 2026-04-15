import { cn } from "#/lib/utils";

export function GallerySection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rise-in border-t border-border/70 pt-6", className)}
    >
      {children}
    </section>
  );
}
