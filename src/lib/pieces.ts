import { PIECE_TYPES } from "../constants/pieces";
import type { Piece } from "../types/convex";

export function isPieceRoyal(pieceType: Piece["pieceType"]) {
  return pieceType === "king" || pieceType === "queen";
}

export function getPieceIcon(pieceType: Piece["pieceType"]) {
  return PIECE_TYPES.find((t) => t.type === pieceType)?.icon;
}
