import {
  createBoard,
  getValidMoves as getBoardValidMoves,
  applyMove as applyBoardMove,
} from "./board";
import type { Color, Formation, GameState, Move, Position } from "./types";

export function initGame(whiteFormation: Formation, blackFormation: Formation): GameState {
  return {
    board: createBoard(whiteFormation, blackFormation),
    currentTurn: "white",
    status: "active",
    result: null,
    whiteFormation,
    blackFormation,
  };
}

export function getValidMoves(state: GameState, position: Position): Position[] {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece || piece.color !== state.currentTurn) return [];

  return getBoardValidMoves(state.board, position);
}

export function applyMove(state: GameState, move: Move): GameState {
  const [fromRow, fromCol] = move.from;
  const piece = state.board[fromRow][fromCol];

  if (!piece || piece.color !== state.currentTurn) {
    throw new Error("Not your turn");
  }

  const [toRow, toCol] = move.to;
  const captured = state.board[toRow][toCol];

  const lastRank = state.currentTurn === "white" ? 7 : 0;
  const isPromotion = piece.type === "pawn" && toRow === lastRank;

  if (isPromotion) {
    if (!move.promotion) {
      throw new Error("Promotion piece type required");
    }

    const opponentFormation =
      state.currentTurn === "white" ? state.blackFormation : state.whiteFormation;

    if (!opponentFormation.includes(move.promotion)) {
      throw new Error("Invalid promotion choice: piece type not in opponent's formation");
    }
  }

  const newBoard = applyBoardMove(state.board, move);
  const nextTurn: Color = state.currentTurn === "white" ? "black" : "white";

  if (isPromotion && move.promotion) {
    newBoard[toRow][toCol] = { type: move.promotion, color: state.currentTurn };
  }

  if (captured?.type === "king") {
    return {
      ...state,
      board: newBoard,
      currentTurn: nextTurn,
      status: "finished",
      result: state.currentTurn === "white" ? "white_wins" : "black_wins",
    };
  }

  return {
    ...state,
    board: newBoard,
    currentTurn: nextTurn,
  };
}
