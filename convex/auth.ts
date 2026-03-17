import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId !== null) {
        return;
      }

      const existingFormation = await ctx.db
        .query("formations")
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (existingFormation !== null) {
        return;
      }

      const now = Date.now();
      const rookId = await ctx.db.insert("pieces", { userId, pieceType: "rook", createdAt: now });
      const knightId = await ctx.db.insert("pieces", {
        userId,
        pieceType: "knight",
        createdAt: now,
      });
      const bishopId = await ctx.db.insert("pieces", {
        userId,
        pieceType: "bishop",
        createdAt: now,
      });
      const queenId = await ctx.db.insert("pieces", { userId, pieceType: "queen", createdAt: now });
      const kingId = await ctx.db.insert("pieces", { userId, pieceType: "king", createdAt: now });

      await ctx.db.insert("formations", {
        userId,
        positions: [rookId, knightId, bishopId, kingId, queenId, null, null, null],
      });
    },
  },
});
