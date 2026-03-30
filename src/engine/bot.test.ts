import { describe, expect, it } from "vitest";
import { getValidMoves } from "./game";
import type { Board, Formation, GameState } from "./types";
import { pickBotMove } from "./bot";

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

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: emptyBoard(),
    currentTurn: "white",
    status: "active",
    result: null,
    whiteFormation: DEFAULT_FORMATION,
    blackFormation: DEFAULT_FORMATION,
    ...overrides,
  };
}

describe("pickBotMove", () => {
  it("returns a valid move from an initial board", () => {
    const state: GameState = {
      board: emptyBoard(),
      currentTurn: "white",
      status: "active",
      result: null,
      whiteFormation: DEFAULT_FORMATION,
      blackFormation: DEFAULT_FORMATION,
    };

    // Set up a standard starting position manually
    for (let col = 0; col < 8; col++) {
      state.board[1][col] = { type: "pawn", color: "white" };
      state.board[6][col] = { type: "pawn", color: "black" };
    }
    state.board[0][4] = { type: "king", color: "white" };
    state.board[7][4] = { type: "king", color: "black" };

    const move = pickBotMove(state);

    expect(move).not.toBeNull();

    const validTargets = getValidMoves(state, move!.from);
    const isValid = validTargets.some(([r, c]) => r === move!.to[0] && c === move!.to[1]);
    expect(isValid).toBe(true);
  });

  it("includes promotion field when pawn reaches the last rank", () => {
    const board = emptyBoard();

    board[6][0] = { type: "pawn", color: "white" };

    const state = makeState({ board, currentTurn: "white" });
    const move = pickBotMove(state);

    expect(move).not.toBeNull();
    expect(move!.from).toEqual([6, 0]);
    expect(move!.to[0]).toBe(7); // reaches last row
    expect(move!.promotion).toBeDefined();
    expect(["rook", "knight", "bishop", "queen"]).toContain(move!.promotion);
  });

  it("picks promotion piece from opponent's formation", () => {
    const board = emptyBoard();
    board[6][7] = { type: "pawn", color: "white" };

    const limitedFormation: Formation = ["rook", null, null, null, "king", null, null, "rook"];

    const state = makeState({
      board,
      currentTurn: "white",
      blackFormation: limitedFormation,
    });

    const move = pickBotMove(state);

    expect(move).not.toBeNull();
    expect(move!.from).toEqual([6, 7]);
    expect(move!.to[0]).toBe(7);
    expect(move!.promotion).toBe("rook");
  });
});
