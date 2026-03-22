import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getPieceIcon, isPieceRoyal } from "../../lib/pieces";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardDivider } from "../ui/card";
import { MonoLabel } from "../ui/mono-label";
import type { PieceType } from "../../constants/pieces";

function MiniSlot({ slot }: { slot: { pieceType: PieceType } | null }) {
  if (slot === null) {
    return (
      <div className="border-border flex h-9 w-9 items-center justify-center border border-dashed sm:h-10 sm:w-10">
        <span className="text-text-dim text-[10px]">&middot;</span>
      </div>
    );
  }

  const isRoyal = isPieceRoyal(slot.pieceType);

  return (
    <div
      className={cn(
        "border-border-hard bg-bg flex h-9 w-9 items-center justify-center border-2 sm:h-10 sm:w-10",
        isRoyal && "border-accent/50 bg-accent/5",
      )}
    >
      <span className={cn("text-base sm:text-lg", isRoyal ? "text-amber-400" : "text-text")}>
        {getPieceIcon(slot.pieceType) ?? "?"}
      </span>
    </div>
  );
}

export function FormationSummaryCard() {
  const formation = useQuery(api.formations.getFormation);

  if (formation === undefined) {
    return (
      <Card className="animate-stamp" style={{ animationDelay: "100ms" }}>
        <CardContent className="flex min-h-30 flex-col items-center justify-center">
          <div className="bg-border h-3 w-32 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (formation === null) {
    return (
      <Card className="animate-stamp" style={{ animationDelay: "100ms" }}>
        <CardContent className="flex min-h-30 flex-col items-center justify-center">
          <MonoLabel tone="dim" tracking="wider">
            NO FORMATION
          </MonoLabel>
        </CardContent>
      </Card>
    );
  }

  const placedCount = formation.positions.filter((p) => p !== null).length;

  return (
    <Card
      className="animate-stamp border-t-accent/40 border-t-2"
      style={{ animationDelay: "100ms" }}
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <MonoLabel tone="muted" tracking="wider">
            // FORMATION
          </MonoLabel>

          <MonoLabel tone="accent" weight="bold">
            {placedCount}/8 SLOTS
          </MonoLabel>
        </div>

        <div className="mt-4 flex justify-center gap-1">
          {formation.positions.map((slot, i) => (
            <MiniSlot key={i} slot={slot} />
          ))}
        </div>

        <CardDivider className="my-4" />

        <Link
          to="/formation"
          className={cn(
            "border-accent/60 text-text-muted hover:text-accent hover:border-accent hover:shadow-[0_0_12px_rgba(134,59,255,0.2)]",
            "flex items-center justify-center gap-2 border-2 px-5 py-2 font-mono text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-150",
          )}
        >
          EDIT FORMATION
        </Link>
      </CardContent>
    </Card>
  );
}
