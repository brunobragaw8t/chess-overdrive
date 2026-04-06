# Plan: Piece Rewards & Win Tracking

> Source PRD: `docs/PRD.md` — User Stories 14, 15, 16 (partial), 49

## Architectural decisions

Durable decisions that apply across all phases:

- **Shared `endGame` internal mutation**: All game-ending code paths (`submitMove`, `makeBotMove`, `checkDisconnect`) delegate to a single `endGame` internal mutation. This mutation handles: setting game/lobby status to finished, incrementing winner's `totalWins`, and granting piece rewards. It is idempotent — no-op if the game is already finished.
- **Reward eligibility**: All wins grant rewards — PvP, bot games, and disconnect-timeout wins. Only the winner receives `totalWins` increment and piece reward.
- **Piece drop logic**: Filter eligible piece types (rook, knight, bishop) where the winner's count is < 3, then pick one uniformly at random. No re-roll loop. If inventory is full (3R + 3N + 3B), skip the piece reward entirely — the card system (future plan) will handle this case.
- **Reward storage**: A nullable `rewardPieceType` field on the `games` table stores what piece was awarded. `null` means no reward (unfinished game, or inventory was full). The existing `getGame` query exposes this to the frontend.
- **Schema changes**: Add `rewardPieceType` (optional) to the `games` table. No new tables.
- **Testing**: TDD with Vitest + `convex-test`. Red-green-refactor loop.

---

## Phase 1: Extract `endGame` Internal Mutation

**User stories**: None directly — refactoring prerequisite

### What to build

Extract the duplicated game-ending logic from `submitMove`, `makeBotMove`, and `checkDisconnect` into a shared `endGame` internal mutation. All three call sites currently patch the game with `status: "finished"`, compute the result, and mark the associated lobby as finished. After this phase, they delegate to `endGame` instead.

The `endGame` mutation accepts a game ID and a result (`"white_wins"` | `"black_wins"`). It sets the game status to finished, stores the result, and patches the associated lobby. It includes an idempotency guard: if the game is already finished, it returns without doing anything.

No new behavior — all existing tests must continue to pass.

### Acceptance criteria

- [ ] An `endGame` internal mutation exists that accepts a game ID and result
- [ ] `endGame` sets the game status to "finished" and stores the result
- [ ] `endGame` finds the associated lobby (via index) and sets it to "finished"
- [ ] `endGame` is idempotent — no-op if the game is already finished
- [ ] `submitMove` calls `endGame` instead of inlining game-ending logic
- [ ] `makeBotMove` calls `endGame` instead of inlining game-ending logic
- [ ] `checkDisconnect` calls `endGame` instead of inlining game-ending logic
- [ ] All existing game and lobby tests continue to pass

### TDD behaviors to test

1. `endGame` sets game status to "finished" with the correct result
2. `endGame` sets the associated lobby status to "finished"
3. `endGame` is a no-op when called on an already-finished game

---

## Phase 2: `totalWins` Increment

**User stories**: 49 (see total wins on profile)

### What to build

Extend `endGame` to increment the winner's `totalWins` field on the users table. After a game ends, the winning player's `totalWins` is atomically incremented by 1. The losing player's count is unchanged.

### Acceptance criteria

- [ ] `endGame` determines the winner from the result and player IDs on the game
- [ ] `endGame` increments the winner's `totalWins` by 1
- [ ] The loser's `totalWins` is not modified
- [ ] `totalWins` is incremented for PvP wins, bot wins, and disconnect-timeout wins
- [ ] Idempotency: `totalWins` is not double-incremented if `endGame` is called on an already-finished game

### TDD behaviors to test

1. Winner's `totalWins` increments by 1 after `endGame`
2. Loser's `totalWins` remains unchanged
3. Double-calling `endGame` does not double-increment `totalWins`

---

## Phase 3: Piece Reward Drop

**User stories**: 14 (receive random piece on win), 15 (re-roll if maxed on type), 16 (partial — skip if inventory full)

### What to build

Extend `endGame` to grant the winner a random piece reward. After incrementing `totalWins`, the mutation queries the winner's piece inventory, filters to piece types where count < 3 (rook, knight, bishop), picks one at random, and inserts a new piece record. If all types are at max (3 each), no piece is dropped.

Add a `rewardPieceType` optional field to the `games` table schema. The `endGame` mutation stores the awarded piece type on the game record (or leaves it null if no reward). The existing `getGame` query returns this field to the frontend.

### Acceptance criteria

- [ ] `games` table schema has a new optional `rewardPieceType` field
- [ ] `endGame` queries the winner's piece inventory counts by type
- [ ] `endGame` filters to types where count < 3 and picks one at random
- [ ] A new piece record is inserted in the `pieces` table for the winner
- [ ] `rewardPieceType` on the game record is set to the awarded type
- [ ] If inventory is full (3R + 3N + 3B), no piece is inserted and `rewardPieceType` is null
- [ ] If only one type is eligible, that type is always awarded
- [ ] Pieces are never awarded to the loser
- [ ] `getGame` returns `rewardPieceType` in its response

### TDD behaviors to test

1. Winner with no extra pieces receives a random piece; piece appears in `pieces` table
2. Winner with 3 of one type only receives one of the remaining types
3. Winner with 2 types maxed receives the only remaining type
4. Winner with all types maxed receives no piece; `rewardPieceType` is null
5. `rewardPieceType` on game record matches the awarded piece type

---

## Phase 4: Game-Over Reward UI

**User stories**: 14 (receive piece — visible feedback)

### What to build

The game page's game-over screen displays the reward to the winner. When the game is finished and the current user is the winner, the result banner includes the awarded piece type (e.g., "You earned a Rook!"). If no reward was granted (inventory full), the banner just shows the win without a reward message. Works identically for PvP and bot games.

### Acceptance criteria

- [ ] Game-over screen reads `rewardPieceType` from the game record
- [ ] If the current user is the winner and `rewardPieceType` is set, a reward message is displayed (e.g., "You earned a Knight!")
- [ ] If the current user is the winner and `rewardPieceType` is null, no reward message is shown
- [ ] If the current user is the loser, no reward message is shown
- [ ] Reward message displays for both PvP and bot game wins
- [ ] The reward piece is visually identified (icon or label matching the piece type)
- [ ] Page matches the existing cyberpunk design system

---

## Phase 5: Dashboard & Profile Win Stats

**User stories**: 49 (see total wins on profile)

### What to build

Display the player's `totalWins` on both the profile page and the home dashboard. The profile page shows the total wins count in the player's stats section. The dashboard shows it in the stats area. Both use the existing `getCurrentUser` query which already returns the user document (including `totalWins`).

### Acceptance criteria

- [ ] Profile page displays `totalWins` in a visible stats section
- [ ] Home dashboard displays `totalWins` in the stats area
- [ ] Wins count updates in real-time via Convex subscription (after winning a game and navigating back)
- [ ] A player with 0 wins sees "0" (not blank or missing)
- [ ] Page styling matches the existing cyberpunk design system
