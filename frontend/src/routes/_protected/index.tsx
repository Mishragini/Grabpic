import { Button } from "#/components/ui/button";
import { Role } from "#/lib/types/type";
import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Images, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_protected/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: "Grabpic — Event photos, shared simply",
      },
      {
        name: "description",
        content:
          "Collect and share event photos with attendees. Built for organizers and guests.",
      },
    ],
  }),
});

const features = [
  {
    icon: Camera,
    title: "Capture the moment",
    body: "Guests find their shots with a quick selfie match—no endless scrolling.",
  },
  {
    icon: Images,
    title: "One gallery per event",
    body: "Organizers curate uploads and keep every album in one calm place.",
  },
  {
    icon: Sparkles,
    title: "Ready when you are",
    body: "Sign in, create an event, and share the link. That’s the whole idea.",
  },
] as const;

function LandingPage() {
  const user = useAppSelector(selectUser);
  return (
    <main className="page-wrap pb-20 pt-12 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-2xl px-1 text-center sm:px-0">
        <p className="island-kicker mb-4">Event photography</p>
        <h1 className="display-title text-[clamp(2.25rem,5vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.03em] text-[--sea-ink]">
          Photos from your event,
          <span className="mt-1 block text-[--sea-ink-soft]">
            without the chaos.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-[--sea-ink-soft] sm:text-base">
          Grabpic helps organizers share galleries and helps guests find their
          pictures—fast, friendly, and clutter-free.
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          {!user && (
            <>
              <Link to="/login" className="sm:w-auto">
                <Button className="w-full min-w-40 sm:w-auto">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" className="sm:w-auto">
                <Button variant="outline" className="w-full min-w-40 sm:w-auto">
                  Sign up
                </Button>
              </Link>
            </>
          )}
          {user?.role === Role.organizer && (
            <Link to="/organizer/dashboard" className="sm:w-auto">
              <Button className="w-full min-w-40 sm:w-auto">
                Go to dashboard
              </Button>
            </Link>
          )}
          {user?.role === Role.attendee && (
            <Link to="/attendee/invite" className="sm:w-auto">
              <Button className="w-full min-w-40 sm:w-auto">
                Join event
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-4xl border-t border-[--line] pt-16 sm:mt-24 sm:pt-20">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="island-shell rounded-2xl px-6 py-7 text-left"
            >
              <Icon
                className="mb-5 size-4.5 text-[--sea-ink-soft]"
                strokeWidth={1.5}
                aria-hidden
              />
              <h2 className="text-[0.9375rem] font-semibold tracking-tight text-[--sea-ink]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[--sea-ink-soft]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
