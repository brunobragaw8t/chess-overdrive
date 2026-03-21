import { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { getPieceIcon, isPieceRoyal } from "../../lib/pieces";
import type { FormationSlot, PieceSummary } from "../../types/convex";
import { MonoLabel } from "../ui/mono-label";

interface SlotOccupiedProps {
  piece: PieceSummary;
  index: number;
  onRemove?: (index: number) => void;
}

function SlotOccupied({ piece, index, onRemove }: SlotOccupiedProps) {
  const isRoyal = isPieceRoyal(piece.pieceType);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={isRoyal ? "text-3xl text-amber-400" : "text-3xl text-white"}>
        {getPieceIcon(piece.pieceType) ?? "?"}
      </span>

      <MonoLabel size="xs" tone={isRoyal ? "accent" : "muted"} weight="bold">
        {piece.pieceType.toUpperCase()}
      </MonoLabel>

      {!isRoyal && onRemove && (
        <button
          type="button"
          data-testid="remove-piece-btn"
          draggable={false}
          className="bg-danger absolute -top-2.5 -right-2.5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full font-mono text-[10px] leading-none text-white opacity-0 transition-all duration-150 group-hover/slot:opacity-100 hover:scale-110 hover:bg-red-500"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(index);
          }}
        >
          &#x2715;
        </button>
      )}
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

interface FormationGridProps {
  positions: FormationSlot[];
  onClickSlot?: (index: number) => void;
  onRemove?: (index: number) => void;
  onDrop?: (sourceIndex: number, targetIndex: number) => void;
  hasSelectedPiece?: boolean;
}

export function FormationGrid({
  positions,
  onClickSlot,
  onRemove,
  onDrop,
  hasSelectedPiece,
}: FormationGridProps) {
  const placedCount = positions.filter((p) => p !== null).length;

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    const slots = slotRefs.current;
    const abortControllers: AbortController[] = [];

    for (let i = 0; i < slots.length; i++) {
      const el = slots[i];
      if (!el) continue;

      const abortController = new AbortController();
      abortControllers.push(abortController);

      el.addEventListener(
        "dragover",
        (e) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
          el.classList.add("border-accent", "ring-2", "ring-accent/40");
        },
        { signal: abortController.signal },
      );

      el.addEventListener(
        "dragleave",
        () => {
          el.classList.remove("border-accent", "ring-2", "ring-accent/40");
        },
        { signal: abortController.signal },
      );

      el.addEventListener(
        "drop",
        (e) => {
          e.preventDefault();
          el.classList.remove("border-accent", "ring-2", "ring-accent/40");

          const sourceIndex = Number(e.dataTransfer?.getData("text/plain"));
          if (!Number.isNaN(sourceIndex) && sourceIndex !== i && onDropRef.current) {
            onDropRef.current(sourceIndex, i);
          }
        },
        { signal: abortController.signal },
      );
    }

    return () => {
      for (const c of abortControllers) c.abort();
    };
  }, [positions]);

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
        {positions.map((position, i) => {
          const isOccupied = position !== null;
          const isEmptyTarget = !isOccupied && hasSelectedPiece;

          return (
            <div
              key={i}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              data-testid={`formation-slot-${i}`}
              draggable={isOccupied}
              className={cn(
                "group/slot relative flex min-h-24 flex-col items-center justify-center border-2 p-2 transition-all duration-150",
                isOccupied ? "border-border-hard bg-bg cursor-grab" : "border-border border-dashed",
                isEmptyTarget && "border-accent animate-pulse cursor-pointer",
              )}
              onClick={() => onClickSlot?.(i)}
              onDragStart={(e) => handleDragStart(e, i)}
            >
              {isOccupied ? (
                <SlotOccupied piece={position} index={i} onRemove={onRemove} />
              ) : (
                <SlotEmpty />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
