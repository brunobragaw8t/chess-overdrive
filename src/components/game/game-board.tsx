import { useCallback, useState } from "react";
import { getValidMoves } from "../../engine/game";
import type {
  Board,
  Color,
  Formation,
  GameResult,
  GameStatus,
  PieceType,
  Position,
} from "../../engine/types";
import { cn } from "../../lib/utils";
import { MonoLabel } from "../ui/mono-label";
import type { Id } from "../../../convex/_generated/dataModel";

const PIECE_ICONS: Record<string, string> = {
  pawn: "\u265F",
  rook: "\u265C",
  knight: "\u265E",
  bishop: "\u265D",
  queen: "\u265B",
  king: "\u265A",
};

export type GameData = {
  board: Board;
  currentTurn: Color;
  status: GameStatus;
  result: GameResult | null;
  whiteFormation: Formation;
  blackFormation: Formation;
  lastMoveFrom?: number[] | null;
  lastMoveTo?: number[] | null;
  whitePlayerName: string;
  blackPlayerName: string;
  callerColor: Color;
};

type GameBoardProps = {
  game: GameData;
  gameId: Id<"games">;
  submitMove: (args: {
    gameId: Id<"games">;
    from: number[];
    to: number[];
    promotion?: Exclude<PieceType, "pawn">;
  }) => void;
};

type PendingPromotion = {
  from: Position;
  to: Position;
  choices: Exclude<PieceType, "pawn">[];
};

export function GameBoard({ game, gameId, submitMove }: GameBoardProps) {
  const { board, callerColor, currentTurn, status } = game;

  const isFlipped = callerColor === "black";

  const isMyTurn = callerColor === currentTurn && status === "active";

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const gameState = {
    board: game.board,
    currentTurn: game.currentTurn,
    status: game.status,
    result: game.result,
    whiteFormation: game.whiteFormation,
    blackFormation: game.blackFormation,
  };

  const isValidMove = useCallback(
    (row: number, col: number) => validMoves.some(([r, c]) => r === row && c === col),
    [validMoves],
  );

  function getPromotionChoices(): Exclude<PieceType, "pawn">[] {
    const opponentFormation = callerColor === "white" ? game.blackFormation : game.whiteFormation;

    const unique = new Set<Exclude<PieceType, "pawn">>();

    for (const piece of opponentFormation) {
      if (piece && piece !== "king") unique.add(piece);
    }

    return Array.from(unique);
  }

  function handleSquareClick(row: number, col: number) {
    if (status !== "active" || pendingPromotion) return;

    if (selectedPos && isValidMove(row, col)) {
      const piece = board[selectedPos[0]][selectedPos[1]];
      const lastRow = callerColor === "white" ? 7 : 0;
      const shouldPromote = piece?.type === "pawn" && row === lastRow;

      if (shouldPromote) {
        const choices = getPromotionChoices();

        setPendingPromotion({
          from: [...selectedPos],
          to: [row, col],
          choices,
        });

        return;
      }

      submitMove({
        gameId,
        from: [...selectedPos],
        to: [row, col],
      });

      setSelectedPos(null);
      setValidMoves([]);

      return;
    }

    const piece = board[row][col];
    if (piece && piece.color === callerColor && isMyTurn) {
      const pos: Position = [row, col];
      const moves = getValidMoves(gameState, pos);

      setSelectedPos(pos);
      setValidMoves(moves);

      return;
    }

    setSelectedPos(null);
    setValidMoves([]);
  }

  function handlePromotionChoice(pieceType: Exclude<PieceType, "pawn">) {
    if (!pendingPromotion) return;

    submitMove({
      gameId,
      from: [...pendingPromotion.from],
      to: [...pendingPromotion.to],
      promotion: pieceType,
    });

    setPendingPromotion(null);
    setSelectedPos(null);
    setValidMoves([]);
  }

  const rows = Array.from({ length: 8 }, (_, i) => (isFlipped ? 7 - i : i));
  const cols = Array.from({ length: 8 }, (_, i) => (isFlipped ? 7 - i : i));

  return (
    <div className="relative">
      <div
        data-testid="game-board"
        className="border-border-hard inline-grid grid-cols-8 border-[3px]"
      >
        {rows.map((row) =>
          cols.map((col) => {
            const piece = board[row][col];
            const isDark = (row + col) % 2 === 1;
            const isSelected = selectedPos?.[0] === row && selectedPos?.[1] === col;
            const isTarget = isValidMove(row, col);
            const isLastMove =
              (game.lastMoveFrom?.[0] === row && game.lastMoveFrom?.[1] === col) ||
              (game.lastMoveTo?.[0] === row && game.lastMoveTo?.[1] === col);

            return (
              <div
                key={`${row}-${col}`}
                data-testid={`square-${row}-${col}`}
                data-selected={isSelected ? "true" : undefined}
                data-valid-move={isTarget ? "true" : undefined}
                data-last-move={isLastMove ? "true" : undefined}
                onClick={() => handleSquareClick(row, col)}
                className={cn(
                  "flex h-16 w-16 cursor-pointer items-center justify-center text-3xl transition-colors",
                  isDark ? "bg-bg-inset" : "bg-surface",
                  isSelected && "ring-accent ring-2 ring-inset",
                  isTarget && "bg-accent/20",
                  isLastMove && !isSelected && !isTarget && "bg-accent/10",
                )}
              >
                {piece && (
                  <span
                    data-testid={`piece-${row}-${col}`}
                    className={cn(
                      "select-none",
                      piece.color === "white" ? "text-accent-pale" : "text-text-dim",
                    )}
                  >
                    {PIECE_ICONS[piece.type]}
                  </span>
                )}

                {isTarget && !piece && <div className="bg-accent/50 h-3 w-3 rounded-full" />}
              </div>
            );
          }),
        )}
      </div>

      {pendingPromotion && (
        <div
          data-testid="promotion-picker"
          className="bg-bg/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm"
        >
          <div className="border-border-hard bg-bg-raised animate-stamp border-[3px] p-6">
            <MonoLabel size="sm" tone="muted" tracking="wider" className="mb-4 block text-center">
              PROMOTE_PAWN
            </MonoLabel>

            <div className="flex gap-3">
              {pendingPromotion.choices.map((pieceType) => (
                <button
                  key={pieceType}
                  data-testid={`promote-${pieceType}`}
                  type="button"
                  onClick={() => handlePromotionChoice(pieceType)}
                  className="border-border-hard hover:border-accent hover:bg-accent/10 flex h-16 w-16 cursor-pointer items-center justify-center border-[3px] text-3xl transition-colors"
                >
                  <span className="text-accent-pale">{PIECE_ICONS[pieceType]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
