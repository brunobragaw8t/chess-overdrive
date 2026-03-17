import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    // Fields managed by Convex Auth
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    avatarStorageId: v.optional(v.id("_storage")),
    totalWins: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("email", ["email"]),

  pieces: defineTable({
    userId: v.id("users"),
    pieceType: v.union(
      v.literal("king"),
      v.literal("queen"),
      v.literal("rook"),
      v.literal("knight"),
      v.literal("bishop"),
    ),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  formations: defineTable({
    userId: v.id("users"),
    positions: v.array(v.union(v.id("pieces"), v.null())),
  }).index("by_userId", ["userId"]),
});

export default schema;
