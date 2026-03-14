import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_authenticated/home")({
  component: RootComponent,
});

function RootComponent() {
  const user = useQuery(api.users.getCurrentUser);
  const { signOut } = useAuthActions();

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Chess Overdrive</h1>

      <p className="text-lg text-gray-600">Welcome, {user?.name ?? "Player"}!</p>

      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
      >
        Sign out
      </button>
    </div>
  );
}
