import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { NAME_MAX_LENGTH } from "../src/constants/users";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

/**
 * Verifies the caller is an authenticated, non-deleted user.
 * Throws ConvexError if not. Returns the user document.
 */
export async function authGuard(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  if (user === null || user.isDeleted) {
    throw new ConvexError("Not authenticated");
  }

  return user;
}

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

    const avatarUrl = user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null;

    return { ...user, avatarUrl };
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await authGuard(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);
    await ctx.db.patch(user._id, { avatarStorageId: args.storageId });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);

    const trimmed = args.name.trim();
    if (trimmed.length === 0) {
      throw new ConvexError("Name cannot be empty");
    }

    if (trimmed.length > NAME_MAX_LENGTH) {
      throw new ConvexError(`Name cannot exceed ${NAME_MAX_LENGTH} characters`);
    }

    await ctx.db.patch(user._id, { name: trimmed });
  },
});
