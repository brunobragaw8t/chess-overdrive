import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { NAME_MAX_LENGTH } from "../src/constants/users";
import { mutation, query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (user === null || user.isDeleted) {
      return null;
    }
    return user;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    const trimmed = args.name.trim();
    if (trimmed.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }

    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new ConvexError(`Name cannot exceed ${NAME_MAX_LENGTH} characters`);
    }

    await ctx.db.patch(userId, { name: trimmed });
  },
});
