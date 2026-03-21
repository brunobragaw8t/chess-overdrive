import type { Id } from "../../../convex/_generated/dataModel";
import { getPieceIcon } from "../../lib/pieces";
import { cn } from "../../lib/utils";
import type { PieceSummary } from "../../types/convex";
import { MonoLabel } from "../ui/mono-label";

interface InventoryPanelProps {
  pieces: PieceSummary[];
  onSelectPiece?: (pieceId: Id<"pieces"> | null) => void;
  selectedPieceId?: Id<"pieces"> | null;
}

export function InventoryPanel({ pieces, onSelectPiece, selectedPieceId }: InventoryPanelProps) {
  const groups = new Map<PieceSummary["pieceType"], PieceSummary[]>();
  for (const piece of pieces) {
    const group = groups.get(piece.pieceType) ?? [];
    group.push(piece);
    groups.set(piece.pieceType, group);
  }

  const selectedType = selectedPieceId
    ? (pieces.find((p) => p._id === selectedPieceId)?.pieceType ?? null)
    : null;

  return (
    <div data-testid="inventory-panel">
      <MonoLabel tone="muted" tracking="wider">
        INVENTORY
      </MonoLabel>

      {[...groups.entries()].length === 0 ? (
        <div className="border-border mt-4 flex items-center justify-center border-2 border-dashed p-6">
          <MonoLabel size="xs" tone="dim">
            ALL PIECES PLACED
          </MonoLabel>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {[...groups.entries()].map(([type, groupPieces]) => {
            const isSelected = type === selectedType;
            const groupFirstPieceId = groupPieces[0]._id;

            return (
              <div
                key={type}
                data-testid={`inventory-group-${type}`}
                className={cn(
                  "border-border-hard bg-bg flex cursor-pointer items-center gap-3 border-2 px-4 py-3 transition-all duration-150",
                  isSelected && "border-accent ring-accent/40 ring-2",
                )}
                onClick={() => {
                  if (!onSelectPiece) return;
                  onSelectPiece(isSelected ? null : groupFirstPieceId);
                }}
              >
                <span className="text-2xl text-white">{getPieceIcon(type) ?? "?"}</span>

                <div className="flex flex-col">
                  <MonoLabel size="xs" weight="bold">
                    {type.toUpperCase()}
                  </MonoLabel>

                  <MonoLabel size="xs" tone="accent">
                    {groupPieces.length}
                  </MonoLabel>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
