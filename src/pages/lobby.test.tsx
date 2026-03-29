import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Stable function reference stubs for the API
// ---------------------------------------------------------------------------

const GET_LOBBY = Symbol("getLobby");
const JOIN_LOBBY = Symbol("joinLobby");
const GET_CURRENT_USER = Symbol("getCurrentUser");

// ---------------------------------------------------------------------------
// Mocks — registered before any component imports
// ---------------------------------------------------------------------------

let mockQueryValues = new Map<symbol, unknown>();
const mockMutationFns = new Map<symbol, ReturnType<typeof vi.fn>>();
const mockNavigate = vi.fn();
const mockLobbyId = "lobbies:abc123";

vi.mock("convex/react", () => ({
  useQuery: (fn: symbol, args?: Record<string, unknown>) => {
    if (fn === GET_LOBBY && args) {
      return mockQueryValues.has(GET_LOBBY) ? mockQueryValues.get(GET_LOBBY) : undefined;
    }

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
    lobbies: {
      getLobby: GET_LOBBY,
      joinLobby: JOIN_LOBBY,
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
  useRouterState: () => ({ location: { pathname: `/lobby/${mockLobbyId}` } }),
  useParams: () => ({ lobbyId: mockLobbyId }),
}));

// Lazy-import after mocks are in place
const { PageLobby } = await import("./lobby");

afterEach(() => {
  cleanup();
  mockQueryValues = new Map();
  mockMutationFns.clear();
  mockNavigate.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LobbyPage", () => {
  it("shows a loading state while lobby data is being fetched", () => {
    render(<PageLobby />);
    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it("host sees 'Waiting for opponent' indicator", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    mockQueryValues.set(GET_LOBBY, {
      _id: mockLobbyId,
      status: "waiting",
      gameId: undefined,
      hostName: "Alice",
      guestName: null,
      isHost: true,
    });

    render(<PageLobby />);

    expect(screen.getByText(/waiting for opponent/i)).toBeDefined();
  });

  it("host sees a copyable invite link", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    mockQueryValues.set(GET_LOBBY, {
      _id: mockLobbyId,
      status: "waiting",
      gameId: undefined,
      hostName: "Alice",
      guestName: null,
      isHost: true,
    });

    render(<PageLobby />);

    const input = screen.getByTestId("invite-link-input") as HTMLInputElement;
    expect(input.value).toContain(`/lobby/${mockLobbyId}`);
    expect(screen.getByRole("button", { name: /copy/i })).toBeDefined();
  });

  it("non-host visitor auto-joins the lobby", async () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Bob", avatarUrl: null });

    const joinMock = vi.fn().mockResolvedValue("games:xyz789");
    mockMutationFns.set(JOIN_LOBBY, joinMock);

    mockQueryValues.set(GET_LOBBY, {
      _id: mockLobbyId,
      status: "waiting",
      gameId: undefined,
      hostName: "Alice",
      guestName: null,
      isHost: false,
    });

    render(<PageLobby />);

    await vi.waitFor(() => {
      expect(joinMock).toHaveBeenCalledWith({ lobbyId: mockLobbyId });
    });
  });

  it("redirects to /game/$gameId when lobby becomes active", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    mockQueryValues.set(GET_LOBBY, {
      _id: mockLobbyId,
      status: "active",
      gameId: "games:xyz789",
      hostName: "Alice",
      guestName: "Bob",
      isHost: true,
    });

    render(<PageLobby />);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/game/$gameId",
      params: { gameId: "games:xyz789" },
    });
  });

  it("shows error when lobby is not found", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    mockQueryValues.set(GET_LOBBY, null);

    render(<PageLobby />);

    expect(screen.getByText(/lobby not found/i)).toBeDefined();
  });

  it("shows error when joinLobby fails", async () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Bob", avatarUrl: null });

    const joinMock = vi.fn().mockRejectedValue(new Error("Lobby is not available"));
    mockMutationFns.set(JOIN_LOBBY, joinMock);

    mockQueryValues.set(GET_LOBBY, {
      _id: mockLobbyId,
      status: "waiting",
      gameId: undefined,
      hostName: "Alice",
      guestName: null,
      isHost: false,
    });

    render(<PageLobby />);

    expect(await screen.findByText(/lobby is not available/i)).toBeDefined();
  });
});
