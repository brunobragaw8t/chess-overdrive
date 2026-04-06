import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppHeader } from "../components/app-header";
import { GameBoard } from "../components/game/game-board";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDivider } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { MonoLabel } from "../components/ui/mono-label";

export function PageGame() {
  const params = useParams({ from: "/_authenticated/game/$gameId" });
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.games.getGame, { gameId });

  const submitMove = useMutation(api.games.submitMove);

  const heartbeat = useMutation(api.games.heartbeat);

  useEffect(() => {
    if (!game || game.status !== "active") return;

    heartbeat({ gameId });

    const interval = setInterval(() => {
      heartbeat({ gameId });
    }, 10_000);

    return () => clearInterval(interval);
  }, [game, gameId, heartbeat]);

  if (game === undefined) {
    return <LoadingSpinner label="LOADING_GAME" />;
  }

  if (game === null) {
    return (
      <>
        <AppHeader />

        <main className="mx-auto max-w-240 px-8 py-16">
          <p>Game not found</p>
        </main>
      </>
    );
  }

  const isMyTurn = game.callerColor === game.currentTurn && game.status === "active";

  const playerName = game.callerColor === "white" ? game.whitePlayerName : game.blackPlayerName;
  const opponentName = game.callerColor === "white" ? game.blackPlayerName : game.whitePlayerName;

  const isFinished = game.status === "finished";
  const didWin =
    isFinished &&
    ((game.callerColor === "white" && game.result === "white_wins") ||
      (game.callerColor === "black" && game.result === "black_wins"));

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-240 px-8 py-16">
        <div className="flex flex-col items-center gap-4">
          {/* Turn indicator */}
          {game.status === "active" && (
            <div className="flex items-center gap-3">
              {isMyTurn && <div className="bg-accent h-2 w-2 animate-pulse rounded-full" />}

              <MonoLabel
                size="md"
                tone={isMyTurn ? "accent" : "muted"}
                weight="bold"
                tracking="wider"
              >
                {isMyTurn ? "YOUR TURN" : "WAITING FOR OPPONENT"}
              </MonoLabel>
            </div>
          )}

          {/* Game-over banner */}
          {isFinished && (
            <Card
              className={`animate-stamp w-full max-w-md border-l-4 ${didWin ? "border-l-success" : "border-l-danger"}`}
            >
              <CardContent>
                <h2
                  className={`font-display text-2xl font-bold tracking-wide ${didWin ? "text-success" : "text-danger"}`}
                >
                  {didWin ? "YOU WIN" : "YOU LOSE"}
                </h2>

                <CardDivider className="my-4" />

                <Link to="/home">
                  <Button size="sm" variant="ghost">
                    Back to Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Opponent name (top) */}
          <MonoLabel data-testid="opponent-name" size="sm" tone="muted" tracking="wide">
            {opponentName}
          </MonoLabel>

          {/* Board */}
          <GameBoard game={game} gameId={gameId} submitMove={submitMove} />

          {/* Player name (bottom) */}
          <MonoLabel data-testid="player-name" size="sm" tone="accent" tracking="wide">
            {playerName}
          </MonoLabel>
        </div>
      </main>
    </>
  );
}
