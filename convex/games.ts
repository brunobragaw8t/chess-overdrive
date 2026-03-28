import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

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

    return {
      ...game,
      whitePlayerName: whitePlayer?.name ?? "Unknown",
      blackPlayerName: blackPlayer?.name ?? "Unknown",
    };
  },
});
