import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { login } from "#/lib/api/auth";
import { useAppDispatch } from "#/redux/hooks";
import { updateUser } from "#/redux/userSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const loginSchema = z.object({
  username: z.string().min(3, "Username should be at least 3 characters"),
  password: z
    .string()
    .min(8, "Password must be 8 characters long.")
    .regex(/[A-Z]/, "Password must have at least one uppercase letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a special character")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});

type loginSchema = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/_auth/login")({
  component: LoginComponent,
});
function LoginComponent() {
  const loadingToastId = useRef<null | number | string>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (data: loginSchema) => login(data),
    onError: (error) => {
      loadingToastId.current && toast.dismiss(loadingToastId.current);
      toast.error(error.message);
      loadingToastId.current = null;
    },
    onSuccess: () => {
      loadingToastId.current && toast.dismiss(loadingToastId.current);
      toast.success("Logged in!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate({ to: "/" });
      loadingToastId.current = null;
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<loginSchema>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLogin: SubmitHandler<{
    username: string;
    password: string;
  }> = (data) => {
    loadingToastId.current = toast.loading("Logging in...");
    mutate(data);
  };
  return (
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <form
        onSubmit={handleSubmit(handleLogin)}
        className="w-full max-w-md space-y-4"
      >
        <div className="text-center text-4xl font-semibold">Welcome Back!</div>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input {...register("username")} required />
          {errors.username?.message && (
            <p className="text-destructive">{errors.username?.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" {...register("password")} required />
          {errors.password?.message && (
            <p className="text-destructive">{errors.password?.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
