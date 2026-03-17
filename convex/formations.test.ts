import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * Helper: inserts a user, their 5 starter pieces, and a default formation
 * referencing those piece IDs. Mirrors what `afterUserCreatedOrUpdated`
 * should do for new users.
 *
 * Returns { userId, pieceIds } where pieceIds is ordered:
 * [rook, knight, bishop, queen, king]
 */
async function seedDefaultFormation(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      name: "Alice",
      email: "alice@test.com",
    });

    const now = Date.now();
    const rookId = await ctx.db.insert("pieces", { userId, pieceType: "rook", createdAt: now });
    const knightId = await ctx.db.insert("pieces", { userId, pieceType: "knight", createdAt: now });
    const bishopId = await ctx.db.insert("pieces", { userId, pieceType: "bishop", createdAt: now });
    const queenId = await ctx.db.insert("pieces", { userId, pieceType: "queen", createdAt: now });
    const kingId = await ctx.db.insert("pieces", { userId, pieceType: "king", createdAt: now });

    await ctx.db.insert("formations", {
      userId,
      positions: [rookId, knightId, bishopId, queenId, kingId, null, null, null],
    });

    return { userId, pieceIds: [rookId, knightId, bishopId, queenId, kingId] };
  });
}

describe("getFormation", () => {
  it("returns null when unauthenticated", async () => {
    const t = convexTest(schema, modules);

    const formation = await t.query(api.formations.getFormation);

    expect(formation).toBeNull();
  });

  it("returns the default formation after seeding (5 pieces placed, 3 empty slots)", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const formation = await asAlice.query(api.formations.getFormation);

    expect(formation).not.toBeNull();
    expect(formation!.positions).toEqual([
      { _id: pieceIds[0], pieceType: "rook" },
      { _id: pieceIds[1], pieceType: "knight" },
      { _id: pieceIds[2], pieceType: "bishop" },
      { _id: pieceIds[3], pieceType: "queen" },
      { _id: pieceIds[4], pieceType: "king" },
      null,
      null,
      null,
    ]);
  });
});

describe("getInventory", () => {
  it("returns null when unauthenticated", async () => {
    const t = convexTest(schema, modules);

    const inventory = await t.query(api.formations.getInventory);

    expect(inventory).toBeNull();
  });

  it("returns empty array for a new player (all starter pieces are placed)", async () => {
    const t = convexTest(schema, modules);

    const { userId } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const inventory = await asAlice.query(api.formations.getInventory);

    expect(inventory).toEqual([]);
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
