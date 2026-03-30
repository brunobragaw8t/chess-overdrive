import { v } from "convex/values";
import { applyMove } from "../src/engine/game";
import type { GameState } from "../src/engine/types";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { BOT_FORMATION, pickBotMove } from "../src/engine/bot";

export const BOT_EMAIL = "bot@chess-overdrive.internal";

export const ensureBotUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", BOT_EMAIL))
      .first();

    if (existing) return existing._id;

    const userId = await ctx.db.insert("users", {
      name: "BOT",
      email: BOT_EMAIL,
      createdAt: Date.now(),
    });

    const pieceIds: Id<"pieces">[] = [];
    const now = Date.now();

    for (const pieceType of BOT_FORMATION) {
      const id = await ctx.db.insert("pieces", {
        userId,
        pieceType,
        createdAt: now,
      });

      pieceIds.push(id);
    }

    await ctx.db.insert("formations", {
      userId,
      positions: pieceIds,
    });

    return userId;
  },
});

/**
 * Makes the bot's move for the given game.
 * Called via scheduler after the human player submits a move.
 */
export const makeBotMove = internalMutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;

    if (game.status !== "active") return;

    // Determine which player is the bot
    const botUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", BOT_EMAIL))
      .first();

    if (!botUser) return;

    const botColor =
      game.whitePlayerId === botUser._id
        ? "white"
        : game.blackPlayerId === botUser._id
          ? "black"
          : null;

    if (!botColor || game.currentTurn !== botColor) return;

    const move = pickBotMove(game);
    if (!move) return;

    let newState: GameState;
    try {
      newState = applyMove(game, move);
    } catch {
      // If the move is somehow invalid, silently bail out
      return;
    }

    await ctx.db.patch(args.gameId, {
      board: newState.board,
      currentTurn: newState.currentTurn,
      status: newState.status,
      result: newState.result,
      lastMoveFrom: [...move.from],
      lastMoveTo: [...move.to],
    });

    if (newState.status === "finished") {
      const lobby = await ctx.db
        .query("lobbies")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .first();

      if (lobby) {
        await ctx.db.patch(lobby._id, { status: "finished" });
      }
    }
  },
});
