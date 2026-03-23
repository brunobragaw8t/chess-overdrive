export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";

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
  promotion?: PieceType;
};

export type Formation = (PieceType | null)[];
