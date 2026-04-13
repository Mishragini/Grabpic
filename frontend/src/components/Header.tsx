import ThemeToggle from "./ThemeToggle";
import { useAppDispatch, useAppSelector } from "#/redux/hooks";
import { Button } from "./ui/button";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "#/lib/api/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { clearUser, selectUser } from "#/redux/userSlice";

export default function Header() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isPending, mutate } = useMutation({
    mutationFn: logout,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
      dispatch(clearUser());
      navigate({ to: "/login" });
    },
  });
  return (
    <header className="sticky top-0 z-50 border-b border-[--line] bg-[--header-bg] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex justify-between flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <ThemeToggle />
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <Button
                className="hover:cursor-pointer"
                size={"sm"}
                disabled={isPending}
                onClick={() => {
                  mutate();
                }}
              >
                {isPending ? "Logging out..." : "Logout"}
              </Button>
              <div>{user.username}</div>
              {user.avatar_url ? (
                <div>
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="h-8 w-8 rounded-full"
                  />
                </div>
              ) : (
                <div></div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate({ to: "/login" })}>Login</Button>
              <Button onClick={() => navigate({ to: "/signup" })}>
                Signup
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
