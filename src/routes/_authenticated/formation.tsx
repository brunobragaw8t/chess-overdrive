import { createFileRoute } from "@tanstack/react-router";
import { PageFormation } from "../../pages/formation";

export const Route = createFileRoute("/_authenticated/formation")({
  component: PageFormation,
});
