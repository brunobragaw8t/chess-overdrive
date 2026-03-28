import type { convexTest } from "convex-test";
import type { Id } from "./_generated/dataModel";
import { PIECE_TYPES } from "../src/constants/pieces";

/**
 * Inserts a user, their 5 starter pieces, and a default formation.
 * Returns { userId, pieceIds }.
 */
export async function seedPlayer(t: ReturnType<typeof convexTest>, name: string, email: string) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name, email });

    const now = Date.now();
    const pieceIds: Id<"pieces">[] = [];

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

    return { userId, pieceIds };
  });
}
