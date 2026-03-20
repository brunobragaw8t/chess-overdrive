import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { PIECE_TYPES } from "../src/constants/pieces";

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
      const pieceIds = [];

      for (const { type } of PIECE_TYPES) {
        const id = await ctx.db.insert("pieces", {
          userId,
          pieceType: type,
          createdAt: now,
        });

        pieceIds.push(id);
      }

      await ctx.db.insert("formations", {
        userId,
        positions: [...pieceIds, null, null, null],
      });
    },
  },
});
