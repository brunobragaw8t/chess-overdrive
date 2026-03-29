import { createFileRoute } from "@tanstack/react-router";
import { PagePlay } from "../../pages/play";

export const Route = createFileRoute("/_authenticated/play")({
  component: PagePlay,
});
