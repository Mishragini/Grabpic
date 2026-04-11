import { fetchUser } from "#/lib/api/auth";
import { useAppDispatch } from "#/redux/hooks";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { updateUser } from "#/redux/userSlice";

interface ProtectedRouteProps {
  children: ReactNode;
}
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const { isLoading, data, isError, error } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await fetchUser();
      return data;
    },
  });
  useEffect(() => {
    if (data) {
      const { id: user_id, username, avatar_url, role } = data;
      dispatch(updateUser({ user_id, username, avatar_url, role }));
    }
  }, [data]);
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] w-full flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="size-7 animate-spin text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Loading your account
          </p>
        </div>
      </div>
    );
  }
  else if (isError) return <div>{error.message}</div>;
  return children;
}
