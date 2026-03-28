import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { seedPlayer } from "./test-helpers";

let t: ReturnType<typeof convexTest>;

beforeEach(() => {
  t = convexTest(schema, modules);
});

describe("createLobby", () => {
  it("rejects unauthenticated calls", async () => {
    await expect(t.mutation(api.lobbies.createLobby)).rejects.toThrow();
  });

  it("creates lobby in 'waiting' status and returns its ID", async () => {
    const { userId } = await seedPlayer(t, "Alice", "alice@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    expect(lobbyId).toBeDefined();

    const lobby = await t.run(async (ctx) => {
      return await ctx.db.get(lobbyId);
    });

    expect(lobby).not.toBeNull();
    expect(lobby!.hostUserId).toBe(userId);
    expect(lobby!.status).toBe("waiting");
    expect(lobby!.guestUserId).toBeUndefined();
    expect(lobby!.gameId).toBeUndefined();
  });
});

describe("getLobby", () => {
  it("returns null for unauthenticated calls", async () => {
    const { userId } = await seedPlayer(t, "Alice", "alice@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    const lobby = await t.query(api.lobbies.getLobby, { lobbyId });

    expect(lobby).toBeNull();
  });

  it("returns lobby state for authenticated host in waiting status", async () => {
    const { userId } = await seedPlayer(t, "Alice", "alice@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    const lobby = await asAlice.query(api.lobbies.getLobby, { lobbyId });

    expect(lobby).not.toBeNull();
    expect(lobby!.status).toBe("waiting");
    expect(lobby!.isHost).toBe(true);
    expect(lobby!.hostName).toBe("Alice");
    expect(lobby!.guestName).toBeNull();
    expect(lobby!.gameId).toBeUndefined();
  });

  it("returns lobby with gameId and guest name after guest joins", async () => {
    const { userId: aliceId } = await seedPlayer(t, "Alice", "alice@test.com");
    const { userId: bobId } = await seedPlayer(t, "Bob", "bob@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${aliceId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    const asBob = t.withIdentity({
      name: "Bob",
      subject: `${bobId}|session456`,
    });

    await asBob.mutation(api.lobbies.joinLobby, { lobbyId });

    const lobby = await asAlice.query(api.lobbies.getLobby, { lobbyId });

    expect(lobby).not.toBeNull();
    expect(lobby!.status).toBe("active");
    expect(lobby!.gameId).toBeDefined();
    expect(lobby!.guestName).toBe("Bob");
    expect(lobby!.isHost).toBe(true);

    const lobbyAsBob = await asBob.query(api.lobbies.getLobby, { lobbyId });
    expect(lobbyAsBob!.isHost).toBe(false);
  });
});

describe("joinLobby", () => {
  it("rejects unauthenticated calls", async () => {
    const { userId } = await seedPlayer(t, "Alice", "alice@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    await expect(t.mutation(api.lobbies.joinLobby, { lobbyId })).rejects.toThrow();
  });

  it("rejects joining a non-waiting lobby", async () => {
    const { userId: aliceId } = await seedPlayer(t, "Alice", "alice@test.com");
    const { userId: bobId } = await seedPlayer(t, "Bob", "bob@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${aliceId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    // Manually set lobby to "active" to simulate already-joined
    await t.run(async (ctx) => {
      await ctx.db.patch(lobbyId, { status: "active" });
    });

    const asBob = t.withIdentity({
      name: "Bob",
      subject: `${bobId}|session456`,
    });

    await expect(asBob.mutation(api.lobbies.joinLobby, { lobbyId })).rejects.toThrow(
      "Lobby is not available",
    );
  });

  it("rejects joining own lobby", async () => {
    const { userId } = await seedPlayer(t, "Alice", "alice@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    await expect(asAlice.mutation(api.lobbies.joinLobby, { lobbyId })).rejects.toThrow(
      "Cannot join your own lobby",
    );
  });

  it("initializes game with formations from both players and sets lobby to active", async () => {
    const { userId: aliceId } = await seedPlayer(t, "Alice", "alice@test.com");
    const { userId: bobId } = await seedPlayer(t, "Bob", "bob@test.com");

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${aliceId}|session123`,
    });

    const lobbyId = await asAlice.mutation(api.lobbies.createLobby);

    const asBob = t.withIdentity({
      name: "Bob",
      subject: `${bobId}|session456`,
    });

    await asBob.mutation(api.lobbies.joinLobby, { lobbyId });

    // Verify lobby state
    const lobby = await t.run(async (ctx) => {
      return await ctx.db.get(lobbyId);
    });

    expect(lobby!.status).toBe("active");
    expect(lobby!.guestUserId).toBe(bobId);
    expect(lobby!.gameId).toBeDefined();

    // Verify game record
    const game = await t.run(async (ctx) => {
      return await ctx.db.get(lobby!.gameId!);
    });

    expect(game).not.toBeNull();
    expect(game!.whitePlayerId).toBe(aliceId);
    expect(game!.blackPlayerId).toBe(bobId);
    expect(game!.currentTurn).toBe("white");
    expect(game!.status).toBe("active");
    expect(game!.result).toBeNull();

    // Verify board is an 8x8 grid
    expect(game!.board).toHaveLength(8);
    expect(game!.board[0]).toHaveLength(8);

    // White's back row (row 0) should have pieces from Alice's formation
    expect(game!.board[0][0]).toEqual({ type: "rook", color: "white" });
    expect(game!.board[0][1]).toEqual({ type: "knight", color: "white" });
    expect(game!.board[0][2]).toEqual({ type: "bishop", color: "white" });
    expect(game!.board[0][3]).toEqual({ type: "queen", color: "white" });
    expect(game!.board[0][4]).toEqual({ type: "king", color: "white" });
    expect(game!.board[0][5]).toBeNull();
    expect(game!.board[0][6]).toBeNull();
    expect(game!.board[0][7]).toBeNull();

    // White pawns on row 1
    for (let col = 0; col < 8; col++) {
      expect(game!.board[1][col]).toEqual({ type: "pawn", color: "white" });
    }

    // Black pawns on row 6
    for (let col = 0; col < 8; col++) {
      expect(game!.board[6][col]).toEqual({ type: "pawn", color: "black" });
    }

    // Black's back row (row 7) should have mirrored formation
    expect(game!.board[7][7]).toEqual({ type: "rook", color: "black" });
    expect(game!.board[7][6]).toEqual({ type: "knight", color: "black" });
    expect(game!.board[7][5]).toEqual({ type: "bishop", color: "black" });
    expect(game!.board[7][4]).toEqual({ type: "queen", color: "black" });
    expect(game!.board[7][3]).toEqual({ type: "king", color: "black" });
    expect(game!.board[7][2]).toBeNull();
    expect(game!.board[7][1]).toBeNull();
    expect(game!.board[7][0]).toBeNull();
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
