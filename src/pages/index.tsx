import { useAuthActions } from "@convex-dev/auth/react";
import { Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "../components/ui/button";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { MonoLabel } from "../components/ui/mono-label";

export function PageIndex() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  if (isLoading) {
    return <LoadingSpinner label="AUTHENTICATING" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-0">
        <h1 className="animate-stamp font-display text-center text-[3rem] leading-[0.9] font-bold tracking-[-0.03em] text-white md:text-[4.5rem] lg:text-[8rem]">
          <span className="block" style={{ textShadow: "3px 3px 0px rgba(134, 59, 255, 0.3)" }}>
            CHESS
          </span>

          <span
            className="text-accent block"
            style={{ textShadow: "3px 3px 0px rgba(255, 255, 255, 0.1)" }}
          >
            OVERDRIVE
          </span>
        </h1>

        <div className="animate-stamp-delay-1 bg-border-hard my-6 h-0.75 w-30" />

        <p className="animate-stamp-delay-1 text-text-muted font-mono text-[13px] tracking-[0.05em] uppercase md:text-[15px]">
          PVP CHESS WITH CUSTOM FORMATIONS <span className="text-accent">&</span> UPGRADES
        </p>

        <Button onClick={() => void signIn("google")} className="animate-stamp-delay-2 mt-10">
          <FaGoogle />
          SIGN IN WITH GOOGLE
        </Button>

        <MonoLabel className="animate-stamp-delay-3 mt-12">// CHESS_OVERDRIVE v0.1 </MonoLabel>
      </div>
    </div>
  );
}
