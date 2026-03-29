import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "../lib/utils";
import { DropdownMenu } from "./ui/dropdown-menu";
import { MonoLabel } from "./ui/mono-label";
import { UserAvatar } from "./ui/user-avatar";

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
  const user = useQuery(api.users.getCurrentUser);
  const navigate = useNavigate();

  return (
    <header className="border-border-hard bg-bg-raised flex h-16 items-center justify-between border-b-4 px-8">
      <div className="flex items-center gap-8">
        <MonoLabel size="md" tone="accent" weight="bold">
          // CHESS_OVERDRIVE
        </MonoLabel>

        <nav className="flex items-center gap-6">
          <NavLink to="/home">DASHBOARD</NavLink>
          <NavLink to="/formation">FORMATION</NavLink>
          <NavLink to="/play">PLAY</NavLink>
        </nav>
      </div>

      <DropdownMenu
        trigger={
          <span className="group flex items-center gap-3">
            <MonoLabel
              size="xs"
              weight="bold"
              className="group-hover:text-text hidden transition-colors duration-150 sm:block"
            >
              {user?.name ?? "Player"}
            </MonoLabel>

            <UserAvatar size="sm" avatarUrl={user?.avatarUrl} name={user?.name} />
          </span>
        }
        items={[
          { label: "Profile", onClick: () => void navigate({ to: "/profile" }) },
          { label: "Sign out", onClick: () => void signOut(), variant: "danger" },
        ]}
      />
    </header>
  );
}
