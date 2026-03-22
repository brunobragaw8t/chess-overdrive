import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { TARGET_RING_CLASSES } from "../../lib/indicator-styles";
import type { PieceSummary } from "../../types/convex";
import { InventoryPanel } from "./inventory-panel";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INVENTORY: PieceSummary[] = [
  { _id: "pieces:rook2" as Id<"pieces">, pieceType: "rook" },
  { _id: "pieces:rook3" as Id<"pieces">, pieceType: "rook" },
  { _id: "pieces:knight2" as Id<"pieces">, pieceType: "knight" },
];

// ---------------------------------------------------------------------------
// Tests — click to select
// ---------------------------------------------------------------------------

describe("InventoryPanel — click to select", () => {
  it("calls onSelectPiece with the piece ID when an inventory group is clicked", async () => {
    const onSelectPiece = vi.fn();

    render(<InventoryPanel pieces={INVENTORY} onSelectPiece={onSelectPiece} />);

    const panel = screen.getByTestId("inventory-panel");
    const rookGroup = within(panel).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);

    expect(onSelectPiece).toHaveBeenCalledOnce();
    expect(onSelectPiece).toHaveBeenCalledWith("pieces:rook2");
  });

  it("calls onSelectPiece for a different type", async () => {
    const onSelectPiece = vi.fn();

    render(<InventoryPanel pieces={INVENTORY} onSelectPiece={onSelectPiece} />);

    const panel = screen.getByTestId("inventory-panel");
    const knightGroup = within(panel).getByTestId("inventory-group-knight");

    await userEvent.click(knightGroup);

    expect(onSelectPiece).toHaveBeenCalledOnce();
    expect(onSelectPiece).toHaveBeenCalledWith("pieces:knight2");
  });

  it("does not crash when no onSelectPiece handler is provided (read-only mode)", async () => {
    render(<InventoryPanel pieces={INVENTORY} />);

    const panel = screen.getByTestId("inventory-panel");
    const rookGroup = within(panel).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);
    // No assertion, just verifying no error
  });
});

// ---------------------------------------------------------------------------
// Tests — selected state
// ---------------------------------------------------------------------------

describe("InventoryPanel — selected state", () => {
  it("visually highlights the selected piece type", () => {
    render(
      <InventoryPanel
        pieces={INVENTORY}
        onSelectPiece={vi.fn()}
        selectedPieceId={"pieces:rook2" as any}
      />,
    );

    const panel = screen.getByTestId("inventory-panel");
    const rookGroup = within(panel).getByTestId("inventory-group-rook");
    const knightGroup = within(panel).getByTestId("inventory-group-knight");

    for (const cls of TARGET_RING_CLASSES) {
      expect(rookGroup.classList.contains(cls)).toBe(true);
      expect(knightGroup.classList.contains(cls)).toBe(false);
    }
  });

  it("deselects when the same piece type is clicked again", async () => {
    const onSelectPiece = vi.fn();

    render(
      <InventoryPanel
        pieces={INVENTORY}
        onSelectPiece={onSelectPiece}
        selectedPieceId={"pieces:rook2" as any}
      />,
    );

    const panel = screen.getByTestId("inventory-panel");
    const rookGroup = within(panel).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);

    expect(onSelectPiece).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// Tests — piece count badges
// ---------------------------------------------------------------------------

describe("InventoryPanel — piece count badges", () => {
  it("shows the count of available pieces for each type", () => {
    render(<InventoryPanel pieces={INVENTORY} />);

    const panel = screen.getByTestId("inventory-panel");
    const rookGroup = within(panel).getByTestId("inventory-group-rook");
    const knightGroup = within(panel).getByTestId("inventory-group-knight");

    expect(within(rookGroup).getByText("2")).toBeDefined();
    expect(within(knightGroup).getByText("1")).toBeDefined();
  });
});
