import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Scanline } from "../components/ui/scanline";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="bg-grid overlay-noise bg-bg text-text relative min-h-dvh">
      <Scanline />
      <div className="via-accent pointer-events-none fixed inset-x-0 bottom-0 z-40 h-1 bg-linear-to-r from-transparent to-transparent" />
      <Outlet />
    </div>
  );
}
