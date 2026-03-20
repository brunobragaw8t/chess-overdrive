import type { Doc } from "../../convex/_generated/dataModel";

// A piece document from the `pieces` table
export type Piece = Doc<"pieces">;

// Piece summary returned by queries (only the fields the UI needs)
export type PieceSummary = Pick<Piece, "_id" | "pieceType">;

// A single formation slot: either a resolved piece summary or empty
export type FormationSlot = PieceSummary | null;
