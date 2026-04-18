import ThemeToggle from "./ThemeToggle";
import { useAppDispatch, useAppSelector } from "#/redux/hooks";
import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { logout } from "#/lib/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clearUser, selectUser } from "#/redux/userSlice";

export default function Header() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation({
    mutationFn: logout,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
      dispatch(clearUser());
      queryClient.clear();
      navigate({ to: "/login" });
    },
  });
  return (
    <header className="sticky top-0 z-50 border-b border-[--line] bg-[--header-bg] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/">
            <img src="/grabpic.svg" className="w-16 h-16 svg-logo" />
          </Link>
          <ThemeToggle />
        </div>
        <div className="min-w-0">
          {user ? (
            <div className="flex max-w-full items-center gap-2 sm:gap-4">
              <Button
                className="hover:cursor-pointer shrink-0"
                size={"sm"}
                disabled={isPending}
                onClick={() => {
                  mutate();
                }}
              >
                {isPending ? "Logging out..." : "Logout"}
              </Button>
              <div className="truncate text-sm">{user.username}</div>
              {user.avatar_url ? (
                <div>
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="h-8 w-8 rounded-full"
                  />
                </div>
              ) : (
                <div>
                  <img src="/avatar.svg" className="h-6 w-6 svg-logo" />
                </div>
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
