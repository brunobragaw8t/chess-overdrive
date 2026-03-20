export const PIECE_TYPES = [
  { type: "rook", icon: "\u265C", min: 0, max: 3 },
  { type: "knight", icon: "\u265E", min: 0, max: 3 },
  { type: "bishop", icon: "\u265D", min: 0, max: 3 },
  { type: "queen", icon: "\u265B", min: 1, max: 1 },
  { type: "king", icon: "\u265A", min: 1, max: 1 },
] as const;

export type PieceType = (typeof PIECE_TYPES)[number]["type"];
