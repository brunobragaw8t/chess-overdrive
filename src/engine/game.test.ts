import { describe, expect, it } from "vitest";
import { initGame, getValidMoves, applyMove } from "./game";
import type { Board, Formation, GameState } from "./types";

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

const DEFAULT_FORMATION: Formation = [
  "rook",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "rook",
];

describe("initGame", () => {
  it("creates a game with white to move, active status, and null result", () => {
    const state = initGame(DEFAULT_FORMATION, DEFAULT_FORMATION);

    expect(state.currentTurn).toBe("white");
    expect(state.status).toBe("active");
    expect(state.result).toBeNull();
    expect(state.board).toHaveLength(8);
    expect(state.board[0][4]).toEqual({ type: "king", color: "white" });
    expect(state.whiteFormation).toEqual(DEFAULT_FORMATION);
    expect(state.blackFormation).toEqual(DEFAULT_FORMATION);
  });
});

describe("getValidMoves", () => {
  it("returns empty for opponent's pieces (not their turn)", () => {
    const state = initGame(DEFAULT_FORMATION, DEFAULT_FORMATION);

    // It's white's turn, so black pawn should have no valid moves
    const moves = getValidMoves(state, [6, 0]);
    expect(moves).toEqual([]);
  });

  it("returns moves for current turn's pieces", () => {
    const state = initGame(DEFAULT_FORMATION, DEFAULT_FORMATION);

    // It's white's turn, so white pawn should have moves
    const moves = getValidMoves(state, [1, 4]);
    expect(moves.length).toBeGreaterThan(0);
  });
});

describe("applyMove", () => {
  it("alternates turn after a move", () => {
    const state = initGame(DEFAULT_FORMATION, DEFAULT_FORMATION);
    expect(state.currentTurn).toBe("white");

    const next = applyMove(state, { from: [1, 4], to: [3, 4] });
    expect(next.currentTurn).toBe("black");
  });

  it("rejects out-of-turn move", () => {
    const state = initGame(DEFAULT_FORMATION, DEFAULT_FORMATION);
    expect(() => applyMove(state, { from: [6, 4], to: [4, 4] })).toThrow("Not your turn");
  });

  it("detects king capture: white captures black king → white wins", () => {
    const board: Board = emptyBoard();
    board[0][4] = { type: "king", color: "white" };
    board[6][4] = { type: "queen", color: "white" };
    board[7][4] = { type: "king", color: "black" };

    const state: GameState = {
      board,
      currentTurn: "white",
      status: "active",
      result: null,
      whiteFormation: DEFAULT_FORMATION,
      blackFormation: DEFAULT_FORMATION,
    };

    const next = applyMove(state, { from: [6, 4], to: [7, 4] });
    expect(next.status).toBe("finished");
    expect(next.result).toBe("white_wins");
  });

  it("detects king capture: black captures white king → black wins", () => {
    const board: Board = emptyBoard();
    board[7][4] = { type: "king", color: "black" };
    board[1][4] = { type: "queen", color: "black" };
    board[0][4] = { type: "king", color: "white" };

    const state: GameState = {
      board,
      currentTurn: "black",
      status: "active",
      result: null,
      whiteFormation: DEFAULT_FORMATION,
      blackFormation: DEFAULT_FORMATION,
    };

    const next = applyMove(state, { from: [1, 4], to: [0, 4] });
    expect(next.status).toBe("finished");
    expect(next.result).toBe("black_wins");
  });

  it("promotes a pawn reaching the last rank with a valid promotion choice", () => {
    const board: Board = emptyBoard();
    board[0][4] = { type: "king", color: "white" };
    board[7][4] = { type: "king", color: "black" };
    board[6][0] = { type: "pawn", color: "white" };

    const state: GameState = {
      board,
      currentTurn: "white",
      status: "active",
      result: null,
      whiteFormation: DEFAULT_FORMATION,
      blackFormation: DEFAULT_FORMATION,
    };

    const next = applyMove(state, { from: [6, 0], to: [7, 0], promotion: "queen" });
    expect(next.board[7][0]).toEqual({ type: "queen", color: "white" });
    expect(next.board[6][0]).toBeNull();
  });

  it("rejects pawn move to last rank without promotion field", () => {
    const board: Board = emptyBoard();
    board[0][4] = { type: "king", color: "white" };
    board[7][4] = { type: "king", color: "black" };
    board[6][0] = { type: "pawn", color: "white" };

    const state: GameState = {
      board,
      currentTurn: "white",
      status: "active",
      result: null,
      whiteFormation: DEFAULT_FORMATION,
      blackFormation: DEFAULT_FORMATION,
    };

    expect(() => applyMove(state, { from: [6, 0], to: [7, 0] })).toThrow(
      "Promotion piece type required",
    );
  });

  it("rejects promotion to a piece type not in opponent's formation", () => {
    const board: Board = emptyBoard();
    board[0][4] = { type: "king", color: "white" };
    board[7][4] = { type: "king", color: "black" };
    board[6][0] = { type: "pawn", color: "white" };

    // Opponent's formation has no bishop
    const limitedFormation: Formation = ["rook", null, null, "queen", "king", null, null, "rook"];

    const state: GameState = {
      board,
      currentTurn: "white",
      status: "active",
      result: null,
      whiteFormation: DEFAULT_FORMATION,
      blackFormation: limitedFormation,
    };

    expect(() => applyMove(state, { from: [6, 0], to: [7, 0], promotion: "bishop" })).toThrow(
      "Invalid promotion choice",
    );
  });
});
