import { useAppSelector } from "#/redux/hooks";
import { selectUser } from "#/redux/userSlice";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_protected/")({ component: App });

function App() {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      user.role === "organizer"
        ? navigate({ to: "/organizer/dashboard" })
        : navigate({ to: "/attendee/invite" });
    }
  }, [user]);
}
