import { getValidMoves } from "./game";
import type { GameState, Move, PieceType, Position } from "./types";

export const BOT_FORMATION: Exclude<PieceType, "pawn">[] = [
  "rook",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "rook",
];

/**
 * Picks a random legal move for the current turn's color.
 * Returns null if no moves are available (shouldn't happen in normal play).
 */
export function pickBotMove(state: GameState): Move | null {
  const allMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (!piece || piece.color !== state.currentTurn) continue;

      const from: Position = [row, col];
      const targets = getValidMoves(state, from);

      for (const to of targets) {
        const move: Move = { from, to };

        // Handle pawn promotion
        const lastRank = state.currentTurn === "white" ? 7 : 0;
        if (piece.type === "pawn" && to[0] === lastRank) {
          move.promotion = pickPromotionPiece(state);
        }

        allMoves.push(move);
      }
    }
  }

  if (allMoves.length === 0) return null;

  return allMoves[Math.floor(Math.random() * allMoves.length)];
}

/**
 * Picks a random promotion piece from the opponent's formation (excluding king).
 * Falls back to "queen" if no valid options exist.
 */
function pickPromotionPiece(state: GameState): Exclude<PieceType, "pawn"> {
  const opponentFormation =
    state.currentTurn === "white" ? state.blackFormation : state.whiteFormation;

  const options = opponentFormation.filter((p) => p !== null && p !== "king");

  if (options.length === 0) return "queen";

  return options[Math.floor(Math.random() * options.length)];
}
