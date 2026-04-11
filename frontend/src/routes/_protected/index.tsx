import { useAppSelector } from "#/redux/hooks";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_protected/")({ component: App });

function App() {
  const user = useAppSelector((state) => state.user.value);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      user.role === "organizer"
        ? navigate({ to: "/dashboard" })
        : navigate({ to: "/selfie" });
    }
  }, [user]);
}
