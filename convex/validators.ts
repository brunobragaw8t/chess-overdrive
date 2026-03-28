import { v } from "convex/values";

export const colorValidator = v.union(v.literal("white"), v.literal("black"));

export const collectiblePieceTypeValidator = v.union(
  v.literal("rook"),
  v.literal("knight"),
  v.literal("bishop"),
  v.literal("queen"),
  v.literal("king"),
);

export const pieceTypeValidator = v.union(
  v.literal("pawn"),
  v.literal("rook"),
  v.literal("knight"),
  v.literal("bishop"),
  v.literal("queen"),
  v.literal("king"),
);

export const pieceValidator = v.object({
  type: pieceTypeValidator,
  color: colorValidator,
});

export const squareValidator = v.union(pieceValidator, v.null());

export const boardValidator = v.array(v.array(squareValidator));

export const formationValidator = v.array(v.union(collectiblePieceTypeValidator, v.null()));

export const gameStatusValidator = v.union(v.literal("active"), v.literal("finished"));

export const gameResultValidator = v.union(v.literal("white_wins"), v.literal("black_wins"));
