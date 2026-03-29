import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Stable function reference stubs for the API
// ---------------------------------------------------------------------------

const CREATE_LOBBY = Symbol("createLobby");
const GET_CURRENT_USER = Symbol("getCurrentUser");

// ---------------------------------------------------------------------------
// Mocks — registered before any component imports
// ---------------------------------------------------------------------------

let mockQueryValues = new Map<symbol, unknown>();
const mockMutationFns = new Map<symbol, ReturnType<typeof vi.fn>>();
const mockNavigate = vi.fn();

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
    lobbies: {
      createLobby: CREATE_LOBBY,
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
  useRouterState: () => ({ location: { pathname: "/play" } }),
}));

// Lazy-import after mocks are in place
const { PagePlay } = await import("./play");

afterEach(() => {
  cleanup();
  mockQueryValues = new Map();
  mockMutationFns.clear();
  mockNavigate.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlayPage", () => {
  it("renders a Create Lobby button", () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    render(<PagePlay />);

    expect(screen.getByRole("button", { name: /create lobby/i })).toBeDefined();
  });

  it("calls createLobby mutation when button is clicked", async () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    const createMock = vi.fn().mockResolvedValue("lobbies:abc123");
    mockMutationFns.set(CREATE_LOBBY, createMock);

    render(<PagePlay />);

    await userEvent.click(screen.getByRole("button", { name: /create lobby/i }));

    expect(createMock).toHaveBeenCalledOnce();
  });

  it("navigates to /lobby/$lobbyId after lobby is created", async () => {
    mockQueryValues.set(GET_CURRENT_USER, { name: "Alice", avatarUrl: null });

    const createMock = vi.fn().mockResolvedValue("lobbies:abc123");
    mockMutationFns.set(CREATE_LOBBY, createMock);

    render(<PagePlay />);

    await userEvent.click(screen.getByRole("button", { name: /create lobby/i }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/lobby/$lobbyId",
      params: { lobbyId: "lobbies:abc123" },
    });
  });
});
