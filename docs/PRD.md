# Chess Overdrive — Product Requirements Document

## Problem Statement

There is no shortage of online chess platforms, but they all offer the same static experience: standard chess with standard pieces. Players who want progression, customization, and strategic variety beyond the base game have no options. Chess Overdrive addresses this by combining classic chess mechanics with a collectible progression system — players earn extra pieces and ability cards by winning matches, build custom formations, and compete in real-time PvP with asymmetric, personalized armies.

## Solution

Chess Overdrive is a real-time PvP web chess game built with React, Convex, Convex Auth (Google OAuth), TanStack Router, and Tailwind CSS. It features three interconnected systems:

1. **King-capture chess variant** — A simplified chess ruleset where there is no check or checkmate. Players can move their king into danger, and the game ends when a king is captured. Pawns promote to a piece type present in the opponent's formation.

2. **Formation building** — New players start with 5 back-row pieces (King, Queen, 1 Rook, 1 Knight, 1 Bishop) and 3 empty slots. Winning matches rewards random extra pieces (Rook, Knight, or Bishop). Players arrange their back row freely, subject to constraints (exactly 1 King, exactly 1 Queen, max 3 of each other piece type, pawns untouchable). Once a player's piece inventory is full (3 of each: Rook, Knight, Bishop), they start receiving ability cards instead.

3. **Card system** — Cards grant special abilities to specific piece types. Players pick 1 of 3 random cards on each win (after maxing their piece inventory). Cards are freely swappable between compatible pieces outside of matches and are never lost. Some cards are incompatible with each other on the same piece.

Matchmaking pairs players based on total win count, with both a queue system (for ranked play) and a lobby system (for casual/friend matches).

## User Stories

### Authentication & Account

1. As a new visitor, I want to sign in with my Google account, so that I can start playing without creating a separate account.
2. As a player, I want to customize my display name, so that other players recognize me.
3. As a player, I want to upload a custom avatar, so that I can personalize my profile.
4. As a player, I want to delete my account, so that my data is no longer active in the system (soft delete).
5. As a player, I want to view and edit my profile (name, avatar), so that I can keep my information up to date.
6. As a returning player, I want to be automatically signed in if my session is still valid, so that I don't have to re-authenticate every visit.

### Formation Building

7. As a new player, I want to start with 5 back-row pieces (King, Queen, Rook, Knight, Bishop) and 8 pawns, so that I can begin playing immediately.
8. As a new player, I want to arrange my initial 5 pieces on the back row however I choose, so that I have strategic freedom from the start.
9. As a player, I want to see my piece inventory (owned pieces not currently placed), so that I know what I have available.
10. As a player, I want to drag and rearrange pieces on my back row, so that I can build my ideal formation.
11. As a player, I want the system to enforce formation rules (exactly 1 King, exactly 1 Queen, max 3 of each other type, pawns untouchable), so that all formations are valid.
12. As a player, I want to see empty back-row slots clearly, so that I know where I still need pieces.
13. As a player with a full inventory (3R, 3N, 3B), I want to choose which 6 of my 9 pieces to field alongside my King and Queen, so that I can tailor my formation to my strategy.

### Piece Rewards

14. As a player who won a match, I want to receive a random extra piece (Rook, Knight, or Bishop), so that I can strengthen my formation.
15. As a player who already has 3 of a piece type, I want the drop to re-roll to a different piece type, so that I never get a useless duplicate.
16. As a player with max inventory (3 of each piece type), I want to start receiving cards instead of pieces, so that I can continue progressing.

### Card System

17. As a player who won a match (with max pieces), I want to see 3 random cards and pick 1, so that I have agency in my progression.
18. As a player, I want to view all my collected cards, so that I know what abilities I have available.
19. As a player, I want to attach a card to a compatible piece, so that it gains a special ability in matches.
20. As a player, I want to detach a card from a piece and move it to a different compatible piece, so that I can adjust my strategy freely.
21. As a player, I want to see which cards are attached to each piece in my formation, so that I can review my setup.
22. As a player, I want to be warned when trying to attach incompatible cards to the same piece, so that I don't make invalid configurations.
23. As a player, I want to own up to 3 copies of any card type, so that I can apply the same ability to multiple pieces.

### Cards — Specific Abilities

24. As a player with a "Knight Double Jump" card on a knight, I want that knight to make two consecutive L-shaped moves in one turn (can capture on either or both jumps), so that it has extended range.
25. As a player with a "Persistent Pawn Rush" card on a pawn, I want that pawn to always be able to move 2 squares forward (not just from starting rank), so that it has increased mobility.
26. As a player with a "Rook Immunity (vs Knight)" card on a rook, I want that rook to be immune to capture by knights, so that it has a defensive advantage.
27. As a player with a "Queen Fortification" card on my queen, I want my queen to be immune to capture by pawns, so that it has increased survivability.
28. As a player with a "Pawn Diagonal Start" card on a pawn, I want that pawn to be able to move diagonally forward even without capturing, so that it has more movement options.
29. As a player with a "King's Guard" card on my king, I want my king to be able to move like a knight once per game, so that it has an emergency escape option.
30. As a player, I want "Persistent Pawn Rush" and "Pawn Diagonal Start" to be incompatible on the same pawn, so that no single pawn becomes too powerful.

### Matchmaking

31. As a player, I want to join a ranked queue and be matched with someone of similar total wins, so that matches are fair.
32. As a player, I want to create a casual lobby that other players can see and join, so that I can play without ranked pressure.
33. As a player, I want to browse available lobbies and join one, so that I can find a casual match.
34. As a player, I want to invite a friend to a lobby by sharing a link, so that we can play together directly.
35. As a player in a queue, I want to see that I'm waiting for a match, so that I know the system is working.
36. As a player, I want to cancel my queue search, so that I can change my mind.

### In-Game

37. As a player in a match, I want to see the board from my perspective (my pieces at the bottom), so that the orientation feels natural.
38. As a player, I want to click a piece to see its valid moves highlighted, so that I know where I can move.
39. As a player, I want to click a highlighted square to move my piece there, so that I can make my move.
40. As a player, I want to see my opponent's last move highlighted, so that I can track what changed.
41. As a player, I want to see which cards are active on pieces (mine and opponent's), so that I can factor abilities into my strategy.
42. As a player, I want the game to end immediately when a king is captured, so that the result is clear.
43. As a player, I want to be able to move my king into squares attacked by the opponent (no check concept), so that the king-capture rules are consistent.
44. As a player, I want to promote a pawn that reaches the 8th rank to a piece type present in my opponent's starting formation, so that promotion is strategic and context-dependent.
45. As a player, I want to resign from a match, so that I can concede without waiting.
46. As a player, I want to see whose turn it is, so that I know when to act.
47. As a player, I want the game to detect when my opponent disconnects and auto-forfeit them after 60 seconds, so that I'm not stuck waiting indefinitely.
48. As a player who disconnects, I want a 60-second grace period to reconnect before losing, so that brief internet issues don't cost me a game.

### Progression & Stats

49. As a player, I want to see my total wins on my profile, so that I can track my progress.
50. As a player, I want the matchmaking system to use my total wins to find opponents, so that I face players at a similar progression level.

### Navigation & Pages

51. As a visitor, I want to see a landing page that explains the game and lets me sign in, so that I understand what Chess Overdrive is before committing.
52. As an authenticated player, I want a home/dashboard showing my stats, formation summary, and quick actions (find match, edit formation), so that I have a central hub.
53. As a player, I want a dedicated formation builder page, so that I can focus on arranging pieces and cards.
54. As a player, I want a find-match page with queue and lobby options, so that I can choose how to play.
55. As a player, I want a full-screen in-game page, so that I can focus on the match without distractions.
56. As a player, I want a profile/settings page, so that I can manage my account.

## Implementation Decisions

### Architecture

- **Game engine as a standalone pure-TypeScript module**: All chess logic (move validation, board state, capture rules, card effects, pawn promotion, king-capture win condition) lives in a pure module with no Convex imports. Convex mutations call into this module. This enables easy unit testing and potential reuse.
- **Server-authoritative move validation**: All moves are validated server-side in Convex mutations. The client displays the board state and sends move intents; the server is the source of truth. No client-side validation for MVP.
- **Convex real-time subscriptions**: Board state, game status, matchmaking queue, and lobby list are all powered by Convex queries with real-time reactivity.

### Data Model (Convex Schema)

- **users** (extends auth tables): `name`, `avatarStorageId`, `totalWins`, `isDeleted`, `createdAt`
- **pieces** (player inventory): `userId`, `pieceType` (rook/knight/bishop), `createdAt`
- **cards** (player inventory): `userId`, `cardType` (enum of 6 types), `attachedToPiecePosition` (nullable — position in formation if attached), `createdAt`
- **formations**: `userId`, `positions` (array of 8 slots, each nullable piece-type or "king"/"queen"), `cardAssignments` (mapping of position to list of attached card IDs)
- **games**: `whitePlayerId`, `blackPlayerId`, `boardState` (serialized), `currentTurn`, `status` (waiting/active/finished), `result` (white_wins/black_wins/resigned), `winnerId`, `lastMoveAt`, `createdAt`
- **matchmakingQueue**: `userId`, `totalWins`, `joinedAt`
- **lobbies**: `hostUserId`, `guestUserId` (nullable), `status` (waiting/active/finished), `gameId` (nullable)

### Card Definitions

| Card | Target Piece | Effect | Incompatible With |
|---|---|---|---|
| Knight Double Jump | Knight | Two consecutive L-moves per turn; can capture on either/both | — |
| Persistent Pawn Rush | Pawn | Can always move 2 squares forward | Pawn Diagonal Start |
| Rook Immunity (vs Knight) | Rook | Cannot be captured by knights | — |
| Queen Fortification | Queen | Cannot be captured by pawns | — |
| Pawn Diagonal Start | Pawn | Can move diagonally forward without capturing | Persistent Pawn Rush |
| King's Guard | King | Can move like a knight once per game | — |

### Formation Rules

- Exactly 1 King (mandatory, non-removable)
- Exactly 1 Queen (mandatory, non-removable)
- Max 3 of each other piece type (Rook, Knight, Bishop)
- 8 pawns — untouchable, always in standard pawn row
- Back row has 8 slots; empty slots remain empty during games
- Players freely arrange their available pieces on the back row

### Game Rules

- King-capture variant: no check, no checkmate, no stalemate
- A player can move their king into attacked squares (legal move)
- Game ends when a king is captured
- Pawn promotion: when a pawn reaches the 8th rank, the player chooses a piece type from the opponent's starting formation (excluding king)
- Players can resign at any time (counts as a loss)
- Disconnect: 60-second grace period, then auto-forfeit

### Matchmaking

- **Ranked queue**: Players join with their `totalWins`. System pairs players with the closest win count. Matching algorithm can use a widening window over time.
- **Casual lobbies**: Player creates a lobby, others browse and join. Host can also share a direct link.
- Both modes create a `game` record when matched.

### Reward Flow

1. Player wins a match
2. If piece inventory is not full (< 3 of any piece type): drop a random piece (re-roll if maxed on that type)
3. If piece inventory is full (3R + 3N + 3B): show 3 random cards, player picks 1 (max 3 copies of each card type; re-roll card options if all at max)

### Tech Stack

- **Frontend**: React 19, TanStack Router (file-based routing), Tailwind CSS v4, react-icons for chess pieces (to be replaced with custom art later)
- **Backend**: Convex (queries, mutations, actions, scheduled functions for disconnect timeout)
- **Auth**: Convex Auth with Google OAuth
- **File storage**: Convex file storage (for avatars)
- **Package manager**: Bun
- **Linting/Formatting**: Oxlint + Oxfmt

### Pages / Routes

| Route | Page | Auth Required |
|---|---|---|
| `/` | Landing / Login | No |
| `/home` | Dashboard | Yes |
| `/formation` | Formation Builder | Yes |
| `/play` | Find Match (queue + lobbies) | Yes |
| `/game/:id` | In-Game | Yes |
| `/profile` | Profile / Settings | Yes |

## Testing Decisions

### Philosophy

Tests should verify **external behavior**, not implementation details. A good test describes what the system does from the perspective of its consumers (other modules, users, API callers) — not how it does it internally. Tests should be resilient to refactoring: if the internal implementation changes but the behavior stays the same, no tests should break.

### Modules to Test

1. **Game engine module** (Vitest unit tests)
   - Move validation for all piece types (standard moves)
   - Card effect logic (all 6 cards)
   - Card incompatibility enforcement
   - King-capture win condition
   - Pawn promotion to opponent's formation piece types
   - Board state transitions
   - Knight double-jump edge cases (capture on first, second, or both jumps)
   - King's Guard once-per-game tracking
   - Immunity cards (rook vs knight, queen vs pawn)

2. **Formation builder logic** (Vitest unit tests)
   - Placement constraints: exactly 1 K, exactly 1 Q, max 3 of each other type
   - Card attachment and detachment
   - Card incompatibility checks
   - Empty slot handling

3. **Matchmaking** (Vitest + Convex test helpers)
   - Queue pairing by win count
   - Lobby creation and joining
   - Edge cases: solo player in queue, disconnect during matchmaking

4. **Convex mutations** (integration tests via Convex testing utilities)
   - Move submission and validation
   - Game creation from matchmaking
   - Reward distribution (piece drops, card selection)
   - Account management (name change, avatar upload, soft delete)
   - Disconnect timeout (scheduled function behavior)

5. **React components** (Vitest + React Testing Library)
   - Board rendering with correct piece positions
   - Formation builder drag-and-drop interactions
   - Card attachment UI
   - Login/logout flow
   - Navigation between pages

### Test Framework

- **Vitest** as the test runner (Vite-native, already referenced in oxlint config)
- **React Testing Library** for component tests
- **Convex test helpers** for backend integration tests

## Out of Scope

The following are explicitly excluded from this PRD:

- **Elo / skill-based rating**: Matchmaking uses total wins only. A skill rating system may be added later.
- **Time controls / chess clock**: No timer for MVP. May be added in a future iteration.
- **Spectator mode**: Players cannot watch others' games.
- **Game history / replay**: Past games are not stored for review.
- **In-game chat**: No text communication during matches.
- **Friend system**: No friend lists or social features beyond lobby invites.
- **Leaderboards**: No global rankings.
- **Sound effects and animations**: Not in initial scope.
- **Mobile-native app**: Web only.
- **AI opponents**: PvP only, no bot matches.
- **Custom piece art**: Using react-icons initially; custom art is a future enhancement.
- **CI/CD pipeline**: No automated deployment for now.
- **En passant**: With the king-capture variant and modified pawn behavior, en passant is excluded for simplicity.
- **Castling**: With custom formations and potentially empty back-row slots, castling is excluded.

## Further Notes

- **En passant and castling exclusion**: Given that formations are custom (potentially with empty slots, non-standard piece positions), both en passant and castling are excluded. This significantly simplifies the game engine without meaningfully reducing strategic depth, especially since the card system adds its own complexity.
- **Scalability of the card system**: The 6 initial cards are designed to be easily extensible. The card definition structure (target piece, effect, incompatibilities) is a data-driven model that supports adding new cards without engine changes — new cards only need a new effect handler.
- **Soft delete implications**: Soft-deleted accounts should be excluded from matchmaking, lobbies, and leaderboards (if added later). Their game history remains for opponents' records. Display name should show as "[Deleted Player]" to other users.
- **Piece inventory vs formation**: A player's inventory can hold more pieces than fit on the board (up to 9 pieces: 3R + 3N + 3B, but only 6 slots available after K + Q). The formation builder must make this clear.
- **Promotion UX**: When a pawn reaches the 8th rank, the player must be shown the opponent's starting formation piece types (excluding king) and choose one.
