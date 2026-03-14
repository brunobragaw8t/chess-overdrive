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
    isDeleted: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  }).index("email", ["email"]),
});

export default schema;
