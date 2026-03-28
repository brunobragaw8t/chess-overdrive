import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  boardValidator,
  collectiblePieceTypeValidator,
  colorValidator,
  formationValidator,
  gameResultValidator,
  gameStatusValidator,
} from "./validators";

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
    pieceType: collectiblePieceTypeValidator,
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  formations: defineTable({
    userId: v.id("users"),
    positions: v.array(v.union(v.id("pieces"), v.null())),
  }).index("by_userId", ["userId"]),

  lobbies: defineTable({
    hostUserId: v.id("users"),
    guestUserId: v.optional(v.id("users")),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    gameId: v.optional(v.id("games")),
  }).index("by_hostUserId", ["hostUserId"]),

  games: defineTable({
    whitePlayerId: v.id("users"),
    blackPlayerId: v.id("users"),
    board: boardValidator,
    currentTurn: colorValidator,
    status: gameStatusValidator,
    result: v.union(gameResultValidator, v.null()),
    whiteFormation: formationValidator,
    blackFormation: formationValidator,
    whiteLastSeenAt: v.optional(v.number()),
    blackLastSeenAt: v.optional(v.number()),
    lastMoveFrom: v.optional(v.array(v.number())),
    lastMoveTo: v.optional(v.array(v.number())),
    createdAt: v.number(),
  })
    .index("by_whitePlayerId", ["whitePlayerId"])
    .index("by_blackPlayerId", ["blackPlayerId"]),
});

export default schema;
