import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppHeader } from "../components/app-header";
import { FormationGrid } from "../components/formation/formation-grid";
import { InventoryPanel } from "../components/formation/inventory-panel";
import { Card, CardContent } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { MonoLabel } from "../components/ui/mono-label";

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function PageFormation() {
  /**
   * General
   */

  const formation = useQuery(api.formations.getFormation);
  const inventory = useQuery(api.formations.getInventory);

  const [selectedPieceId, setSelectedPieceId] = useState<Id<"pieces"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Place piece
   */

  const placePiece = useMutation(api.formations.placePiece);

  async function handlePlacePiece(slotIndex: number) {
    if (formation === undefined || formation === null || selectedPieceId === null) return;

    const position = formation.positions[slotIndex];

    if (position !== null) return;

    setError(null);
    setSelectedPieceId(null);

    try {
      await placePiece({ pieceId: selectedPieceId, slotIndex });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  /**
   * Remove piece
   */

  const removePiece = useMutation(api.formations.removePiece);

  async function handleRemovePiece(slotIndex: number) {
    setError(null);

    try {
      await removePiece({ slotIndex });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  /**
   * Drag and drop
   */

  function handleSelectPiece(pieceId: Id<"pieces"> | null) {
    setSelectedPieceId(pieceId);
  }

  const updateFormation = useMutation(api.formations.updateFormation);

  async function handleDropPiece(sourceIndex: number, targetIndex: number) {
    if (formation === undefined || formation === null) return;

    const newPositions = formation.positions.map((p) => p?._id ?? null);
    const temp = newPositions[sourceIndex];
    newPositions[sourceIndex] = newPositions[targetIndex];
    newPositions[targetIndex] = temp;

    setError(null);

    try {
      await updateFormation({ positions: newPositions });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-240 px-8 py-16">
        <MonoLabel size="md" tone="muted" tracking="wider">
          // FORMATION
        </MonoLabel>

        {formation === undefined || inventory === undefined ? (
          <LoadingSpinner label="LOADING_FORMATION" className="min-h-80" />
        ) : (
          <Card className="animate-stamp mt-6">
            <CardContent className="flex flex-col gap-8">
              {error !== null && (
                <div className="border-danger/40 bg-danger/10 border-2 px-4 py-3">
                  <MonoLabel size="xs" tone="dim">
                    {error}
                  </MonoLabel>
                </div>
              )}

              {formation === null ? (
                <MonoLabel tone="dim">NO FORMATION FOUND</MonoLabel>
              ) : (
                <FormationGrid
                  positions={formation.positions}
                  onClickSlot={handlePlacePiece}
                  onRemove={handleRemovePiece}
                  onDrop={handleDropPiece}
                  hasSelectedPiece={selectedPieceId !== null}
                />
              )}

              <InventoryPanel
                pieces={inventory ?? []}
                onSelectPiece={handleSelectPiece}
                selectedPieceId={selectedPieceId}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
