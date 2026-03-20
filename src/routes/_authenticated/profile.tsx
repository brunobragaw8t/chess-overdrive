import { createFileRoute } from "@tanstack/react-router";
import { PageProfile } from "../../pages/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  component: PageProfile,
});
