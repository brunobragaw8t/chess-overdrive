import { getPieceIcon } from "../../lib/pieces";
import type { PieceSummary } from "../../types/convex";
import { MonoLabel } from "../ui/mono-label";

export function InventoryPanel({ pieces }: { pieces: PieceSummary[] }) {
  const grouped = new Map<PieceSummary["pieceType"], number>();
  for (const piece of pieces) {
    grouped.set(piece.pieceType, (grouped.get(piece.pieceType) ?? 0) + 1);
  }

  return (
    <div data-testid="inventory-panel">
      <MonoLabel tone="muted" tracking="wider">
        INVENTORY
      </MonoLabel>

      {[...grouped.entries()].length === 0 ? (
        <div className="border-border mt-4 flex items-center justify-center border-2 border-dashed p-6">
          <MonoLabel size="xs" tone="dim">
            ALL PIECES PLACED
          </MonoLabel>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {[...grouped.entries()].map(([type, count]) => (
            <div
              key={type}
              className="border-border-hard bg-bg flex items-center gap-3 border-2 px-4 py-3"
            >
              <span className="text-2xl text-white">{getPieceIcon(type) ?? "?"}</span>

              <div className="flex flex-col">
                <MonoLabel size="xs" weight="bold">
                  {type.toUpperCase()}
                </MonoLabel>

                <MonoLabel size="xs" tone="accent">
                  {count}
                </MonoLabel>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
