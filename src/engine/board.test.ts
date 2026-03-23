import { describe, expect, it } from "vitest";
import { applyMove, createBoard, getValidMoves } from "./board";
import type { Board, Formation, Piece } from "./types";

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function place(board: Board, row: number, col: number, piece: Piece): Board {
  board[row][col] = piece;
  return board;
}

describe("createBoard", () => {
  it("places pieces correctly with two full formations", () => {
    const whiteFormation: Formation = [
      "rook",
      "knight",
      "bishop",
      "queen",
      "king",
      "bishop",
      "knight",
      "rook",
    ];
    const blackFormation: Formation = [
      "rook",
      "knight",
      "bishop",
      "queen",
      "king",
      "bishop",
      "knight",
      "rook",
    ];

    const board = createBoard(whiteFormation, blackFormation);

    expect(board).toHaveLength(8);

    for (const row of board) {
      expect(row).toHaveLength(8);
    }

    // Row 0: white back pieces
    expect(board[0][0]).toEqual({ type: "rook", color: "white" });
    expect(board[0][1]).toEqual({ type: "knight", color: "white" });
    expect(board[0][2]).toEqual({ type: "bishop", color: "white" });
    expect(board[0][3]).toEqual({ type: "queen", color: "white" });
    expect(board[0][4]).toEqual({ type: "king", color: "white" });
    expect(board[0][5]).toEqual({ type: "bishop", color: "white" });
    expect(board[0][6]).toEqual({ type: "knight", color: "white" });
    expect(board[0][7]).toEqual({ type: "rook", color: "white" });

    // Row 1: white pawns
    for (let col = 0; col < 8; col++) {
      expect(board[1][col]).toEqual({ type: "pawn", color: "white" });
    }

    // Rows 2–5: empty
    for (let row = 2; row <= 5; row++) {
      for (let col = 0; col < 8; col++) {
        expect(board[row][col]).toBeNull();
      }
    }

    // Row 6: black pawns
    for (let col = 0; col < 8; col++) {
      expect(board[6][col]).toEqual({ type: "pawn", color: "black" });
    }

    // Row 7: black back pices (mirrored horrizontally)
    expect(board[7][0]).toEqual({ type: "rook", color: "black" });
    expect(board[7][1]).toEqual({ type: "knight", color: "black" });
    expect(board[7][2]).toEqual({ type: "bishop", color: "black" });
    expect(board[7][3]).toEqual({ type: "king", color: "black" });
    expect(board[7][4]).toEqual({ type: "queen", color: "black" });
    expect(board[7][5]).toEqual({ type: "bishop", color: "black" });
    expect(board[7][6]).toEqual({ type: "knight", color: "black" });
    expect(board[7][7]).toEqual({ type: "rook", color: "black" });
  });

  it("leaves back-row squares empty for null formation slots, pawns still fill", () => {
    const whiteFormation: Formation = ["rook", null, null, "queen", "king", null, null, "rook"];
    const blackFormation: Formation = ["rook", null, "rook", "queen", "king", "bishop", null, null];

    const board = createBoard(whiteFormation, blackFormation);

    // White back pieces
    expect(board[0][0]).toEqual({ type: "rook", color: "white" });
    expect(board[0][1]).toBeNull();
    expect(board[0][2]).toBeNull();
    expect(board[0][3]).toEqual({ type: "queen", color: "white" });
    expect(board[0][4]).toEqual({ type: "king", color: "white" });
    expect(board[0][5]).toBeNull();
    expect(board[0][6]).toBeNull();
    expect(board[0][7]).toEqual({ type: "rook", color: "white" });

    // White pawns still all present
    for (let col = 0; col < 8; col++) {
      expect(board[1][col]).toEqual({ type: "pawn", color: "white" });
    }

    // Black pawns still all present
    for (let col = 0; col < 8; col++) {
      expect(board[6][col]).toEqual({ type: "pawn", color: "black" });
    }

    // Black back pieces (mirrored)
    expect(board[7][0]).toBeNull();
    expect(board[7][1]).toBeNull();
    expect(board[7][2]).toEqual({ type: "bishop", color: "black" });
    expect(board[7][3]).toEqual({ type: "king", color: "black" });
    expect(board[7][4]).toEqual({ type: "queen", color: "black" });
    expect(board[7][5]).toEqual({ type: "rook", color: "black" });
    expect(board[7][6]).toBeNull();
    expect(board[7][7]).toEqual({ type: "rook", color: "black" });
  });
});

describe("getValidMoves", () => {
  // Sort positions for deterministic comparison
  function sorted(positions: [number, number][]) {
    return [...positions].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }

  describe("pawn", () => {
    it("white pawn: single push forward from non-starting rank", () => {
      const board = emptyBoard();
      place(board, 3, 4, { type: "pawn", color: "white" });

      const moves = getValidMoves(board, [3, 4]);
      expect(sorted(moves)).toEqual([[4, 4]]);
    });

    it("white pawn: single and double push from starting rank", () => {
      const board = emptyBoard();
      place(board, 1, 4, { type: "pawn", color: "white" });

      const moves = getValidMoves(board, [1, 4]);
      expect(sorted(moves)).toEqual([
        [2, 4],
        [3, 4],
      ]);
    });

    it("white pawn: blocked by piece directly ahead", () => {
      const board = emptyBoard();
      place(board, 1, 4, { type: "pawn", color: "white" });
      place(board, 2, 4, { type: "pawn", color: "black" });

      const moves = getValidMoves(board, [1, 4]);
      expect(moves).toEqual([]);
    });

    it("white pawn: double push blocked by piece two squares ahead", () => {
      const board = emptyBoard();
      place(board, 1, 4, { type: "pawn", color: "white" });
      place(board, 3, 4, { type: "pawn", color: "black" });

      const moves = getValidMoves(board, [1, 4]);
      expect(sorted(moves)).toEqual([[2, 4]]);
    });

    it("white pawn: diagonal capture", () => {
      const board = emptyBoard();
      place(board, 3, 4, { type: "pawn", color: "white" });
      place(board, 4, 3, { type: "pawn", color: "black" });
      place(board, 4, 5, { type: "knight", color: "black" });

      const moves = getValidMoves(board, [3, 4]);
      expect(sorted(moves)).toEqual([
        [4, 3],
        [4, 4],
        [4, 5],
      ]);
    });

    it("black pawn: single push forward from non-starting rank", () => {
      const board = emptyBoard();
      place(board, 7, 4, { type: "pawn", color: "black" });

      const moves = getValidMoves(board, [7, 4]);
      expect(sorted(moves)).toEqual([[6, 4]]);
    });

    it("black pawn: double push blocked by piece two squares ahead", () => {
      const board = emptyBoard();
      place(board, 6, 4, { type: "pawn", color: "black" });
      place(board, 4, 4, { type: "pawn", color: "white" });

      const moves = getValidMoves(board, [6, 4]);
      expect(sorted(moves)).toEqual([[5, 4]]);
    });

    it("black pawn: diagonal capture", () => {
      const board = emptyBoard();
      place(board, 4, 4, { type: "pawn", color: "black" });
      place(board, 3, 3, { type: "rook", color: "white" });
      place(board, 3, 5, { type: "knight", color: "white" });

      const moves = getValidMoves(board, [4, 4]);
      expect(sorted(moves)).toEqual([
        [3, 3],
        [3, 4],
        [3, 5],
      ]);
    });
  });

  describe("rook", () => {
    it("slides horizontally and vertically on empty board", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "rook", color: "white" });

      const moves = getValidMoves(board, [3, 3]);

      expect(sorted(moves)).toEqual(
        sorted([
          // Column
          [0, 3],
          [1, 3],
          [2, 3],
          [4, 3],
          [5, 3],
          [6, 3],
          [7, 3],
          // Row
          [3, 0],
          [3, 1],
          [3, 2],
          [3, 4],
          [3, 5],
          [3, 6],
          [3, 7],
        ]),
      );
    });

    it("is blocked by pieces and can capture opponent", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "rook", color: "white" });
      place(board, 3, 5, { type: "pawn", color: "white" }); // friendly blocks
      place(board, 5, 3, { type: "pawn", color: "black" }); // enemy can capture

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          // Up col
          [0, 3],
          [1, 3],
          [2, 3],
          // Down col
          [4, 3],
          [5, 3],
          // Left row
          [3, 0],
          [3, 1],
          [3, 2],
          // Right row
          [3, 4],
        ]),
      );
    });

    it("stops after capturing, cannot continue through captured piece", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "rook", color: "white" });
      // Two black pieces in a line to the right
      place(board, 3, 5, { type: "pawn", color: "black" });
      place(board, 3, 7, { type: "pawn", color: "black" });

      const moves = getValidMoves(board, [3, 3]);
      // Can reach col 5 (capture), but NOT col 6 or 7
      expect(moves).toContainEqual([3, 5]);
      expect(moves).not.toContainEqual([3, 6]);
      expect(moves).not.toContainEqual([3, 7]);
    });
  });

  describe("bishop", () => {
    it("slides diagonally on empty board", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "bishop", color: "white" });

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          // Top right
          [4, 4],
          [5, 5],
          [6, 6],
          [7, 7],
          // Top left
          [4, 2],
          [5, 1],
          [6, 0],
          // Bottom right
          [2, 4],
          [1, 5],
          [0, 6],
          // Bottom left
          [2, 2],
          [1, 1],
          [0, 0],
        ]),
      );
    });

    it("is blocked by pieces and can capture opponent", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "bishop", color: "white" });
      place(board, 5, 5, { type: "pawn", color: "black" }); // capture
      place(board, 1, 1, { type: "pawn", color: "white" }); // friendly blocks

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          // Top right
          [4, 4],
          [5, 5], // capture
          // Top left
          [4, 2],
          [5, 1],
          [6, 0],
          // Bottom right
          [2, 4],
          [1, 5],
          [0, 6],
          // Bottom left
          [2, 2],
          // [1, 1] friendly blocked
        ]),
      );
    });
  });

  describe("queen", () => {
    it("combines rook and bishop movement", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "queen", color: "white" });

      const moves = getValidMoves(board, [3, 3]);
      // Should be rook moves + bishop moves from same position
      const rookBoard = emptyBoard();
      place(rookBoard, 3, 3, { type: "rook", color: "white" });
      const bishopBoard = emptyBoard();
      place(bishopBoard, 3, 3, { type: "bishop", color: "white" });

      const rookMoves = getValidMoves(rookBoard, [3, 3]);
      const bishopMoves = getValidMoves(bishopBoard, [3, 3]);

      expect(sorted(moves)).toEqual(sorted([...rookMoves, ...bishopMoves]));
    });
  });

  describe("knight", () => {
    it("L-shape moves on empty board", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "knight", color: "white" });

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          [1, 2],
          [1, 4],
          [2, 1],
          [2, 5],
          [4, 1],
          [4, 5],
          [5, 2],
          [5, 4],
        ]),
      );
    });

    it("jumps over pieces and captures opponent", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "knight", color: "white" });
      // Surround with pieces to jump over
      place(board, 3, 2, { type: "pawn", color: "white" });
      place(board, 3, 4, { type: "pawn", color: "white" });
      place(board, 2, 3, { type: "pawn", color: "white" });
      place(board, 4, 3, { type: "pawn", color: "white" });
      // Enemy on one landing square
      place(board, 1, 2, { type: "pawn", color: "black" });

      const moves = getValidMoves(board, [3, 3]);
      // All 8 L-shape squares, including the one with enemy (capture)
      expect(sorted(moves)).toEqual(
        sorted([
          [1, 2], // capture
          [1, 4],
          [2, 1],
          [2, 5],
          [4, 1],
          [4, 5],
          [5, 2],
          [5, 4],
        ]),
      );
    });

    it("cannot land on friendly pieces", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "knight", color: "white" });
      place(board, 1, 2, { type: "pawn", color: "white" }); // friendly on landing

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          // [1, 2] excluded friendly piece
          [1, 4],
          [2, 1],
          [2, 5],
          [4, 1],
          [4, 5],
          [5, 2],
          [5, 4],
        ]),
      );
    });

    it("respects board edges (corner knight)", () => {
      const board = emptyBoard();
      place(board, 0, 0, { type: "knight", color: "white" });

      const moves = getValidMoves(board, [0, 0]);
      expect(sorted(moves)).toEqual(
        sorted([
          [1, 2],
          [2, 1],
        ]),
      );
    });
  });

  describe("king", () => {
    it("moves one square in any direction", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "king", color: "white" });

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          [2, 2],
          [2, 3],
          [2, 4],
          [3, 2],
          [3, 4],
          [4, 2],
          [4, 3],
          [4, 4],
        ]),
      );
    });

    it("can move into squares attacked by opponent (no check restriction)", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "king", color: "white" });
      // Black rook attacks the entire row 4
      place(board, 4, 7, { type: "rook", color: "black" });

      const moves = getValidMoves(board, [3, 3]);
      // King can still move to row 4 squares despite being "attacked"
      expect(sorted(moves)).toEqual(
        sorted([
          [2, 2],
          [2, 3],
          [2, 4],
          [3, 2],
          [3, 4],
          [4, 2],
          [4, 3],
          [4, 4],
        ]),
      );
    });

    it("cannot move to square occupied by friendly piece", () => {
      const board = emptyBoard();
      place(board, 3, 3, { type: "king", color: "white" });
      place(board, 3, 4, { type: "pawn", color: "white" });

      const moves = getValidMoves(board, [3, 3]);
      expect(sorted(moves)).toEqual(
        sorted([
          [2, 2],
          [2, 3],
          [2, 4],
          [3, 2],
          // [3, 4] excluded friendly piece
          [4, 2],
          [4, 3],
          [4, 4],
        ]),
      );
    });

    it("at board edge has limited moves", () => {
      const board = emptyBoard();
      place(board, 0, 0, { type: "king", color: "white" });

      const moves = getValidMoves(board, [0, 0]);
      expect(sorted(moves)).toEqual(
        sorted([
          [0, 1],
          [1, 0],
          [1, 1],
        ]),
      );
    });
  });
});

describe("applyMove", () => {
  it("moves piece to target square and clears source", () => {
    const board = emptyBoard();
    place(board, 1, 4, { type: "pawn", color: "white" });

    const newBoard = applyMove(board, { from: [1, 4], to: [3, 4] });

    expect(newBoard[1][4]).toBeNull();
    expect(newBoard[3][4]).toEqual({ type: "pawn", color: "white" });
  });

  it("captures opponent piece (replaced on target square)", () => {
    const board = emptyBoard();
    place(board, 3, 4, { type: "pawn", color: "white" });
    place(board, 4, 5, { type: "knight", color: "black" });

    const newBoard = applyMove(board, { from: [3, 4], to: [4, 5] });

    expect(newBoard[3][4]).toBeNull();
    expect(newBoard[4][5]).toEqual({ type: "pawn", color: "white" });
  });

  it("does not mutate the original board (immutable)", () => {
    const board = emptyBoard();
    place(board, 1, 4, { type: "pawn", color: "white" });

    const newBoard = applyMove(board, { from: [1, 4], to: [3, 4] });

    // Original board unchanged
    expect(board[1][4]).toEqual({ type: "pawn", color: "white" });
    expect(board[3][4]).toBeNull();
    // New board has move applied
    expect(newBoard[1][4]).toBeNull();
    expect(newBoard[3][4]).toEqual({ type: "pawn", color: "white" });
  });

  it("throws when source square is empty", () => {
    const board = emptyBoard();

    expect(() => applyMove(board, { from: [3, 3], to: [4, 3] })).toThrow("No piece at source");
  });

  it("throws when move is not valid for the piece", () => {
    const board = emptyBoard();
    place(board, 1, 4, { type: "pawn", color: "white" });

    // Pawn can't move sideways
    expect(() => applyMove(board, { from: [1, 4], to: [1, 5] })).toThrow("Invalid move");
  });
});
