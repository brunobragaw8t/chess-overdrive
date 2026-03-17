import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

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
