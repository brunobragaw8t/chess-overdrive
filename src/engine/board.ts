import type { Board, Color, Formation, Move, Position } from "./types";

export function createBoard(whiteFormation: Formation, blackFormation: Formation): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col++) {
    // Row 0: white back pieces
    let pieceType = whiteFormation[col];
    if (pieceType) {
      board[0][col] = { type: pieceType, color: "white" };
    }

    // Row 1: white pawns
    board[1][col] = { type: "pawn", color: "white" };

    // Row 6: black pawns
    board[6][col] = { type: "pawn", color: "black" };

    // Row 7: black back pieces (mirrored)
    pieceType = blackFormation[7 - col];
    if (pieceType) {
      board[7][col] = { type: pieceType, color: "black" };
    }
  }

  return board;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getPawnMoves(board: Board, row: number, col: number, color: Color): Position[] {
  const moves: Position[] = [];
  const direction = color === "white" ? 1 : -1;
  const startRow = color === "white" ? 1 : 6;

  // Single push
  const oneAhead = row + direction;
  const isOneAheadEmpty = inBounds(oneAhead, col) && board[oneAhead][col] === null;
  if (isOneAheadEmpty) {
    moves.push([oneAhead, col]);

    // Double push from starting rank
    const twoAhead = row + 2 * direction;
    const isTwoAheadEmpty =
      row === startRow && inBounds(twoAhead, col) && board[twoAhead][col] === null;
    if (isTwoAheadEmpty) {
      moves.push([twoAhead, col]);
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const nc = col + dc;

    if (inBounds(oneAhead, nc)) {
      const target = board[oneAhead][nc];

      if (target && target.color !== color) {
        moves.push([oneAhead, nc]);
      }
    }
  }

  return moves;
}

const ROOK_DIRECTIONS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const BISHOP_DIRECTIONS: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const QUEEN_DIRECTIONS: [number, number][] = [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS];

function getSlidingMoves(
  board: Board,
  row: number,
  col: number,
  color: Color,
  directions: [number, number][],
): Position[] {
  const moves: Position[] = [];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (inBounds(r, c)) {
      const target = board[r][c];

      if (target) {
        if (target.color !== color) {
          moves.push([r, c]); // capture
        }

        break; // stop after capturing or blocked by friendly piece
      }

      moves.push([r, c]);
      r += dr;
      c += dc;
    }
  }

  return moves;
}

const KING_OFFSETS: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const KNIGHT_OFFSETS: [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

function getJumpMoves(
  board: Board,
  row: number,
  col: number,
  color: Color,
  offsets: [number, number][],
): Position[] {
  const moves: Position[] = [];

  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;

    if (!inBounds(r, c)) continue;

    const target = board[r][c];

    if (target && target.color === color) continue; // friendly

    moves.push([r, c]);
  }

  return moves;
}

export function getValidMoves(board: Board, position: Position): Position[] {
  const [row, col] = position;
  const piece = board[row][col];

  if (!piece) return [];

  switch (piece.type) {
    case "pawn":
      return getPawnMoves(board, row, col, piece.color);
    case "rook":
      return getSlidingMoves(board, row, col, piece.color, ROOK_DIRECTIONS);
    case "bishop":
      return getSlidingMoves(board, row, col, piece.color, BISHOP_DIRECTIONS);
    case "queen":
      return getSlidingMoves(board, row, col, piece.color, QUEEN_DIRECTIONS);
    case "knight":
      return getJumpMoves(board, row, col, piece.color, KNIGHT_OFFSETS);
    case "king":
      return getJumpMoves(board, row, col, piece.color, KING_OFFSETS);
    default:
      return [];
  }
}

export function applyMove(board: Board, move: Move): Board {
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;

  const piece = board[fromRow][fromCol];
  if (!piece) {
    throw new Error("No piece at source");
  }

  const validMoves = getValidMoves(board, move.from);
  const isValid = validMoves.some(([r, c]) => r === toRow && c === toCol);
  if (!isValid) {
    throw new Error("Invalid move");
  }

  // Deep clone the board
  const newBoard: Board = board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;

  return newBoard;
}
