import { createFileRoute } from "@tanstack/react-router";
import { PageGame } from "../../../pages/game";

export const Route = createFileRoute("/_authenticated/game/$gameId")({
  component: PageGame,
});
