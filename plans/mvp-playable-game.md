# Plan: MVP Playable Game

> Source PRD: `docs/PRD.md` — User Stories 32, 34, 37–44, 46–48, 54–55

## Architectural decisions

Durable decisions that apply across all phases:

- **Game engine**: Pure-TypeScript module in `src/engine/`, no Convex or React imports. All chess logic (move validation, board state, king-capture win condition, pawn promotion) lives here. Convex mutations import and call into this module. Unit-testable in isolation.
- **Board representation**: 8×8 array of `{ type: PieceType, color: "white" | "black" } | null`. Serialized as JSON in the `games.boardState` field. Later, an `abilities` property can be added to cells for card effects.
- **Move representation**: `{ from: [row, col], to: [row, col], promotion?: PieceType }`. Coordinates are 0-indexed, row 0 = white's back rank, row 7 = black's back rank.
- **Game rules**: King-capture variant — no check, no checkmate, no stalemate, no en passant, no castling. Game ends when a king is captured. Pawn promotion to a piece type present in the opponent's formation (excluding king). No card effects for MVP.
- **Color assignment**: Lobby host = white, joiner = black.
- **Board initialization**: Server reads both players' formations. White's formation maps to row 0, white pawns fill row 1. Black's formation maps to row 7 (mirrored), black pawns fill row 6. Empty formation slots = empty squares.
- **Schema additions**: `games` table (board state, turn, status, players, heartbeats), `lobbies` table (host, guest, game reference). No `matchmakingQueue` table for MVP.
- **Routes**: `/play` (create lobby), `/lobby/$lobbyId` (waiting room + join), `/game/$gameId` (in-game). All auth-required.
- **Disconnect handling**: Client sends heartbeat every 10 seconds, updating `lastSeenAt` on the game. A Convex scheduled function (cron or per-game scheduled call) checks active games and auto-forfeits players whose `lastSeenAt` exceeds 60 seconds.
- **Testing**: TDD with Vitest. Engine module gets extensive unit tests (edge-runtime project). Convex mutations get integration tests via `convex-test`. Frontend components get tests in the jsdom project.

---

## Phase 1: Game Engine — Board Setup & Piece Movement

**User stories**: 37 (board from player's perspective), 38 (see valid moves), 43 (king moves into attacked squares)

### What to build

The foundational game engine module. A pure-TypeScript library that can create a board from two formations, compute valid moves for any piece, and apply a move to produce a new board state. Covers all standard piece movements for the king-capture variant: pawns (single push, double push from starting rank, diagonal capture), rooks, knights, bishops, queens, and kings — all without check restrictions (king can move into attacked squares).

This phase does NOT handle pawn promotion, win conditions, or turn management — just the board data structure, move generation, and move application.

### Acceptance criteria

- [ ] `src/engine/` exists as a pure-TS module with no Convex or React imports
- [ ] A `createBoard` function accepts two formations (arrays of 8 piece types or null) and returns an 8×8 board with pieces placed correctly (white row 0 + pawns row 1, black row 7 mirrored + pawns row 6)
- [ ] A `getValidMoves` function accepts a board, a position `[row, col]`, and returns an array of valid target positions
- [ ] An `applyMove` function accepts a board and a move, returns a new board state (immutable — does not mutate the input)
- [ ] Pawn movement: single forward, double from starting rank, diagonal capture only
- [ ] Rook movement: horizontal/vertical sliding, blocked by pieces, can capture opponents
- [ ] Bishop movement: diagonal sliding, blocked by pieces, can capture opponents
- [ ] Queen movement: combines rook + bishop
- [ ] Knight movement: L-shape, can jump over pieces, can capture opponents
- [ ] King movement: one square any direction, CAN move into attacked squares (no check restriction)
- [ ] No piece can move to a square occupied by a friendly piece
- [ ] Test: `createBoard` with default formations produces correct initial layout
- [ ] Test: `createBoard` with empty formation slots produces empty back-row squares
- [ ] Test: each piece type's valid moves in open and blocked positions
- [ ] Test: pieces cannot capture friendly pieces
- [ ] Test: king can move to squares attacked by opponent pieces

### TDD behaviors to test

1. `createBoard` with two full formations places pieces correctly on rows 0, 1, 6, 7
2. `createBoard` with empty slots leaves those back-row squares empty
3. Pawn: single push forward, double push from starting rank, cannot double push otherwise
4. Pawn: diagonal capture, cannot move diagonally without target
5. Pawn: blocked by piece directly ahead
6. Rook: slides horizontally/vertically, blocked by pieces, captures opponent
7. Bishop: slides diagonally, blocked by pieces, captures opponent
8. Queen: combines rook and bishop movement
9. Knight: L-shape jumps, ignores blocking pieces, captures opponent
10. King: moves one square any direction, can move into attacked squares
11. No piece can move to a square occupied by a friendly piece
12. `applyMove` returns new board with piece moved and captured piece removed

---

## Phase 2: Game Engine — Pawn Promotion & Win Condition

**User stories**: 42 (game ends on king capture), 44 (pawn promotion to opponent's formation types)

### What to build

Extend the engine with pawn promotion and the king-capture win condition. When a pawn reaches the 8th rank, the move must include a `promotion` field specifying a piece type present in the opponent's formation. The engine validates the promotion choice. After every move, the engine checks whether a king was captured — if so, the game is over.

Also add turn management to the engine: a game state type that wraps the board with the current turn, and turn-aware move validation.

### Acceptance criteria

- [ ] A `GameState` type exists containing `board`, `currentTurn` ("white" | "black"), `status` ("active" | "finished"), and `result` (nullable — "white_wins" | "black_wins")
- [ ] `applyMove` detects king capture and sets status/result accordingly
- [ ] `applyMove` handles pawn promotion: when a pawn reaches the last rank with a valid `promotion` field, the pawn is replaced by the promoted piece type
- [ ] `applyMove` rejects pawn moves to the last rank without a `promotion` field
- [ ] `applyMove` rejects invalid promotion choices (piece type not in opponent's formation)
- [ ] A `getValidMoves` variant or the existing one accounts for pawn promotion targets (last rank)
- [ ] Turn enforcement: `getValidMoves` only returns moves for the current turn's pieces
- [ ] An `initGame` function creates a full `GameState` from two formations (white starts)
- [ ] Test: pawn reaching 8th rank with valid promotion transforms into chosen piece
- [ ] Test: pawn reaching 8th rank without promotion field is rejected
- [ ] Test: promotion to a piece type NOT in opponent's formation is rejected
- [ ] Test: capturing a king sets game status to finished with correct result
- [ ] Test: turn alternates after each move
- [ ] Test: moving out of turn is rejected

### TDD behaviors to test

1. `initGame` creates a game with white to move, active status, null result
2. Pawn promotion: valid promotion transforms the pawn
3. Pawn promotion: missing promotion field on last-rank move is rejected
4. Pawn promotion: invalid piece type (not in opponent's formation) is rejected
5. King capture: capturing white king → black wins
6. King capture: capturing black king → white wins
7. Turn alternation: after white moves, it's black's turn
8. Out-of-turn move is rejected

---

## Phase 3: Schema & Lobby Backend

**User stories**: 32 (create a casual lobby), 34 (invite via link)

### What to build

A complete vertical slice for the lobby system. Add `lobbies` and `games` tables to the Convex schema. Create mutations for creating a lobby, joining a lobby (which creates a game), and a query for lobby state. When a guest joins a lobby, the server reads both players' formations, initializes the board via the game engine, creates a game record, and links it to the lobby.

### Acceptance criteria

- [ ] `convex/schema.ts` has a `lobbies` table with fields: `hostUserId`, `guestUserId` (optional), `status` ("waiting" | "active" | "finished"), `gameId` (optional ref to games)
- [ ] `convex/schema.ts` has a `games` table with fields: `whitePlayerId`, `blackPlayerId`, `boardState` (serialized JSON string), `currentTurn` ("white" | "black"), `status` ("active" | "finished"), `result` (optional — "white_wins" | "black_wins"), `whiteLastSeenAt`, `blackLastSeenAt`, `lastMoveFrom` (optional), `lastMoveTo` (optional), `createdAt`
- [ ] `lobbies` table has an index on `hostUserId`
- [ ] `games` table has indexes on `whitePlayerId` and `blackPlayerId`
- [ ] `convex/lobbies.ts` has a `createLobby` mutation that creates a lobby with status "waiting" and returns the lobby ID
- [ ] `convex/lobbies.ts` has a `joinLobby` mutation that: validates the lobby exists and is "waiting", reads both players' formations, initializes the game via the engine, creates a game record, updates the lobby with guest and game ID, sets lobby status to "active"
- [ ] `convex/lobbies.ts` has a `getLobby` query that returns lobby state (with player names)
- [ ] `convex/games.ts` has a `getGame` query that returns the game state for a given game ID (with player info)
- [ ] A player cannot join their own lobby
- [ ] Test: `createLobby` creates a lobby in "waiting" status
- [ ] Test: `joinLobby` creates a game with correct board initialization from both players' formations
- [ ] Test: `joinLobby` rejects if lobby is not in "waiting" status
- [ ] Test: `joinLobby` rejects if player tries to join their own lobby
- [ ] Test: `getGame` returns the correct board state and player info

### TDD behaviors to test

1. `createLobby` rejects unauthenticated calls
2. `createLobby` creates lobby in "waiting" status, returns ID
3. `joinLobby` rejects unauthenticated calls
4. `joinLobby` rejects joining own lobby
5. `joinLobby` rejects joining a non-waiting lobby
6. `joinLobby` initializes game with formations from both players, sets lobby to "active"
7. `getGame` returns null for unauthenticated calls
8. `getGame` returns board state, players, turn, and status

---

## Phase 4: Move Submission Backend

**User stories**: 39 (click to move), 40 (see opponent's last move), 42 (game ends on king capture), 46 (whose turn)

### What to build

The server-side move submission flow. A Convex mutation receives a move intent from the client, validates it through the game engine (correct turn, legal move, valid promotion), applies it, persists the new board state, and checks for game over. The game record is updated with the new board state, current turn, last move coordinates, and potentially the result.

### Acceptance criteria

- [ ] `convex/games.ts` has a `submitMove` mutation that accepts a game ID and a move (`from`, `to`, optional `promotion`)
- [ ] Mutation validates the caller is a player in the game and it's their turn
- [ ] Mutation deserializes board state, calls engine to validate and apply the move
- [ ] Mutation persists updated board state, flips current turn, stores last move coordinates
- [ ] If the engine reports king capture, mutation sets game status to "finished" with the correct result
- [ ] If the engine reports a promotion is needed but not provided, mutation rejects with an error
- [ ] Mutation updates the lobby status to "finished" when the game ends
- [ ] Real-time: the opponent sees the updated board via their Convex subscription
- [ ] Test: `submitMove` rejects unauthenticated calls
- [ ] Test: `submitMove` rejects moves from non-participants
- [ ] Test: `submitMove` rejects out-of-turn moves
- [ ] Test: `submitMove` applies a valid move and updates board state
- [ ] Test: `submitMove` detects king capture and ends the game
- [ ] Test: `submitMove` handles pawn promotion correctly

### TDD behaviors to test

1. `submitMove` rejects unauthenticated calls
2. `submitMove` rejects if caller is not a player in the game
3. `submitMove` rejects out-of-turn moves
4. `submitMove` rejects illegal moves (engine validation)
5. `submitMove` applies valid move; `getGame` reflects new board state and turn
6. `submitMove` with king capture sets game to finished
7. `submitMove` with valid pawn promotion applies correctly
8. `submitMove` with missing promotion on last-rank pawn move is rejected

---

## Phase 5: Lobby Pages (Create & Join)

**User stories**: 32 (create lobby), 34 (invite via link), 54 (find-match page)

### What to build

The `/play` and `/lobby/$lobbyId` frontend routes. The `/play` page has a "Create Lobby" button that calls the `createLobby` mutation and redirects to `/lobby/$lobbyId`. The `/lobby/$lobbyId` page shows a waiting state for the host (with a copyable invite link) or auto-joins if the visitor is the guest. Once the game is created (lobby status changes to "active"), both players are redirected to `/game/$gameId` via real-time subscription.

### Acceptance criteria

- [ ] `/play` route exists behind the auth guard layout
- [ ] `/play` page has a "Create Lobby" button
- [ ] Clicking "Create Lobby" calls the mutation, then navigates to `/lobby/$lobbyId`
- [ ] `/lobby/$lobbyId` route exists behind the auth guard layout
- [ ] Lobby page shows a waiting state for the host: copyable invite link, "Waiting for opponent" indicator
- [ ] When a non-host authenticated user visits `/lobby/$lobbyId`, the page auto-joins the lobby
- [ ] Both players are redirected to `/game/$gameId` when the lobby becomes active (real-time subscription on `getLobby`)
- [ ] Lobby page handles error states: lobby not found, lobby already full, joining own lobby
- [ ] Navigation: `AppHeader` includes a "PLAY" link to `/play`
- [ ] Page matches the existing cyberpunk design system

---

## Phase 6: Game Page — Board Rendering & Move Interaction

**User stories**: 37 (board from perspective), 38 (see valid moves), 39 (click to move), 40 (last move highlighted), 44 (pawn promotion), 46 (whose turn)

### What to build

The `/game/$gameId` page with a fully interactive chessboard. The board renders from the current player's perspective (their pieces at the bottom). Clicking a piece highlights valid moves, clicking a highlighted square submits the move. The opponent's last move is highlighted. A turn indicator shows whose turn it is. Pawn promotion shows a picker when a pawn reaches the last rank. Game-over state shows a result banner.

### Acceptance criteria

- [ ] `/game/$gameId` route exists behind the auth guard layout
- [ ] Board renders an 8×8 grid using Convex real-time subscription on `getGame`
- [ ] Board is oriented with the current player's pieces at the bottom (flipped for black)
- [ ] Pieces are rendered as Unicode chess symbols, colored per side (e.g. white pieces in one color, black in another)
- [ ] Clicking a friendly piece (on the player's turn) highlights its valid moves
- [ ] Clicking a highlighted square submits the move via `submitMove` mutation
- [ ] Opponent's last move is visually highlighted on the board
- [ ] Turn indicator displays "Your turn" or "Waiting for opponent"
- [ ] Pawn promotion: when moving a pawn to the last rank, a promotion picker appears with valid piece types (from opponent's formation), and the move is submitted with the chosen type
- [ ] Game-over: when status is "finished", a result banner shows ("You win!" / "You lose!") with a "Back to Home" button
- [ ] Player names displayed above and below the board (opponent top, player bottom)
- [ ] Page matches the existing cyberpunk design system

---

## Phase 7: Heartbeat & Disconnect Auto-Forfeit

**User stories**: 47 (opponent disconnect auto-forfeit after 60s), 48 (60s grace period to reconnect)

### What to build

Client-side heartbeat and server-side disconnect detection. The game page sends a heartbeat every 10 seconds to a Convex mutation that updates the player's `lastSeenAt` timestamp on the game record. A Convex scheduled function (triggered on game creation and re-scheduled after each check) inspects active games: if the current-turn player's `lastSeenAt` is older than 60 seconds, the game is auto-forfeited in their opponent's favor. On reconnect within 60s, the Convex real-time subscription restores the game state automatically.

### Acceptance criteria

- [ ] `convex/games.ts` has a `heartbeat` mutation that updates the calling player's `lastSeenAt` on the game
- [ ] Game page calls `heartbeat` every 10 seconds while the game is active
- [ ] `convex/games.ts` has a `checkDisconnect` internal function that: finds the active game, checks if the current-turn player's `lastSeenAt` exceeds 60 seconds, and if so, ends the game in the opponent's favor
- [ ] A scheduled function is created when a game starts, and re-schedules itself every 15 seconds while the game is active
- [ ] Auto-forfeit updates game status, result, and lobby status
- [ ] Client receives the game-over state via real-time subscription — no special reconnect logic needed
- [ ] Test: `heartbeat` updates `lastSeenAt` for the correct player
- [ ] Test: `checkDisconnect` forfeits the current-turn player if `lastSeenAt` > 60 seconds
- [ ] Test: `checkDisconnect` does nothing if `lastSeenAt` is recent
- [ ] Test: `checkDisconnect` does nothing for finished games

### TDD behaviors to test

1. `heartbeat` rejects unauthenticated calls
2. `heartbeat` updates the correct player's `lastSeenAt`
3. `checkDisconnect` forfeits current-turn player when `lastSeenAt` > 60s
4. `checkDisconnect` does not forfeit if `lastSeenAt` is within 60s
5. `checkDisconnect` is a no-op for finished games
