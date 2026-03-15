import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { MonoLabel } from "./ui/mono-label";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const router = useRouterState();
  const isActive = router.location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "font-mono text-[11px] font-bold tracking-[0.15em] uppercase transition-colors duration-150",
        isActive ? "text-accent" : "text-text-muted hover:text-text",
      )}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const { signOut } = useAuthActions();

  return (
    <header className="border-border-hard bg-bg-raised flex h-16 items-center justify-between border-b-4 px-8">
      <div className="flex items-center gap-8">
        <MonoLabel size="md" tone="accent" weight="bold">
          // CHESS_OVERDRIVE
        </MonoLabel>

        <nav className="flex items-center gap-6">
          <NavLink to="/home">DASHBOARD</NavLink>
          <NavLink to="/profile">PROFILE</NavLink>
        </nav>
      </div>

      <Button variant="danger" size="sm" onClick={() => void signOut()}>
        SIGN OUT
      </Button>
    </header>
  );
}
