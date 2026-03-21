import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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
// Stable function reference stubs for the API
// ---------------------------------------------------------------------------

const GET_FORMATION = Symbol("getFormation");
const GET_INVENTORY = Symbol("getInventory");
const UPDATE_FORMATION = Symbol("updateFormation");
const PLACE_PIECE = Symbol("placePiece");
const REMOVE_PIECE = Symbol("removePiece");

// ---------------------------------------------------------------------------
// Mocks — registered before any component imports
// ---------------------------------------------------------------------------

let mockQueryValues = new Map<symbol, unknown>();
const mockMutationFns = new Map<symbol, ReturnType<typeof vi.fn>>();

vi.mock("convex/react", () => ({
  useQuery: (fn: symbol) => {
    return mockQueryValues.has(fn) ? mockQueryValues.get(fn) : undefined;
  },
  useMutation: (fn: symbol) => {
    if (!mockMutationFns.has(fn)) {
      mockMutationFns.set(fn, vi.fn());
    }
    return mockMutationFns.get(fn)!;
  },
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    formations: {
      getFormation: GET_FORMATION,
      getInventory: GET_INVENTORY,
      updateFormation: UPDATE_FORMATION,
      placePiece: PLACE_PIECE,
      removePiece: REMOVE_PIECE,
    },
    users: {
      getCurrentUser: Symbol("getCurrentUser"),
    },
  },
}));

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: unknown }) => opts,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: () => ({ location: { pathname: "/formation" } }),
}));

// Lazy-import after mocks are in place
const { PageFormation } = await import("./formation");

afterEach(() => {
  cleanup();
  mockQueryValues = new Map();
  mockMutationFns.clear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormation(positions: ({ _id: string; pieceType: string } | null)[]) {
  return { _id: "formations:abc", userId: "users:alice", positions };
}

const DEFAULT_FORMATION = makeFormation([
  { _id: "pieces:rook1", pieceType: "rook" },
  { _id: "pieces:knight1", pieceType: "knight" },
  { _id: "pieces:bishop1", pieceType: "bishop" },
  { _id: "pieces:queen1", pieceType: "queen" },
  { _id: "pieces:king1", pieceType: "king" },
  null,
  null,
  null,
]);

function renderWithData(
  formation: ReturnType<typeof makeFormation> | undefined = DEFAULT_FORMATION,
  inventory: { _id: string; pieceType: string }[] | undefined = [],
) {
  if (formation !== undefined) mockQueryValues.set(GET_FORMATION, formation);
  if (inventory !== undefined) mockQueryValues.set(GET_INVENTORY, inventory);
  return render(<PageFormation />);
}

function getMutationMock(sym: symbol) {
  return mockMutationFns.get(sym) ?? vi.fn();
}

// ---------------------------------------------------------------------------
// Phase 4 tests — static display (preserved)
// ---------------------------------------------------------------------------

describe("FormationPage — static display", () => {
  it("shows a loading state while formation data is being fetched", () => {
    // Don't set any values — useQuery returns undefined
    render(<PageFormation />);
    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it("renders the page header with FORMATION title", () => {
    renderWithData();
    expect(screen.getByText("// FORMATION")).toBeDefined();
  });

  it("renders an 8-slot back row grid", () => {
    renderWithData();

    const grid = screen.getByTestId("formation-grid");
    const slots = within(grid).getAllByTestId(/^formation-slot-/);
    expect(slots).toHaveLength(8);
  });

  it("displays piece type labels in occupied slots", () => {
    renderWithData();

    expect(screen.getByText("ROOK")).toBeDefined();
    expect(screen.getByText("KNIGHT")).toBeDefined();
    expect(screen.getByText("BISHOP")).toBeDefined();
    expect(screen.getByText("QUEEN")).toBeDefined();
    expect(screen.getByText("KING")).toBeDefined();
  });

  it("marks empty slots with an EMPTY indicator", () => {
    renderWithData();

    const emptyIndicators = screen.getAllByText("EMPTY");
    expect(emptyIndicators).toHaveLength(3);
  });

  it("shows a piece count summary (placed vs total slots)", () => {
    renderWithData();
    expect(screen.getByText("5/8 SLOTS")).toBeDefined();
  });

  it("shows the inventory panel with unplaced pieces grouped by type", () => {
    renderWithData(DEFAULT_FORMATION, [
      { _id: "pieces:rook2", pieceType: "rook" },
      { _id: "pieces:rook3", pieceType: "rook" },
      { _id: "pieces:knight2", pieceType: "knight" },
    ]);

    const inventory = screen.getByTestId("inventory-panel");
    expect(within(inventory).getByText(/ROOK/)).toBeDefined();
    expect(within(inventory).getByText(/2/)).toBeDefined();
    expect(within(inventory).getByText(/KNIGHT/)).toBeDefined();
  });

  it("shows an empty inventory message when all pieces are placed", () => {
    renderWithData(DEFAULT_FORMATION, []);

    const inventory = screen.getByTestId("inventory-panel");
    expect(within(inventory).getByText(/all pieces placed/i)).toBeDefined();
  });

  it("renders each slot with the correct test id by index", () => {
    renderWithData();

    for (let i = 0; i < 8; i++) {
      expect(screen.getByTestId(`formation-slot-${i}`)).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 5 tests — interactive rearrangement
// ---------------------------------------------------------------------------

describe("FormationPage — remove via X button", () => {
  it("calls removePiece mutation when the remove button is clicked on a minor piece", async () => {
    renderWithData();

    const rookSlot = screen.getByTestId("formation-slot-0");
    const removeBtn = within(rookSlot).getByTestId("remove-piece-btn");

    await userEvent.click(removeBtn);

    const removeMock = getMutationMock(REMOVE_PIECE);
    expect(removeMock).toHaveBeenCalledOnce();
    expect(removeMock).toHaveBeenCalledWith({ slotIndex: 0 });
  });
});

describe("FormationPage — click inventory piece then click empty slot to place", () => {
  it("places a piece: click inventory group, then click empty slot calls placePiece", async () => {
    renderWithData(DEFAULT_FORMATION, [{ _id: "pieces:rook2", pieceType: "rook" }]);

    const inventory = screen.getByTestId("inventory-panel");
    const rookGroup = within(inventory).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);
    await userEvent.click(screen.getByTestId("formation-slot-5"));

    const placeMock = getMutationMock(PLACE_PIECE);
    expect(placeMock).toHaveBeenCalledOnce();
    expect(placeMock).toHaveBeenCalledWith({
      pieceId: "pieces:rook2",
      slotIndex: 5,
    });
  });

  it("clears selection after successful placement", async () => {
    renderWithData(DEFAULT_FORMATION, [{ _id: "pieces:rook2", pieceType: "rook" }]);

    const inventory = screen.getByTestId("inventory-panel");
    const rookGroup = within(inventory).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);
    await userEvent.click(screen.getByTestId("formation-slot-5"));

    await userEvent.click(screen.getByTestId("formation-slot-6"));

    const placeMock = getMutationMock(PLACE_PIECE);
    expect(placeMock).toHaveBeenCalledOnce();
  });

  it("does not call placePiece when clicking an occupied slot after selecting inventory piece", async () => {
    renderWithData(DEFAULT_FORMATION, [{ _id: "pieces:rook2", pieceType: "rook" }]);

    const inventory = screen.getByTestId("inventory-panel");
    const rookGroup = within(inventory).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);
    await userEvent.click(screen.getByTestId("formation-slot-0"));

    const placeMock = getMutationMock(PLACE_PIECE);
    expect(placeMock).not.toHaveBeenCalled();
  });

  it("deselects inventory piece when clicking the same group again", async () => {
    renderWithData(DEFAULT_FORMATION, [{ _id: "pieces:rook2", pieceType: "rook" }]);

    const inventory = screen.getByTestId("inventory-panel");
    const rookGroup = within(inventory).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);
    await userEvent.click(rookGroup);
    await userEvent.click(screen.getByTestId("formation-slot-5"));

    const placeMock = getMutationMock(PLACE_PIECE);
    expect(placeMock).not.toHaveBeenCalled();
  });
});

describe("FormationPage — drag to rearrange", () => {
  it("calls updateFormation when a piece is dragged to a different slot", () => {
    renderWithData();

    const sourceSlot = screen.getByTestId("formation-slot-0");
    const targetSlot = screen.getByTestId("formation-slot-5");

    const dataTransfer = new DataTransfer();

    sourceSlot.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));

    targetSlot.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));

    const updateMock = getMutationMock(UPDATE_FORMATION);
    expect(updateMock).toHaveBeenCalledOnce();

    const expectedPositions = [
      null,
      "pieces:knight1",
      "pieces:bishop1",
      "pieces:queen1",
      "pieces:king1",
      "pieces:rook1",
      null,
      null,
    ];

    expect(updateMock).toHaveBeenCalledWith({
      positions: expectedPositions,
    });
  });

  it("swaps two occupied slots when dragging piece onto another piece", () => {
    renderWithData();

    const sourceSlot = screen.getByTestId("formation-slot-0");
    const targetSlot = screen.getByTestId("formation-slot-2");

    const dataTransfer = new DataTransfer();

    sourceSlot.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));

    targetSlot.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));

    const updateMock = getMutationMock(UPDATE_FORMATION);
    expect(updateMock).toHaveBeenCalledOnce();

    const expectedPositions = [
      "pieces:bishop1",
      "pieces:knight1",
      "pieces:rook1",
      "pieces:queen1",
      "pieces:king1",
      null,
      null,
      null,
    ];

    expect(updateMock).toHaveBeenCalledWith({
      positions: expectedPositions,
    });
  });
});

describe("FormationPage — error handling", () => {
  it("displays an error message when removePiece mutation fails", async () => {
    renderWithData();

    const removeMock = vi.fn().mockRejectedValue(new Error("Slot is already empty"));
    mockMutationFns.set(REMOVE_PIECE, removeMock);

    cleanup();
    renderWithData();

    const rookSlot = screen.getByTestId("formation-slot-0");
    const removeBtn = within(rookSlot).getByTestId("remove-piece-btn");
    await userEvent.click(removeBtn);

    expect(await screen.findByText(/slot is already empty/i)).toBeDefined();
  });

  it("displays an error message when placePiece mutation fails", async () => {
    const placeMock = vi.fn().mockRejectedValue(new Error("Slot is already occupied"));
    mockMutationFns.set(PLACE_PIECE, placeMock);

    renderWithData(DEFAULT_FORMATION, [{ _id: "pieces:rook2", pieceType: "rook" }]);

    const inventory = screen.getByTestId("inventory-panel");
    const rookGroup = within(inventory).getByTestId("inventory-group-rook");

    await userEvent.click(rookGroup);
    await userEvent.click(screen.getByTestId("formation-slot-5"));

    expect(await screen.findByText(/slot is already occupied/i)).toBeDefined();
  });

  it("displays an error message when updateFormation mutation fails", async () => {
    const updateMock = vi
      .fn()
      .mockRejectedValue(new Error("Invalid formation: must have exactly 1 king"));
    mockMutationFns.set(UPDATE_FORMATION, updateMock);

    cleanup();
    renderWithData();

    const sourceSlot = screen.getByTestId("formation-slot-0");
    const targetSlot = screen.getByTestId("formation-slot-5");

    const dataTransfer = new DataTransfer();

    sourceSlot.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));

    targetSlot.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));

    expect(await screen.findByText(/invalid formation/i)).toBeDefined();
  });

  it("clears the error message when a subsequent operation succeeds", async () => {
    const failingRemove = vi.fn().mockRejectedValueOnce(new Error("Something went wrong"));
    mockMutationFns.set(REMOVE_PIECE, failingRemove);

    renderWithData();

    const rookSlot = screen.getByTestId("formation-slot-0");
    await userEvent.click(within(rookSlot).getByTestId("remove-piece-btn"));
    expect(await screen.findByText(/something went wrong/i)).toBeDefined();

    failingRemove.mockResolvedValueOnce(undefined);
    const knightSlot = screen.getByTestId("formation-slot-1");
    await userEvent.click(within(knightSlot).getByTestId("remove-piece-btn"));

    expect(screen.queryByText(/something went wrong/i)).toBeNull();
  });
});
