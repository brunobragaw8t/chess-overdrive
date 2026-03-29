import { createFileRoute } from "@tanstack/react-router";
import { PageLobby } from "../../../pages/lobby";

export const Route = createFileRoute("/_authenticated/lobby/$lobbyId")({
  component: PageLobby,
});
