import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppHeader } from "../components/app-header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDivider } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { MonoLabel } from "../components/ui/mono-label";

export function PageLobby() {
  const params = useParams({
    from: "/_authenticated/lobby/$lobbyId",
  });
  const lobbyId = params.lobbyId as Id<"lobbies">;
  const lobby = useQuery(api.lobbies.getLobby, { lobbyId });

  const [error, setError] = useState<string | null>();

  const joinLobby = useMutation(api.lobbies.joinLobby);
  const joinAttempted = useRef(false);
  const handleJoin = useCallback(() => {
    try {
      joinLobby({ lobbyId });
    } catch (e) {
      if (e instanceof ConvexError) {
        setError(e.message);
        return;
      }

      setError("Could not join lobby");
    }
  }, [joinLobby, lobbyId]);

  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  // Auto-join for non-host visitors
  useEffect(() => {
    if (!lobby || lobby.isHost || lobby.status !== "waiting" || joinAttempted.current) return;
    joinAttempted.current = true;

    handleJoin();
  }, [lobby, handleJoin]);

  // Redirect to game when lobby becomes active
  useEffect(() => {
    if (lobby?.status === "active" && lobby.gameId) {
      navigate({ to: "/game/$gameId", params: { gameId: lobby.gameId } });
    }
  }, [lobby, navigate]);

  if (lobby === undefined) {
    return <LoadingSpinner label="LOADING_LOBBY" />;
  }

  if (lobby === null) {
    return (
      <>
        <AppHeader />

        <main className="mx-auto max-w-240 px-8 py-16">
          <Card className="animate-stamp border-l-danger border-l-4">
            <CardContent>
              <MonoLabel size="md" tone="muted" tracking="wider">
                LOBBY NOT FOUND
              </MonoLabel>

              <p className="text-text-muted mt-3 font-mono text-sm">
                This lobby does not exist or has already been closed.
              </p>

              <CardDivider className="my-6" />

              <Link to="/play">
                <Button size="sm" variant="ghost">
                  Back to Play
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const inviteUrl = `${window.location.origin}/lobby/${lobbyId}`;

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-240 px-8 py-16">
        <MonoLabel size="md" tone="muted" tracking="wider">
          // LOBBY
        </MonoLabel>

        {error && (
          <Card className="animate-stamp border-l-danger mt-6 border-l-4">
            <CardContent>
              <MonoLabel tone="muted">{error}</MonoLabel>

              <CardDivider className="my-4" />

              <Link to="/play">
                <Button size="sm" variant="ghost">
                  Back to Play
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {lobby.isHost && lobby.status === "waiting" && (
          <Card className="animate-stamp border-l-accent mt-6 border-l-4">
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-accent h-2 w-2 animate-pulse rounded-full" />

                <MonoLabel size="md" tone="accent" weight="bold" tracking="wider">
                  WAITING FOR OPPONENT
                </MonoLabel>
              </div>

              <CardDivider className="my-6" />

              <div className="mb-2">
                <MonoLabel size="xs" tone="dim">
                  INVITE_LINK
                </MonoLabel>
              </div>

              <div className="flex items-center gap-3">
                <input
                  data-testid="invite-link-input"
                  readOnly
                  value={inviteUrl}
                  className="bg-bg-inset border-border-hard text-text-muted flex-1 border-2 px-4 py-3 font-mono text-[13px] tracking-wide focus:outline-none"
                />

                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <p className="text-text-dim mt-4 font-mono text-[11px]">
                Share this link with a friend. The game starts when they join.
              </p>
            </CardContent>
          </Card>
        )}

        {!lobby.isHost && lobby.status === "waiting" && !error && (
          <div className="mt-6">
            <LoadingSpinner label="JOINING_LOBBY" />
          </div>
        )}
      </main>
    </>
  );
}
