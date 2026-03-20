import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { Id } from "./_generated/dataModel";
import { PIECE_TYPES } from "../src/constants/pieces";

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
    const pieceIds = [];

    for (const { type } of PIECE_TYPES) {
      const id = await ctx.db.insert("pieces", {
        userId,
        pieceType: type,
        createdAt: now,
      });

      pieceIds.push(id);
    }

    await ctx.db.insert("formations", {
      userId,
      positions: [...pieceIds, null, null, null],
    });

    return { userId, pieceIds };
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
      { _id: pieceIds[0], pieceType: PIECE_TYPES[0].type },
      { _id: pieceIds[1], pieceType: PIECE_TYPES[1].type },
      { _id: pieceIds[2], pieceType: PIECE_TYPES[2].type },
      { _id: pieceIds[3], pieceType: PIECE_TYPES[3].type },
      { _id: pieceIds[4], pieceType: PIECE_TYPES[4].type },
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

    const { userId } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    // Insert a real piece, then delete it so the ID is valid but not found
    const ghostId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("pieces", {
        userId,
        pieceType: "rook",
        createdAt: Date.now(),
      });

      await ctx.db.delete(id);

      return id;
    });

    await expect(
      asAlice.mutation(api.formations.updateFormation, {
        positions: [ghostId, null, null, null, null, null, null, null],
      }),
    ).rejects.toThrow("Invalid formation: piece not found");
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

      const ids = [];
      for (let i = 0; i < 3; i++) {
        const id = await ctx.db.insert("pieces", {
          userId,
          pieceType: "rook",
          createdAt: now,
        });

        ids.push(id);
      }

      return ids;
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const positionsWith4Rooks: (Id<"pieces"> | null)[] = [...pieceIds, ...extraRookIds];

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
        pieceType: PIECE_TYPES[0].type,
        createdAt: Date.now(),
      });

      return otherPieceId;
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const positionsWithStolenPiece: (Id<"pieces"> | null)[] = [
      ...pieceIds,
      otherPieceId,
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

    const rearranged: (Id<"pieces"> | null)[] = [
      pieceIds[4],
      pieceIds[1],
      pieceIds[2],
      pieceIds[3],
      pieceIds[0],
      null,
      null,
      null,
    ];

    await asAlice.mutation(api.formations.updateFormation, { positions: rearranged });

    const formation = await asAlice.query(api.formations.getFormation);

    expect(formation).not.toBeNull();
    expect(formation!.positions).toEqual([
      { _id: pieceIds[4], pieceType: PIECE_TYPES[4].type },
      { _id: pieceIds[1], pieceType: PIECE_TYPES[1].type },
      { _id: pieceIds[2], pieceType: PIECE_TYPES[2].type },
      { _id: pieceIds[3], pieceType: PIECE_TYPES[3].type },
      { _id: pieceIds[0], pieceType: PIECE_TYPES[0].type },
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

describe("placePiece", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.formations.placePiece, {
        pieceId: "pieces:fake" as Id<"pieces">,
        slotIndex: 5,
      }),
    ).rejects.toThrow();
  });

  it("places an inventory piece into an empty slot; reflected in getFormation and getInventory", async () => {
    const t = convexTest(schema, modules);

    const { userId } = await seedDefaultFormation(t);

    const extraRookId = await t.run(async (ctx) => {
      return await ctx.db.insert("pieces", {
        userId,
        pieceType: "rook",
        createdAt: Date.now(),
      });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const inventoryBefore = await asAlice.query(api.formations.getInventory);
    expect(inventoryBefore).toEqual([{ _id: extraRookId, pieceType: "rook" }]);

    await asAlice.mutation(api.formations.placePiece, {
      pieceId: extraRookId,
      slotIndex: 5,
    });

    const inventoryAfter = await asAlice.query(api.formations.getInventory);
    expect(inventoryAfter).toEqual([]);

    const formation = await asAlice.query(api.formations.getFormation);
    expect(formation).not.toBeNull();
    expect(formation!.positions[5]).toEqual({ _id: extraRookId, pieceType: "rook" });
  });

  it("rejects placement into an occupied slot", async () => {
    const t = convexTest(schema, modules);

    const { userId } = await seedDefaultFormation(t);

    const extraRookId = await t.run(async (ctx) => {
      return await ctx.db.insert("pieces", {
        userId,
        pieceType: "rook",
        createdAt: Date.now(),
      });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(
      asAlice.mutation(api.formations.placePiece, {
        pieceId: extraRookId,
        slotIndex: 0,
      }),
    ).rejects.toThrow();
  });

  it("rejects placing a piece that is already in the formation", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(
      asAlice.mutation(api.formations.placePiece, {
        pieceId: pieceIds[0],
        slotIndex: 5,
      }),
    ).rejects.toThrow("Piece is already placed in the formation");
  });

  it("rejects placing a piece the player doesn't own", async () => {
    const t = convexTest(schema, modules);

    const { userId } = await seedDefaultFormation(t);

    const otherPieceId = await t.run(async (ctx) => {
      const otherUserId = await ctx.db.insert("users", {
        name: "Bob",
        email: "bob@test.com",
      });

      return await ctx.db.insert("pieces", {
        userId: otherUserId,
        pieceType: "rook",
        createdAt: Date.now(),
      });
    });

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(
      asAlice.mutation(api.formations.placePiece, {
        pieceId: otherPieceId,
        slotIndex: 5,
      }),
    ).rejects.toThrow();
  });
});

describe("removePiece", () => {
  it("rejects unauthenticated calls", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.formations.removePiece, { slotIndex: 0 })).rejects.toThrow();
  });

  it("removes a minor piece from formation; reflected in getFormation and getInventory", async () => {
    const t = convexTest(schema, modules);

    const { userId, pieceIds } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    const inventoryBefore = await asAlice.query(api.formations.getInventory);
    expect(inventoryBefore).toEqual([]);

    await asAlice.mutation(api.formations.removePiece, { slotIndex: 0 });

    const formation = await asAlice.query(api.formations.getFormation);
    expect(formation).not.toBeNull();
    expect(formation!.positions[0]).toBeNull();

    const inventoryAfter = await asAlice.query(api.formations.getInventory);
    expect(inventoryAfter).toEqual([{ _id: pieceIds[0], pieceType: "rook" }]);
  });

  it("rejects removing from an already empty slot", async () => {
    const t = convexTest(schema, modules);

    const { userId } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(asAlice.mutation(api.formations.removePiece, { slotIndex: 5 })).rejects.toThrow(
      "Slot is already empty",
    );
  });

  it("rejects removing King or Queen", async () => {
    const t = convexTest(schema, modules);

    const { userId } = await seedDefaultFormation(t);

    const asAlice = t.withIdentity({
      name: "Alice",
      subject: `${userId}|session123`,
    });

    await expect(asAlice.mutation(api.formations.removePiece, { slotIndex: 3 })).rejects.toThrow();

    await expect(asAlice.mutation(api.formations.removePiece, { slotIndex: 4 })).rejects.toThrow();
  });
});

// @ts-ignore
const modules = import.meta.glob("./**/*.ts");
