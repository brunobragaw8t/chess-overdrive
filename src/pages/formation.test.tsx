import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Stable function reference stubs for the API
// ---------------------------------------------------------------------------

const GET_FORMATION = Symbol("getFormation");
const GET_INVENTORY = Symbol("getInventory");

// ---------------------------------------------------------------------------
// Mocks — registered before any component imports
// ---------------------------------------------------------------------------

let mockQueryValues = new Map<symbol, unknown>();

vi.mock("convex/react", () => ({
  useQuery: (fn: symbol) => {
    return mockQueryValues.has(fn) ? mockQueryValues.get(fn) : undefined;
  },
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    formations: {
      getFormation: GET_FORMATION,
      getInventory: GET_INVENTORY,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FormationPage", () => {
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
