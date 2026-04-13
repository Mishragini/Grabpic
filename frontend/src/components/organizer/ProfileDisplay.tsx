import type { Profile } from "#/lib/types/type";

interface DisplayProfileProps {
  count: number;
  profiles: Profile[];
  hasMore: Boolean;
}
export function DisplayProfile({
  count,
  profiles,
  hasMore,
}: DisplayProfileProps) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center overflow-hidden shrink-0 -space-x-2">
        {profiles.map((profile: Profile, i: number) => (
          <img
            key={profile.id}
            src={profile.photo_url}
            alt=""
            className="relative size-9 shrink-0 rounded-full border-(--foam) object-cover shadow-sm"
            style={{ zIndex: count - i }}
          />
        ))}
        {hasMore && (
          <span
            className="inline-flex h-9 shrink-0 items-center px-2.5 text-[0.65rem] font-medium  text-muted-foreground"
            title="Additional face profiles in this event"
          >
            + more
          </span>
        )}
      </div>
    </>
  );
}
