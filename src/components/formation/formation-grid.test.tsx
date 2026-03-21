import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import type { FormationSlot } from "../../types/convex";
import { FormationGrid } from "./formation-grid";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// DataTransfer polyfill for jsdom
// ---------------------------------------------------------------------------

class MockDataTransfer {
  private data = new Map<string, string>();
  dropEffect = "none";
  effectAllowed = "all";
  setData(format: string, value: string) {
    this.data.set(format, value);
  }
  getData(format: string) {
    return this.data.get(format) ?? "";
  }
}

if (typeof globalThis.DataTransfer === "undefined") {
  (globalThis as any).DataTransfer = MockDataTransfer;
}

if (typeof globalThis.DragEvent === "undefined") {
  class MockDragEvent extends MouseEvent {
    readonly dataTransfer: DataTransfer | null;
    constructor(type: string, init?: DragEventInit) {
      super(type, init);
      this.dataTransfer = init?.dataTransfer ?? null;
    }
  }
  (globalThis as any).DragEvent = MockDragEvent;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const POSITIONS: FormationSlot[] = [
  { _id: "pieces:rook1" as Id<"pieces">, pieceType: "rook" },
  { _id: "pieces:knight1" as Id<"pieces">, pieceType: "knight" },
  { _id: "pieces:bishop1" as Id<"pieces">, pieceType: "bishop" },
  { _id: "pieces:queen1" as Id<"pieces">, pieceType: "queen" },
  { _id: "pieces:king1" as Id<"pieces">, pieceType: "king" },
  null,
  null,
  null,
];

// ---------------------------------------------------------------------------
// Tests — slot click
// ---------------------------------------------------------------------------

describe("FormationGrid — slot click", () => {
  it("calls onClickSlot with the slot index when an occupied slot is clicked", async () => {
    const onClickSlot = vi.fn();

    render(<FormationGrid positions={POSITIONS} onClickSlot={onClickSlot} />);

    await userEvent.click(screen.getByTestId("formation-slot-0"));

    expect(onClickSlot).toHaveBeenCalledOnce();
    expect(onClickSlot).toHaveBeenCalledWith(0);
  });

  it("calls onClickSlot when an empty slot is clicked", async () => {
    const onClickSlot = vi.fn();

    render(<FormationGrid positions={POSITIONS} onClickSlot={onClickSlot} />);

    await userEvent.click(screen.getByTestId("formation-slot-5"));

    expect(onClickSlot).toHaveBeenCalledOnce();
    expect(onClickSlot).toHaveBeenCalledWith(5);
  });

  it("does not call onClickSlot when no handler is provided (read-only mode)", async () => {
    render(<FormationGrid positions={POSITIONS} />);

    await userEvent.click(screen.getByTestId("formation-slot-0"));
    // No assertion, just verifying no error
  });
});

// ---------------------------------------------------------------------------
// Tests — remove button (X)
// ---------------------------------------------------------------------------

describe("FormationGrid — remove button", () => {
  it("renders a remove button on non-royal occupied slots", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} onRemove={vi.fn()} />);

    const rookSlot = screen.getByTestId("formation-slot-0");
    const knightSlot = screen.getByTestId("formation-slot-1");
    const bishopSlot = screen.getByTestId("formation-slot-2");

    expect(within(rookSlot).getByTestId("remove-piece-btn")).toBeDefined();
    expect(within(knightSlot).getByTestId("remove-piece-btn")).toBeDefined();
    expect(within(bishopSlot).getByTestId("remove-piece-btn")).toBeDefined();
  });

  it("does not render a remove button on royal piece slots", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} onRemove={vi.fn()} />);

    const queenSlot = screen.getByTestId("formation-slot-3");
    const kingSlot = screen.getByTestId("formation-slot-4");

    expect(within(queenSlot).queryByTestId("remove-piece-btn")).toBeNull();
    expect(within(kingSlot).queryByTestId("remove-piece-btn")).toBeNull();
  });

  it("does not render a remove button on empty slots", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} onRemove={vi.fn()} />);

    const emptySlot = screen.getByTestId("formation-slot-5");
    expect(within(emptySlot).queryByTestId("remove-piece-btn")).toBeNull();
  });

  it("calls onRemove with the slot index when the remove button is clicked", async () => {
    const onRemove = vi.fn();
    const onClickSlot = vi.fn();

    render(<FormationGrid positions={POSITIONS} onClickSlot={onClickSlot} onRemove={onRemove} />);

    const rookSlot = screen.getByTestId("formation-slot-0");
    const removeBtn = within(rookSlot).getByTestId("remove-piece-btn");

    await userEvent.click(removeBtn);

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it("does not call onClickSlot when the remove button is clicked", async () => {
    const onRemove = vi.fn();
    const onClickSlot = vi.fn();

    render(<FormationGrid positions={POSITIONS} onClickSlot={onClickSlot} onRemove={onRemove} />);

    const bishopSlot = screen.getByTestId("formation-slot-2");
    const removeBtn = within(bishopSlot).getByTestId("remove-piece-btn");

    await userEvent.click(removeBtn);

    expect(onClickSlot).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests — drag and drop
// ---------------------------------------------------------------------------

describe("FormationGrid — drag and drop", () => {
  it("marks occupied slots as draggable", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} />);

    const rookSlot = screen.getByTestId("formation-slot-0");
    expect(
      rookSlot.querySelector("[draggable=true]") ?? rookSlot.getAttribute("draggable"),
    ).toBeTruthy();
  });

  it("does not mark empty slots as draggable", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} />);

    const emptySlot = screen.getByTestId("formation-slot-5");
    const draggableEl = emptySlot.querySelector("[draggable=true]");
    expect(draggableEl).toBeNull();
    expect(emptySlot.getAttribute("draggable")).not.toBe("true");
  });

  it("calls onDrop with source and target indices when a piece is dropped on another slot", () => {
    const onDrop = vi.fn();

    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} onDrop={onDrop} />);

    const sourceSlot = screen.getByTestId("formation-slot-0");
    const targetSlot = screen.getByTestId("formation-slot-5");

    const dataTransfer = new DataTransfer();

    sourceSlot.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));

    targetSlot.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));

    expect(onDrop).toHaveBeenCalledOnce();
    expect(onDrop).toHaveBeenCalledWith(0, 5);
  });

  it("highlights valid drop targets during drag", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} onDrop={vi.fn()} />);

    const sourceSlot = screen.getByTestId("formation-slot-0");
    const targetSlot = screen.getByTestId("formation-slot-5");

    const dataTransfer = new DataTransfer();

    sourceSlot.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));

    targetSlot.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer }));

    expect(targetSlot.className).toMatch(/drag-over|ring|outline|border-accent/);
  });
});

// ---------------------------------------------------------------------------
// Tests — selected inventory piece targeting
// ---------------------------------------------------------------------------

describe("FormationGrid — selected piece highlighting", () => {
  it("highlights empty slots as valid targets when a piece is selected for placement", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} hasSelectedPiece={true} />);

    const emptySlot = screen.getByTestId("formation-slot-5");
    expect(emptySlot.className).toMatch(/ring|outline|border-accent|pulse/);
  });

  it("does not highlight occupied slots as targets when a piece is selected", () => {
    render(<FormationGrid positions={POSITIONS} onClickSlot={vi.fn()} hasSelectedPiece={true} />);

    const occupiedSlot = screen.getByTestId("formation-slot-0");
    expect(occupiedSlot.className).not.toMatch(/pulse/);
  });
});
