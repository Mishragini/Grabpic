import { fetchUser } from "#/lib/api/auth";
import { useAppDispatch } from "#/redux/hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { updateUser } from "#/redux/userSlice";
import { ScreenLoader } from "./Loaders/ScreenLoader";

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
    return <ScreenLoader loadingText="Loading your account" />;
  } else if (isError) return <div>{error.message}</div>;
  return children;
}
