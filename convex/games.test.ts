import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { seedPlayer } from "./test-helpers";

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

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
