import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { seedPlayer } from "./testHelpers";

let t: ReturnType<typeof convexTest>;

beforeEach(() => {
  t = convexTest(schema, modules);
});

/**
 * Helper: creates a lobby (as Alice), joins it (as Bob), returns gameId + lobbyId.
 */
async function seedGame() {
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

  const gameId = await asBob.mutation(api.lobbies.joinLobby, { lobbyId });

  return { aliceId, bobId, lobbyId, gameId, asAlice, asBob };
}

describe("getGame", () => {
  it("returns null for unauthenticated calls", async () => {
    const { gameId } = await seedGame();

    const game = await t.query(api.games.getGame, { gameId });

    expect(game).toBeNull();
  });

  it("returns board state, players, turn, and status for authenticated player", async () => {
    const { gameId, asAlice } = await seedGame();

    const game = await asAlice.query(api.games.getGame, { gameId });

    expect(game).not.toBeNull();
    expect(game!._id).toBe(gameId);
    expect(game!.currentTurn).toBe("white");
    expect(game!.status).toBe("active");
    expect(game!.result).toBeNull();
    expect(game!.whitePlayerName).toBe("Alice");
    expect(game!.blackPlayerName).toBe("Bob");
    expect(game!.board).toHaveLength(8);
    expect(game!.currentTurn).toBe("white");
    expect(game!.status).toBe("active");
  });
});

describe("submitMove", () => {
  it("rejects unauthenticated calls", async () => {
    const { gameId } = await seedGame();

    await expect(
      t.mutation(api.games.submitMove, {
        gameId,
        from: [1, 0],
        to: [3, 0],
      }),
    ).rejects.toThrow("Not authenticated");
  });

  it("rejects moves from non-participants", async () => {
    const { gameId } = await seedGame();
    const { userId: carolId } = await seedPlayer(t, "Carol", "carol@test.com");
    const asCarol = t.withIdentity({
      name: "Carol",
      subject: `${carolId}|session789`,
    });

    await expect(
      asCarol.mutation(api.games.submitMove, {
        gameId,
        from: [1, 0],
        to: [3, 0],
      }),
    ).rejects.toThrow("Not a player in this game");
  });

  it("rejects out-of-turn moves", async () => {
    const { gameId, asBob } = await seedGame();

    // White moves first; Bob is black: should be rejected
    await expect(
      asBob.mutation(api.games.submitMove, {
        gameId,
        from: [6, 0],
        to: [4, 0],
      }),
    ).rejects.toThrow("Not your turn");
  });

  it("rejects illegal moves", async () => {
    const { gameId, asAlice } = await seedGame();

    // Pawn can't move 3 squares forward
    await expect(
      asAlice.mutation(api.games.submitMove, {
        gameId,
        from: [1, 0],
        to: [4, 0],
      }),
    ).rejects.toThrow("Invalid move");
  });

  it("applies a valid move and updates board state", async () => {
    const { gameId, asAlice } = await seedGame();

    // White pawn double push: a2 → a4 ([1,0] -> [3,0])
    await asAlice.mutation(api.games.submitMove, {
      gameId,
      from: [1, 0],
      to: [3, 0],
    });

    const game = await asAlice.query(api.games.getGame, { gameId });

    expect(game!.currentTurn).toBe("black");
    expect(game!.board[1][0]).toBeNull(); // source square empty
    expect(game!.board[3][0]).toEqual({ type: "pawn", color: "white" }); // pawn moved
    expect(game!.lastMoveFrom).toEqual([1, 0]);
    expect(game!.lastMoveTo).toEqual([3, 0]);
  });

  it("detects king capture and ends the game", async () => {
    const { gameId, lobbyId, asAlice } = await seedGame();

    await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      const board = game!.board;

      // Clear board
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          board[r][c] = null;
        }
      }

      // Set up board where white queen on [5,3] can capture black king on [6,3]
      board[0][4] = { type: "king", color: "white" };
      board[5][3] = { type: "queen", color: "white" };
      board[6][3] = { type: "king", color: "black" };

      await ctx.db.patch(gameId, { board, currentTurn: "white" });
    });

    // White queen captures black king
    await asAlice.mutation(api.games.submitMove, {
      gameId,
      from: [5, 3],
      to: [6, 3],
    });

    const game = await asAlice.query(api.games.getGame, { gameId });
    expect(game!.status).toBe("finished");
    expect(game!.result).toBe("white_wins");

    const lobby = await asAlice.query(api.lobbies.getLobby, { lobbyId });
    expect(lobby!.status).toBe("finished");
  });

  it("handles valid pawn promotion", async () => {
    const { gameId, asAlice } = await seedGame();

    await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      const board = game!.board;

      // Clear board
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          board[r][c] = null;
        }
      }

      // Set up board: white pawn on [6,0] about to promote, black king safe elsewhere
      board[0][4] = { type: "king", color: "white" };
      board[7][4] = { type: "king", color: "black" };
      board[6][0] = { type: "pawn", color: "white" };

      await ctx.db.patch(gameId, { board, currentTurn: "white" });
    });

    await asAlice.mutation(api.games.submitMove, {
      gameId,
      from: [6, 0],
      to: [7, 0],
      promotion: "queen",
    });

    const game = await asAlice.query(api.games.getGame, { gameId });
    expect(game!.board[7][0]).toEqual({ type: "queen", color: "white" });
    expect(game!.board[6][0]).toBeNull();
    expect(game!.currentTurn).toBe("black");
  });

  it("rejects moves on a finished game", async () => {
    const { gameId, asAlice } = await seedGame();

    await t.run(async (ctx) => {
      await ctx.db.patch(gameId, { status: "finished", result: "white_wins" });
    });

    await expect(
      asAlice.mutation(api.games.submitMove, {
        gameId,
        from: [1, 0],
        to: [3, 0],
      }),
    ).rejects.toThrow("Game is not active");
  });

  it("rejects pawn promotion without promotion field", async () => {
    const { gameId, asAlice } = await seedGame();

    await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      const board = game!.board;

      // Clear board
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          board[r][c] = null;
        }
      }

      // Set up board: white pawn on [6,0] about to promote
      board[0][4] = { type: "king", color: "white" };
      board[7][4] = { type: "king", color: "black" };
      board[6][0] = { type: "pawn", color: "white" };

      await ctx.db.patch(gameId, { board, currentTurn: "white" });
    });

    await expect(
      asAlice.mutation(api.games.submitMove, {
        gameId,
        from: [6, 0],
        to: [7, 0],
      }),
    ).rejects.toThrow("Promotion piece type required");
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
