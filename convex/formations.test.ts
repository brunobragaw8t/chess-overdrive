import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { Id } from "./_generated/dataModel";

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

describe("updateFormation", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.formations.updateFormation, { positions: [] })).rejects.toThrow();
  });

  it("rejects formation with unknown pieces", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(
      asAlice.mutation(api.formations.updateFormation, {
        positions: ["random-id" as Id<"pieces">],
      }),
    ).rejects.toThrow();
  });

  it("rejects formation without a king", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const positionsWithoutKing: (Id<"pieces"> | null)[] = [
      pieceIds[0],
      pieceIds[1],
      pieceIds[2],
      pieceIds[3],
      null,
      null,
      null,
      null,
    ];

    await expect(
      asAlice.mutation(api.formations.updateFormation, { positions: positionsWithoutKing }),
    ).rejects.toThrow();
  });

  it("rejects formation without a queen", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const positionsWithoutQueen: (Id<"pieces"> | null)[] = [
      pieceIds[0],
      pieceIds[1],
      pieceIds[2],
      pieceIds[4],
      null,
      null,
      null,
      null,
    ];

    await expect(
      asAlice.mutation(api.formations.updateFormation, { positions: positionsWithoutQueen }),
    ).rejects.toThrow();
  });

  it("rejects positions array with wrong length", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    // Too short (5 elements instead of 8)
    await expect(
      asAlice.mutation(api.formations.updateFormation, {
        positions: [pieceIds[0], pieceIds[1], pieceIds[2], pieceIds[3], pieceIds[4]],
      }),
    ).rejects.toThrow();

    // Too long (9 elements instead of 8)
    await expect(
      asAlice.mutation(api.formations.updateFormation, {
        positions: [
          pieceIds[0],
          pieceIds[1],
          pieceIds[2],
          pieceIds[3],
          pieceIds[4],
          null,
          null,
          null,
          null,
        ],
      }),
    ).rejects.toThrow();
  });

  it("rejects formation with more than 3 of a minor piece type", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    // Insert 3 extra rooks (giving the player 4 rooks total)
    const extraRookIds = await t.run(async (ctx) => {
      const now = Date.now();
      const r1 = await ctx.db.insert("pieces", { userId, pieceType: "rook", createdAt: now });
      const r2 = await ctx.db.insert("pieces", { userId, pieceType: "rook", createdAt: now });
      const r3 = await ctx.db.insert("pieces", { userId, pieceType: "rook", createdAt: now });
      return [r1, r2, r3];
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    // pieceIds[0] is the original rook — 4 rooks total in positions
    const positionsWith4Rooks: (Id<"pieces"> | null)[] = [
      pieceIds[0],
      pieceIds[3], // queen
      pieceIds[4], // king
      extraRookIds[0],
      extraRookIds[1],
      extraRookIds[2],
      null,
      null,
    ];

    await expect(
      asAlice.mutation(api.formations.updateFormation, { positions: positionsWith4Rooks }),
    ).rejects.toThrow();
  });

  it("rejects formation with pieces the player doesn't own", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const otherPieceId = await t.run(async (ctx) => {
      const otherUserId = await ctx.db.insert("users", {
        name: "Bob",
        email: "bob@test.com",
      });

      const otherPieceId = await ctx.db.insert("pieces", {
        userId: otherUserId,
        pieceType: "rook",
        createdAt: Date.now(),
      });

      return otherPieceId;
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const positionsWithStolenPiece: (Id<"pieces"> | null)[] = [
      pieceIds[3], // queen
      pieceIds[4], // king
      otherPieceId,
      null,
      null,
      null,
      null,
      null,
    ];

    await expect(
      asAlice.mutation(api.formations.updateFormation, {
        positions: positionsWithStolenPiece,
      }),
    ).rejects.toThrow();
  });

  it("accepts valid rearrangement and getFormation reflects the change", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    // Rearrange: swap king (index 4) and rook (index 0), leave rest unchanged
    const rearranged: (Id<"pieces"> | null)[] = [
      pieceIds[4], // king (was at index 4)
      pieceIds[1], // knight
      pieceIds[2], // bishop
      pieceIds[3], // queen
      pieceIds[0], // rook (was at index 0)
      null,
      null,
      null,
    ];

    await asAlice.mutation(api.formations.updateFormation, { positions: rearranged });

    const formation = await asAlice.query(api.formations.getFormation);

    expect(formation).not.toBeNull();
    expect(formation!.positions).toEqual([
      { _id: pieceIds[4], pieceType: "king" },
      { _id: pieceIds[1], pieceType: "knight" },
      { _id: pieceIds[2], pieceType: "bishop" },
      { _id: pieceIds[3], pieceType: "queen" },
      { _id: pieceIds[0], pieceType: "rook" },
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
