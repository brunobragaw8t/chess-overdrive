import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";

export const Route = createFileRoute("/")({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-5xl font-bold tracking-tight">Chess Overdrive</h1>

      <p className="text-lg text-gray-600">PvP chess with formations and upgrades</p>

      <button
        type="button"
        onClick={() => void signIn("google")}
        className="rounded-lg bg-white px-6 py-3 text-lg font-medium text-gray-700 shadow-md ring-1 ring-gray-300 transition-colors hover:bg-gray-50"
      >
        Sign in with Google
      </button>
    </div>
  );
}
