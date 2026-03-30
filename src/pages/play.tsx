import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { AppHeader } from "../components/app-header";
import { Button } from "../components/ui/button";
import { MonoLabel } from "../components/ui/mono-label";

export function PagePlay() {
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const createLobby = useMutation(api.lobbies.createLobby);

  async function handleCreate() {
    setIsCreating(true);

    try {
      const lobbyId = await createLobby();
      navigate({ to: "/lobby/$lobbyId", params: { lobbyId } });
    } catch {
      setIsCreating(false);
    }
  }

  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const createBotGame = useMutation(api.lobbies.createBotGame);

  async function handleCreateBot() {
    setIsCreatingBot(true);

    try {
      const gameId = await createBotGame();
      navigate({ to: "/game/$gameId", params: { gameId } });
    } catch {
      setIsCreatingBot(false);
    }
  }

  const isBusy = isCreating || isCreatingBot;

  return (
    <>
      <AppHeader />

      <main className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-8">
        <MonoLabel className="animate-stamp" tone="dim" tracking="widest">
          // INITIATE_MATCH
        </MonoLabel>

        <h1
          className="animate-stamp-delay-1 font-display mt-4 text-center text-[3rem] leading-[0.9] font-bold tracking-[-0.03em] text-white md:text-[4.5rem]"
          style={{ textShadow: "3px 3px 0px rgba(134, 59, 255, 0.3)" }}
        >
          CREATE A<br />
          <span className="text-accent">LOBBY</span>
        </h1>

        <div className="animate-stamp-delay-2 bg-border-hard my-8 h-0.75 w-30" />

        <p className="animate-stamp-delay-2 text-text-dim mb-10 max-w-sm text-center font-mono text-[12px] leading-relaxed tracking-[0.05em] uppercase">
          Invite a friend to challenge your formation.
          <br />
          Host plays white. Guest plays black.
        </p>

        <div className="animate-stamp-delay-3 flex flex-col items-center gap-4">
          <Button onClick={handleCreate} disabled={isBusy} className="px-12 py-5 text-[15px]">
            {isCreating ? "Creating..." : "Create lobby"}
          </Button>

          <Button variant="ghost" onClick={handleCreateBot} disabled={isBusy}>
            {isCreatingBot ? "Creating..." : "Play vs Bot"}
          </Button>
        </div>
      </main>
    </>
  );
}
