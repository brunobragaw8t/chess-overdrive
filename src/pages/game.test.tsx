import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBoard } from "../engine/board";
import type { Board, Color, Formation, GameResult, GameStatus } from "../engine/types";

// ---------------------------------------------------------------------------
// Stable symbols for mock API references
// ---------------------------------------------------------------------------

const GET_GAME = Symbol("getGame");
const SUBMIT_MOVE = Symbol("submitMove");
const GET_CURRENT_USER = Symbol("getCurrentUser");

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const DEFAULT_WHITE_FORMATION: Formation = [
  "rook",
  "knight",
  "bishop",
  "queen",
  "king",
  null,
  null,
  null,
];

const DEFAULT_BLACK_FORMATION: Formation = [
  "rook",
  "knight",
  "bishop",
  "queen",
  "king",
  null,
  null,
  null,
];

function makeGameData(
  overrides: {
    board?: Board;
    currentTurn?: Color;
    status?: GameStatus;
    result?: GameResult | null;
    whiteFormation?: Formation;
    blackFormation?: Formation;
    lastMoveFrom?: number[] | null;
    lastMoveTo?: number[] | null;
    callerColor?: Color;
  } = {},
) {
  const board =
    overrides.board ??
    createBoard(
      overrides.whiteFormation ?? DEFAULT_WHITE_FORMATION,
      overrides.blackFormation ?? DEFAULT_BLACK_FORMATION,
    );

  return {
    _id: "games:abc123",
    whitePlayerId: "users:white",
    blackPlayerId: "users:black",
    board,
    currentTurn: overrides.currentTurn ?? "white",
    status: overrides.status ?? "active",
    result: overrides.result ?? null,
    whiteFormation: overrides.whiteFormation ?? DEFAULT_WHITE_FORMATION,
    blackFormation: overrides.blackFormation ?? DEFAULT_BLACK_FORMATION,
    whiteLastSeenAt: Date.now(),
    blackLastSeenAt: Date.now(),
    lastMoveFrom: overrides.lastMoveFrom ?? null,
    lastMoveTo: overrides.lastMoveTo ?? null,
    createdAt: Date.now(),
    whitePlayerName: "Alice",
    blackPlayerName: "Bob",
    callerColor: overrides.callerColor ?? "white",
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before component imports
// ---------------------------------------------------------------------------

let mockQueryValues = new Map<symbol, unknown>();
const mockMutationFns = new Map<symbol, ReturnType<typeof vi.fn>>();
const mockNavigate = vi.fn();
const mockGameId = "games:abc123";

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
    games: {
      getGame: GET_GAME,
      submitMove: SUBMIT_MOVE,
    },
    users: {
      getCurrentUser: GET_CURRENT_USER,
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
  useNavigate: () => mockNavigate,
  useRouterState: () => ({ location: { pathname: `/game/${mockGameId}` } }),
  useParams: () => ({ gameId: mockGameId }),
}));

// Lazy-import after mocks
const { PageGame } = await import("./game");

afterEach(() => {
  cleanup();
  mockQueryValues = new Map();
  mockMutationFns.clear();
  mockNavigate.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GamePage", () => {
  it("renders an 8x8 grid of 64 squares", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData());

    render(<PageGame />);

    const squares = screen.getAllByTestId(/^square-/);
    expect(squares).toHaveLength(64);
  });

  it("renders pieces at their board positions", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData());

    render(<PageGame />);

    const whiteRook = screen.getByTestId("piece-0-0");
    expect(whiteRook.textContent).toBe("\u265C");

    const blackPawn = screen.getByTestId("piece-6-0");
    expect(blackPawn.textContent).toBe("\u265F");

    const centerSquare = screen.getByTestId("square-4-4");
    expect(centerSquare.querySelector("[data-testid^='piece-']")).toBeNull();
  });

  it("renders board flipped for black player", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Bob", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData({ callerColor: "black" }));

    render(<PageGame />);

    const squares = screen.getAllByTestId(/^square-/);

    // First square rendered should be 7-7 (top-left from black's view)
    expect(squares[0].getAttribute("data-testid")).toBe("square-7-7");

    // Last square rendered should be 0-0 (bottom-right from black's view)
    expect(squares[63].getAttribute("data-testid")).toBe("square-0-0");
  });

  it("highlights valid moves when clicking a friendly piece on your turn", async () => {
    const user = userEvent.setup();
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData());

    render(<PageGame />);

    // Click white pawn at row 1, col 0 (white's turn)
    await user.click(screen.getByTestId("square-1-0"));

    // Selected square should be highlighted
    expect(screen.getByTestId("square-1-0").getAttribute("data-selected")).toBe("true");

    // Pawn can move to row 2 and row 3 (single + double push)
    expect(screen.getByTestId("square-2-0").getAttribute("data-valid-move")).toBe("true");
    expect(screen.getByTestId("square-3-0").getAttribute("data-valid-move")).toBe("true");

    // Non-target square should NOT be highlighted
    expect(screen.getByTestId("square-4-0").getAttribute("data-valid-move")).toBeNull();
  });

  it("submits move when clicking a valid move square", async () => {
    const user = userEvent.setup();
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData());

    const submitMock = vi.fn().mockResolvedValue(undefined);
    mockMutationFns.set(SUBMIT_MOVE, submitMock);

    render(<PageGame />);

    // Click white pawn at row 1, col 0
    await user.click(screen.getByTestId("square-1-0"));
    // Click valid move square (double push)
    await user.click(screen.getByTestId("square-3-0"));

    expect(submitMock).toHaveBeenCalledWith({
      gameId: mockGameId,
      from: [1, 0],
      to: [3, 0],
    });
  });

  it("deselects piece when clicking a non-valid-move square", async () => {
    const user = userEvent.setup();
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData());

    render(<PageGame />);

    // Select white pawn
    await user.click(screen.getByTestId("square-1-0"));
    expect(screen.getByTestId("square-1-0").getAttribute("data-selected")).toBe("true");

    // Click empty non-move square
    await user.click(screen.getByTestId("square-4-4"));

    // Selection should be cleared
    expect(screen.getByTestId("square-1-0").getAttribute("data-selected")).toBeNull();
  });

  it("highlights the opponent's last move squares", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(
      GET_GAME,
      makeGameData({
        lastMoveFrom: [6, 4],
        lastMoveTo: [4, 4],
        currentTurn: "white",
      }),
    );

    render(<PageGame />);

    expect(screen.getByTestId("square-6-4").getAttribute("data-last-move")).toBe("true");
    expect(screen.getByTestId("square-4-4").getAttribute("data-last-move")).toBe("true");
    // Non-last-move square should not have the attribute
    expect(screen.getByTestId("square-3-3").getAttribute("data-last-move")).toBeNull();
  });

  it("shows 'YOUR TURN' when it is the player's turn", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData({ currentTurn: "white", callerColor: "white" }));

    render(<PageGame />);

    expect(screen.getByText(/your turn/i)).toBeDefined();
  });

  it("shows 'WAITING FOR OPPONENT' when it is not the player's turn", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData({ currentTurn: "black", callerColor: "white" }));

    render(<PageGame />);

    expect(screen.getByText(/waiting for opponent/i)).toBeDefined();
  });

  it("displays player names above and below the board", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(GET_GAME, makeGameData());

    render(<PageGame />);

    expect(screen.getByTestId("opponent-name").textContent).toBe("Bob");
    expect(screen.getByTestId("player-name").textContent).toBe("Alice");
  });

  it("shows promotion picker when moving a pawn to the last rank", async () => {
    const user = userEvent.setup();

    const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[0][4] = { type: "king", color: "white" };
    board[7][4] = { type: "king", color: "black" };
    board[6][0] = { type: "pawn", color: "white" };

    const blackFormation: Formation = [
      "rook",
      "knight",
      "bishop",
      "queen",
      "king",
      null,
      null,
      null,
    ];

    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(
      GET_GAME,
      makeGameData({
        board,
        currentTurn: "white",
        blackFormation,
      }),
    );

    const submitMock = vi.fn().mockResolvedValue(undefined);
    mockMutationFns.set(SUBMIT_MOVE, submitMock);

    render(<PageGame />);

    await user.click(screen.getByTestId("square-6-0"));
    await user.click(screen.getByTestId("square-7-0"));

    expect(screen.getByTestId("promotion-picker")).toBeDefined();

    expect(screen.getByTestId("promote-rook")).toBeDefined();
    expect(screen.getByTestId("promote-knight")).toBeDefined();
    expect(screen.getByTestId("promote-bishop")).toBeDefined();
    expect(screen.getByTestId("promote-queen")).toBeDefined();

    await user.click(screen.getByTestId("promote-queen"));

    expect(submitMock).toHaveBeenCalledWith({
      gameId: mockGameId,
      from: [6, 0],
      to: [7, 0],
      promotion: "queen",
    });
  });

  it("shows 'YOU WIN' banner when the player wins", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(
      GET_GAME,
      makeGameData({
        status: "finished",
        result: "white_wins",
        callerColor: "white",
      }),
    );

    render(<PageGame />);

    expect(screen.getByText(/you win/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /back to home/i })).toBeDefined();
  });

  it("shows 'YOU LOSE' banner when the player loses", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    mockQueryValues.set(
      GET_GAME,
      makeGameData({
        status: "finished",
        result: "black_wins",
        callerColor: "white",
      }),
    );

    render(<PageGame />);

    expect(screen.getByText(/you lose/i)).toBeDefined();
  });

  it("shows loading spinner while game data is being fetched", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });
    // Don't set GET_GAME, so it's undefined (loading)

    render(<PageGame />);

    expect(screen.getByText(/loading/i)).toBeDefined();
  });
});
