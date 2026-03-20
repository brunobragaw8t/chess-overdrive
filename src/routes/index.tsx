import { createFileRoute } from "@tanstack/react-router";
import { PageIndex } from "../pages";

export const Route = createFileRoute("/")({
  component: PageIndex,
});
