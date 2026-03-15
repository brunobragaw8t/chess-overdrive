import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppHeader } from "../../components/app-header";
import { Card, CardContent, CardDivider } from "../../components/ui/card";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { MonoLabel } from "../../components/ui/mono-label";
import { UserAvatar } from "../../components/ui/user-avatar";

export const Route = createFileRoute("/_authenticated/home")({
  component: RootComponent,
});

const placeholderCards = ["FORMATIONS", "MATCHMAKING", "UPGRADES", "MATCH HISTORY"] as const;

function RootComponent() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return <LoadingSpinner label="LOADING_USER_DATA" />;
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-240 px-8 py-16">
        <Card className="animate-stamp border-l-accent border-l-4">
          <CardContent>
            <div className="flex items-center gap-6">
              <UserAvatar size="md" avatarUrl={user?.avatarUrl} name={user?.name} />

              <div className="min-w-0">
                <MonoLabel size="md" tone="muted" tracking="wider">
                  WELCOME BACK,
                </MonoLabel>

                <h1 className="font-display mt-1 truncate text-[3rem] leading-tight font-bold tracking-[-0.02em] text-white">
                  {user?.name ?? "Player"}
                </h1>
              </div>
            </div>

            <CardDivider className="my-6" />

            <div>
              <MonoLabel>STATUS: </MonoLabel>
              <MonoLabel tone="success">ONLINE</MonoLabel>
              <MonoLabel> // </MonoLabel>
              <MonoLabel tone="muted">UNRANKED</MonoLabel>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {placeholderCards.map((label, i) => (
            <div
              key={label}
              className="animate-stamp border-border hover:border-accent/30 flex min-h-30 flex-col items-center justify-center border-2 border-dashed p-6 transition-colors duration-200"
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              <MonoLabel tracking="wider">{label}</MonoLabel>

              <div className="border-border mt-3 border-t pt-3">
                <MonoLabel size="xs">{`COMING SOON`}</MonoLabel>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
