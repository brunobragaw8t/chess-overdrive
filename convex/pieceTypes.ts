import { v } from "convex/values";

export const pieceTypeValidator = v.union(
  v.literal("rook"),
  v.literal("knight"),
  v.literal("bishop"),
  v.literal("queen"),
  v.literal("king"),
);
