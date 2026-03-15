import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppHeader } from "../../components/app-header";
import { Card, CardContent, CardDivider } from "../../components/ui/card";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { MonoLabel } from "../../components/ui/mono-label";

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
              <div className="relative shrink-0">
                <div className="border-border-hard bg-bg h-16 w-16 overflow-hidden border-[3px]">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="bg-bg-inset flex h-full w-full items-center justify-center">
                      <span className="font-display text-text-dim text-xl font-bold">
                        {user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-accent absolute -top-0.75 -left-0.75 h-1.5 w-1.5 border-t-2 border-l-2" />
                <div className="border-accent absolute -top-0.75 -right-0.75 h-1.5 w-1.5 border-t-2 border-r-2" />
                <div className="border-accent absolute -bottom-0.75 -left-0.75 h-1.5 w-1.5 border-b-2 border-l-2" />
                <div className="border-accent absolute -right-0.75 -bottom-0.75 h-1.5 w-1.5 border-r-2 border-b-2" />
              </div>

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
