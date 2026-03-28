export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";

export type Color = "white" | "black";

export type Piece = {
  type: PieceType;
  color: Color;
};

export type Board = (Piece | null)[][];

export type Position = [row: number, col: number];

export type Move = {
  from: Position;
  to: Position;
  promotion?: Exclude<PieceType, "pawn">;
};

export type Formation = (Exclude<PieceType, "pawn"> | null)[];

export type GameStatus = "active" | "finished";

export type GameResult = "white_wins" | "black_wins";

export type GameState = {
  board: Board;
  currentTurn: Color;
  status: GameStatus;
  result: GameResult | null;
  whiteFormation: Formation;
  blackFormation: Formation;
};
