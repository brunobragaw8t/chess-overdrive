import { getPieceIcon, isPieceRoyal } from "../../lib/pieces";
import type { FormationSlot, PieceSummary } from "../../types/convex";
import { MonoLabel } from "../ui/mono-label";

function SlotOccupied({ piece }: { piece: PieceSummary }) {
  const isRoyal = isPieceRoyal(piece.pieceType);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={isRoyal ? "text-3xl text-amber-400" : "text-3xl text-white"}>
        {getPieceIcon(piece.pieceType) ?? "?"}
      </span>

      <MonoLabel size="xs" tone={isRoyal ? "accent" : "muted"} weight="bold">
        {piece.pieceType.toUpperCase()}
      </MonoLabel>
    </div>
  );
}

function SlotEmpty() {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-text-dim text-3xl">+</span>

      <MonoLabel size="xs" tone="dim">
        EMPTY
      </MonoLabel>
    </div>
  );
}

export function FormationGrid({ positions }: { positions: FormationSlot[] }) {
  const placedCount = positions.filter((p) => p !== null).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <MonoLabel tone="muted" tracking="wider">
          BACK ROW
        </MonoLabel>

        <MonoLabel tone="accent" weight="bold">
          {placedCount}/8 SLOTS
        </MonoLabel>
      </div>

      <div data-testid="formation-grid" className="grid grid-cols-8 gap-2">
        {positions.map((position, i) => (
          <div
            key={i}
            data-testid={`formation-slot-${i}`}
            className={
              position !== null
                ? "border-border-hard bg-bg flex min-h-24 flex-col items-center justify-center border-2 p-2"
                : "border-border flex min-h-24 flex-col items-center justify-center border-2 border-dashed p-2"
            }
          >
            {position !== null ? <SlotOccupied piece={position} /> : <SlotEmpty />}
          </div>
        ))}
      </div>
    </div>
  );
}
