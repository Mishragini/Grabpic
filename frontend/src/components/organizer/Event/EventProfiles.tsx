import { Profiles } from "../Profiles";

export function EventProfiles({ event_id }: { event_id: string }) {
  return (
    <div>
      <Profiles event_id={event_id} per_page={10} />
    </div>
  );
}
