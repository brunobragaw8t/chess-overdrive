import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { BOT_FORMATION } from "../src/engine/bot";
import { initGame } from "../src/engine/game";
import type { Formation } from "../src/engine/types";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { authGuard } from "./users";

/**
 * Reads a player's formation and resolves piece IDs to PieceType values.
 * Returns a Formation array (8 slots of PieceType | null).
 */
async function resolveFormation(ctx: MutationCtx, userId: Id<"users">): Promise<Formation> {
  const formation = await ctx.db
    .query("formations")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (!formation) {
    throw new ConvexError("Player has no formation");
  }

  const positions = await Promise.all(
    formation.positions.map(async (pieceId) => {
      if (pieceId === null) return null;

      const piece = await ctx.db.get(pieceId);

      return piece?.pieceType ?? null;
    }),
  );

  return positions;
}

export const createLobby = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authGuard(ctx);

    return await ctx.db.insert("lobbies", {
      hostUserId: user._id,
      status: "waiting",
    });
  },
});

export const joinLobby = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new ConvexError("Lobby not found");
    }

    if (lobby.hostUserId === user._id) {
      throw new ConvexError("Cannot join your own lobby");
    }

    if (lobby.status !== "waiting") {
      throw new ConvexError("Lobby is not available");
    }

    const whiteFormation = await resolveFormation(ctx, lobby.hostUserId);
    const blackFormation = await resolveFormation(ctx, user._id);

    const gameState = initGame(whiteFormation, blackFormation);

    const gameId = await ctx.db.insert("games", {
      whitePlayerId: lobby.hostUserId,
      blackPlayerId: user._id,
      ...gameState,
      createdAt: Date.now(),
    });

    await ctx.db.patch(lobby._id, {
      guestUserId: user._id,
      status: "active",
      gameId,
    });

    return gameId;
  },
});

export const createBotGame = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"games">> => {
    const user = await authGuard(ctx);

    const botUserId = await ctx.runMutation(internal.botPlayer.ensureBotUser);

    const humanFormation = await resolveFormation(ctx, user._id);
    const botFormation: Formation = BOT_FORMATION;

    const gameState = initGame(humanFormation, botFormation);

    const gameId = await ctx.db.insert("games", {
      whitePlayerId: user._id,
      blackPlayerId: botUserId,
      ...gameState,
      createdAt: Date.now(),
    });

    await ctx.db.insert("lobbies", {
      hostUserId: user._id,
      guestUserId: botUserId,
      status: "active",
      gameId,
    });

    return gameId;
  },
});

export const getLobby = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) return null;

    const host = await ctx.db.get(lobby.hostUserId);
    const guest = lobby.guestUserId ? await ctx.db.get(lobby.guestUserId) : null;

    return {
      _id: lobby._id,
      status: lobby.status,
      gameId: lobby.gameId,
      hostName: host?.name ?? "Unknown",
      guestName: !guest ? null : (guest.name ?? "Unknown"),
      isHost: lobby.hostUserId === userId,
    };
  },
});
