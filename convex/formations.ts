import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authGuard } from "./users";

export const getFormation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const formation = await ctx.db
      .query("formations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (formation === null) {
      return null;
    }

    const positions = await Promise.all(
      formation.positions.map(async (pieceId) => {
        if (pieceId === null) {
          return null;
        }

        const piece = await ctx.db.get(pieceId);

        if (piece === null) {
          return null;
        }

        return { _id: piece._id, pieceType: piece.pieceType };
      }),
    );

    return { ...formation, positions };
  },
});

export const updateFormation = mutation({
  args: {
    positions: v.array(v.union(v.id("pieces"), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);

    if (args.positions.length !== 8) {
      throw new ConvexError("Invalid formation: positions must have exactly 8 slots");
    }

    const pieces = await Promise.all(
      args.positions.map(async (id) => {
        if (id === null) {
          return null;
        }

        const piece = await ctx.db.get(id);
        if (piece === null) {
          throw new ConvexError("Invalid formation: piece not found");
        }

        if (piece.userId !== user._id) {
          throw new ConvexError("Invalid formation: piece not owned by player");
        }

        return piece;
      }),
    );

    const nonNullPieces = pieces.filter((p) => p !== null);

    const kingCount = nonNullPieces.filter((p) => p.pieceType === "king").length;
    if (kingCount !== 1) {
      throw new ConvexError("Invalid formation: must have exactly 1 King");
    }

    const queenCount = nonNullPieces.filter((p) => p.pieceType === "queen").length;
    if (queenCount !== 1) {
      throw new ConvexError("Invalid formation: must have exactly 1 Queen");
    }

    const minorPieceTypes = ["rook", "knight", "bishop"] as const;
    for (const type of minorPieceTypes) {
      const count = nonNullPieces.filter((p) => p.pieceType === type).length;
      if (count > 3) {
        throw new ConvexError(`Invalid formation: max 3 ${type}s allowed`);
      }
    }

    const formation = await ctx.db
      .query("formations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (formation === null) {
      throw new ConvexError("Formation not found");
    }

    await ctx.db.patch(formation._id, { positions: args.positions });
  },
});

export const getInventory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const formation = await ctx.db
      .query("formations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const placedPieceIds = new Set((formation?.positions ?? []).filter((id) => id !== null));

    const allPieces = await ctx.db
      .query("pieces")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return allPieces
      .filter((piece) => !placedPieceIds.has(piece._id))
      .map((piece) => ({ _id: piece._id, pieceType: piece.pieceType }));
  },
});
