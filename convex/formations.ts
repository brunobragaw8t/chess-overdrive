import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PIECE_TYPES } from "./pieceTypes";
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

    for (const { type, min, max } of PIECE_TYPES) {
      const count = nonNullPieces.filter((p) => p.pieceType === type).length;

      if (count < min) {
        throw new ConvexError(`Invalid formation: must have exactly ${min} ${type}`);
      }

      if (count > max) {
        throw new ConvexError(`Invalid formation: max ${max} ${type}s allowed`);
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

export const placePiece = mutation({
  args: {
    pieceId: v.id("pieces"),
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);

    const piece = await ctx.db.get(args.pieceId);
    if (piece === null || piece.userId !== user._id) {
      throw new ConvexError("Piece not found or not owned by player");
    }

    const formation = await ctx.db
      .query("formations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (formation === null) {
      throw new ConvexError("Formation not found");
    }

    if (args.slotIndex < 0 || args.slotIndex >= 8) {
      throw new ConvexError("Invalid slot index");
    }

    if (formation.positions[args.slotIndex] !== null) {
      throw new ConvexError("Slot is already occupied");
    }

    const alreadyPlaced = formation.positions.some((id) => id !== null && id === args.pieceId);
    if (alreadyPlaced) {
      throw new ConvexError("Piece is already placed in the formation");
    }

    const newPositions = [...formation.positions];
    newPositions[args.slotIndex] = args.pieceId;
    await ctx.db.patch(formation._id, { positions: newPositions });
  },
});

export const removePiece = mutation({
  args: {
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);

    const formation = await ctx.db
      .query("formations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (formation === null) {
      throw new ConvexError("Formation not found");
    }

    if (args.slotIndex < 0 || args.slotIndex >= 8) {
      throw new ConvexError("Invalid slot index");
    }

    const pieceId = formation.positions[args.slotIndex];
    if (pieceId === null) {
      throw new ConvexError("Slot is already empty");
    }

    const piece = await ctx.db.get(pieceId);
    if (piece !== null && (piece.pieceType === "king" || piece.pieceType === "queen")) {
      throw new ConvexError("Cannot remove King or Queen from formation");
    }

    const newPositions = [...formation.positions];
    newPositions[args.slotIndex] = null;
    await ctx.db.patch(formation._id, { positions: newPositions });
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
