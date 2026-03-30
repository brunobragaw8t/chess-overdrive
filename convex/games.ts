import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { applyMove } from "../src/engine/game";
import type { Color, GameState, Move, Position } from "../src/engine/types";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { BOT_EMAIL } from "./botPlayer";
import { authGuard } from "./users";
import { collectiblePieceTypeValidator } from "./validators";

export const getGame = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const whitePlayer = await ctx.db.get(game.whitePlayerId);
    const blackPlayer = await ctx.db.get(game.blackPlayerId);

    const callerColor: Color = userId === game.whitePlayerId ? "white" : "black";

    return {
      ...game,
      whitePlayerName: whitePlayer?.name ?? "Unknown",
      blackPlayerName: blackPlayer?.name ?? "Unknown",
      callerColor,
    };
  },
});

export const submitMove = mutation({
  args: {
    gameId: v.id("games"),
    from: v.array(v.number()),
    to: v.array(v.number()),
    promotion: v.optional(collectiblePieceTypeValidator),
  },
  handler: async (ctx, args) => {
    const user = await authGuard(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found");

    if (user._id !== game.whitePlayerId && user._id !== game.blackPlayerId) {
      throw new ConvexError("Not a player in this game");
    }

    if (game.status !== "active") {
      throw new ConvexError("Game is not active");
    }

    const callerColor = user._id === game.whitePlayerId ? "white" : "black";
    if (callerColor !== game.currentTurn) {
      throw new ConvexError("Not your turn");
    }

    const gameState: GameState = {
      board: game.board,
      currentTurn: game.currentTurn,
      status: game.status,
      result: game.result,
      whiteFormation: game.whiteFormation,
      blackFormation: game.blackFormation,
    };

    const move: Move = {
      from: args.from as Position,
      to: args.to as Position,
      promotion: args.promotion,
    };

    let newState: GameState;
    try {
      newState = applyMove(gameState, move);
    } catch (e) {
      if (e instanceof Error) {
        throw new ConvexError(e.message);
      }

      throw new ConvexError("Could not apply move");
    }

    await ctx.db.patch(args.gameId, {
      board: newState.board,
      currentTurn: newState.currentTurn,
      status: newState.status,
      result: newState.result,
      lastMoveFrom: [...args.from],
      lastMoveTo: [...args.to],
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

    // Schedule bot move if the next turn belongs to the bot
    if (newState.status === "active") {
      const nextPlayerId =
        newState.currentTurn === "white" ? game.whitePlayerId : game.blackPlayerId;

      const nextPlayer = await ctx.db.get(nextPlayerId);

      if (nextPlayer?.email === BOT_EMAIL) {
        await ctx.scheduler.runAfter(500, internal.botPlayer.makeBotMove, {
          gameId: args.gameId,
        });
      }
    }
  },
});
