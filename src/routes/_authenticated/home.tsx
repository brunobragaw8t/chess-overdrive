import { createFileRoute } from "@tanstack/react-router";
import { PageHome } from "../../pages/home";

export const Route = createFileRoute("/_authenticated/home")({
  component: PageHome,
});
