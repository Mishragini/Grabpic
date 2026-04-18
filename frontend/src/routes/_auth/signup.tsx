import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { signup } from "#/lib/api/auth";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRef } from "react";

const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one capital letter")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol")
      .regex(/[0-9]/, "Password must contain at least one digit"),
    confirmPassword: z.string(),
    fullName: z.string().min(1, "Full name is required."),
    email: z.email("Invalid email address"),
    role: z.enum(["organizer", "attendee"]),
    image: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type signupSchema = z.infer<typeof signupSchema>;

export const Route = createFileRoute("/_auth/signup")({
  component: SignupComponent,
});

export default function SignupComponent() {
  const navigate = useNavigate();
  const loadingToastId = useRef<string | number | null>(null);
  const { isPending, mutate } = useMutation({
    mutationFn: (formData: FormData) => signup(formData),
    onError: (error) => {
      loadingToastId.current && toast.dismiss(loadingToastId.current);
      toast.error(error.message);
      loadingToastId.current = null;
    },
    onSuccess: () => {
      loadingToastId.current && toast.dismiss(loadingToastId.current);
      toast.success("Account Created!");
      loadingToastId.current = null;
      navigate({ to: "/" });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<signupSchema>({
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      confirmPassword: "",
      role: "organizer",
      image: undefined,
    },
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<signupSchema> = async (data) => {
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("password", data.password);
    formData.append("full_name", data.fullName);
    formData.append("email", data.email);
    formData.append("role", data.role);

    if (data.image) {
      formData.append("image", data.image);
    }
    loadingToastId.current = toast.loading("Creating account.");
    mutate(formData);
  };

  return (
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <form
        className="w-full max-w-md space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="text-center text-4xl font-semibold">Welcome!</div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            {...register("fullName")}
            placeholder="John Doe"
            required
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            {...register("username")}
            placeholder="johndoe"
            required
          />
          {errors.username && (
            <p className="text-sm text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            required
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="********"
            minLength={6}
            required
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="********"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            {...register("role")}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="organizer">Organizer</option>
            <option value="attendee">Attendee</option>
          </select>
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar (optional)</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setValue("image", file);
            }}
          />
        </div>

        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Creating account..." : "Sign up"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
