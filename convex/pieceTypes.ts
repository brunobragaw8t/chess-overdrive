import { v } from "convex/values";

export const PIECE_TYPES = [
  { type: "rook", min: 0, max: 3 },
  { type: "knight", min: 0, max: 3 },
  { type: "bishop", min: 0, max: 3 },
  { type: "queen", min: 1, max: 1 },
  { type: "king", min: 1, max: 1 },
] as const;

export type PieceType = (typeof PIECE_TYPES)[number]["type"];

export const pieceTypeValidator = v.union(
  v.literal("rook"),
  v.literal("knight"),
  v.literal("bishop"),
  v.literal("queen"),
  v.literal("king"),
);
