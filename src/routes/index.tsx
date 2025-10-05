import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/auth";
import { LoginForm } from "~/components/LoginForm";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <LoginForm onSuccess={() => window.location.href = "/dashboard"} />;
}
