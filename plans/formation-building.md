# Plan: Formation Building

> Source PRD: `docs/PRD.md` — User Stories 7–13

## Architectural decisions

Durable decisions that apply across all phases:

- **Schema**: Two new tables — `pieces` (player piece inventory) and `formations` (back-row layout). `pieces` stores individual piece records per user with a `pieceType` field; **every piece has a unique ID, including King and Queen**. `formations` stores a `positions` array of 8 nullable slots where each slot is an `Id<"pieces">` or `null`. This ensures formations reference unique piece instances (important because pieces will later carry ability cards). Pawns are implicit (always 8, always in pawn row) and never stored or manipulated.
- **Default formation**: Created at account registration time. The `convexAuth` config uses the `afterUserCreatedOrUpdated` callback to detect new users (no existing formation) and insert 5 starter pieces (King, Queen, Rook, Knight, Bishop) into the `pieces` table, then create the default formation with those 5 piece IDs in slots 0–4 and 3 empty slots.
- **Formation rules** (enforced server-side on every mutation):
  - Exactly 1 King (mandatory, always present, non-removable)
  - Exactly 1 Queen (mandatory, always present, non-removable)
  - Max 3 of each minor piece type (Rook, Knight, Bishop)
  - 8 pawns — untouchable, not part of the formation positions array
  - Back row has 8 slots; unfilled slots remain `null`
  - Only pieces the player owns (in `pieces` table) can be placed
- **Routes**: `/formation` (auth required) for the formation builder page. Navigation links from `/home` dashboard.
- **Piece types**: String union — `"king"`, `"queen"`, `"rook"`, `"knight"`, `"bishop"`. All five types are stored in the `pieces` table as unique instances. Pawns excluded from formation logic.
- **Testing**: Vitest + `convex-test` with TDD red-green-refactor loop. One test → one implementation → repeat. Tests verify behavior through public query/mutation interfaces.

---

## Phase 1: Schema & Default Formation at Registration

**User stories**: 7 (start with 5 back-row pieces + 8 pawns), 9 (see piece inventory), 12 (see empty slots)

### What to build

A complete vertical slice from schema to queryable state. When a new player registers, the system creates their default formation and starter pieces immediately via the `afterUserCreatedOrUpdated` callback in `convex/auth.ts`. Five pieces (King, Queen, Rook, Knight, Bishop) are inserted into the `pieces` table as unique instances. The default formation references those 5 piece IDs in slots 0–4 with 3 empty slots.

This phase adds the `pieces` and `formations` tables to the schema, hooks into `afterUserCreatedOrUpdated` to seed data for new users, creates a `getFormation` query that returns the player's formation (resolving piece IDs to type+id pairs), and creates a `getInventory` query that returns the player's unplaced pieces.

### Acceptance criteria

- [ ] `convex/schema.ts` has a `pieces` table with fields: `userId` (Id<"users">), `pieceType` (string union: king/queen/rook/knight/bishop), `createdAt` (number)
- [ ] `convex/schema.ts` has a `formations` table with fields: `userId` (Id<"users">), `positions` (array of 8 elements, each `Id<"pieces">` or `null`)
- [ ] `pieces` table has an index on `userId`
- [ ] `formations` table has an index on `userId`
- [ ] `convex/auth.ts` uses the `afterUserCreatedOrUpdated` callback to create the default formation and starter pieces when a new user is created (skip if formation already exists for the user)
- [ ] `convex/formations.ts` has a `getFormation` query that returns the current user's formation (positions array + metadata)
- [ ] `convex/formations.ts` has a `getInventory` query that returns the current user's unplaced pieces (pieces in `pieces` table not currently occupying a formation slot)
- [ ] Default formation places pieces in a defined order with 3 trailing empty slots
- [ ] Callback is idempotent — re-triggering for an existing user does not create duplicate formations or pieces
- [ ] Test: `getFormation` returns null for unauthenticated calls
- [ ] Test: after seeding (simulating account creation), `getFormation` returns default formation (5 pieces placed, 3 empty slots)
- [ ] Test: `getInventory` returns null for unauthenticated calls
- [ ] Test: `getInventory` returns empty array for new player (all starter pieces are placed)

### TDD behaviors to test

1. `getFormation` returns null for unauthenticated calls
2. After seeding default data, `getFormation` returns correct 5 pieces and 3 empty slots
3. `getInventory` returns null for unauthenticated calls
4. `getInventory` returns empty array when all pieces are placed (new player state)

---

## Phase 2: Formation Rearrangement & Validation

**User stories**: 8 (arrange initial pieces freely), 10 (drag/rearrange pieces on back row), 11 (enforce formation rules)

### What to build

An authenticated player can rearrange pieces on their back row by updating formation positions. A mutation accepts a new positions array and validates it against all formation rules before saving. The King and Queen must always be present. Pieces can be swapped between occupied slots or moved into empty slots. The server rejects any arrangement that violates constraints.

This phase creates an `updateFormation` mutation that accepts a new positions array, validates all formation rules, verifies piece ownership, and patches the formation document.

### Acceptance criteria

- [ ] `convex/formations.ts` has an `updateFormation` mutation that accepts a new positions array and updates the formation
- [ ] Mutation validates: exactly 1 King present in positions
- [ ] Mutation validates: exactly 1 Queen present in positions
- [ ] Mutation validates: max 3 of each minor piece type (rook, knight, bishop) across all slots
- [ ] Mutation validates: all non-null pieces in positions must be owned by the player (present in `pieces` table or be the king/queen)
- [ ] Mutation validates: positions array has exactly 8 elements
- [ ] Mutation rejects invalid formations with descriptive error messages
- [ ] Rearranging pieces within the back row works (swapping two pieces, moving to empty slot)
- [ ] Test: `updateFormation` rejects unauthenticated calls
- [ ] Test: `updateFormation` rejects formation without a King
- [ ] Test: `updateFormation` rejects formation without a Queen
- [ ] Test: `updateFormation` rejects formation with more than 3 of a minor piece type
- [ ] Test: `updateFormation` rejects formation with pieces the player doesn't own
- [ ] Test: `updateFormation` accepts valid rearrangement and `getFormation` reflects the change
- [ ] Test: `updateFormation` rejects positions array with wrong length

### TDD behaviors to test

1. `updateFormation` rejects unauthenticated calls
2. `updateFormation` rejects positions array with length != 8
3. `updateFormation` rejects formation missing King
4. `updateFormation` rejects formation missing Queen
5. `updateFormation` rejects formation with >3 of a minor piece type
6. `updateFormation` rejects formation referencing unowned pieces
7. `updateFormation` accepts valid rearrangement; change is returned by `getFormation`

---

## Phase 3: Inventory Management (Place & Remove Pieces)

**User story**: 13 (choose which 6 of 9 pieces to field alongside King and Queen)

### What to build

A player with a full inventory (3 Rooks, 3 Knights, 3 Bishops) has 9 minor pieces but only 6 available back-row slots (8 total minus King and Queen). They must choose which 6 to place. This phase adds mutations to place a piece from inventory into an empty formation slot and to remove a piece from the formation back to inventory. Removing a piece frees the slot (sets it to null). Placing a piece fills an empty slot. The King and Queen cannot be removed.

### Acceptance criteria

- [ ] `convex/formations.ts` has a `placePiece` mutation that places an inventory piece into a specified empty formation slot
- [ ] `convex/formations.ts` has a `removePiece` mutation that removes a piece from a formation slot back to inventory
- [ ] `placePiece` rejects if the target slot is already occupied
- [ ] `placePiece` rejects if the piece is not in the player's inventory (already placed or not owned)
- [ ] `removePiece` rejects attempts to remove the King or Queen
- [ ] `removePiece` rejects if the target slot is already empty
- [ ] After placing, `getInventory` no longer includes that piece; `getFormation` shows it in the slot
- [ ] After removing, `getInventory` includes that piece; `getFormation` shows null in the slot
- [ ] Test: `placePiece` rejects unauthenticated calls
- [ ] Test: `placePiece` places an inventory piece into an empty slot
- [ ] Test: `placePiece` rejects placement into an occupied slot
- [ ] Test: `removePiece` rejects unauthenticated calls
- [ ] Test: `removePiece` removes a minor piece from formation to inventory
- [ ] Test: `removePiece` rejects removing King or Queen

### TDD behaviors to test

1. `placePiece` rejects unauthenticated calls
2. `placePiece` places an unplaced piece into an empty slot; reflected in `getFormation` and `getInventory`
3. `placePiece` rejects placement into an occupied slot
4. `placePiece` rejects placing a piece the player doesn't own
5. `removePiece` rejects unauthenticated calls
6. `removePiece` removes a minor piece from formation; reflected in `getFormation` and `getInventory`
7. `removePiece` rejects removing King or Queen

---

## Phase 4: Formation Builder Page — Static Display

**User stories**: 8 (visual arrangement), 12 (see empty slots clearly)

### What to build

The `/formation` route with a read-only visual display of the player's formation. The page renders an 8-slot back row grid showing placed pieces (with icons/labels) and clearly marked empty slots. Below or beside the board, an inventory panel lists unplaced pieces. The page queries `getFormation` and `getInventory` and renders the data. No interactivity yet — just visual display with real-time reactivity.

### Acceptance criteria

- [ ] `/formation` route exists behind the auth guard layout
- [ ] Formation page displays an 8-slot back row grid
- [ ] Placed pieces show their type (icon or label)
- [ ] Empty slots are visually distinct (dashed border, placeholder)
- [ ] Inventory panel displays unplaced pieces grouped by type
- [ ] Page uses Convex real-time queries (`getFormation`, `getInventory`)
- [ ] Loading state shown while data is fetched
- [ ] Page matches the existing cyberpunk design system (dark theme, accent colors, monospace labels)

---

## Phase 5: Formation Builder — Interactive Rearrangement

**User stories**: 10 (drag and rearrange pieces), 8 (arrange pieces freely)

### What to build

Full interactivity on the `/formation` page. Players can drag pieces between back-row slots to rearrange them, click an inventory piece then click an empty slot to place it, and click a placed minor piece to remove it back to inventory. All operations call the backend mutations (`updateFormation`, `placePiece`, `removePiece`). Visual feedback shows valid drop targets, hover states, and optimistic updates where appropriate. Error states display when the server rejects an invalid operation.

### Acceptance criteria

- [ ] Players can drag a piece from one back-row slot to another (swap or move to empty)
- [ ] Players can click an inventory piece and then click an empty slot to place it
- [ ] Players can click a placed minor piece to remove it to inventory
- [ ] King and Queen slots show a visual indicator that they cannot be removed
- [ ] Invalid operations show an error message (toast or inline)
- [ ] Piece count badges on inventory items show how many of each type are available
- [ ] Formation rules violations from the server are displayed to the user

---

## Phase 6: Dashboard Integration

**User stories**: 52 (dashboard formation summary)

### What to build

The `/home` dashboard's placeholder "FORMATIONS" card becomes a live formation summary card. It shows the player's current back-row formation in a compact visual format (mini piece icons in a row), the count of empty slots, and a link/button to navigate to `/formation`. The `AppHeader` navigation also gets a "FORMATION" link.

### Acceptance criteria

- [ ] Dashboard "FORMATIONS" placeholder is replaced with a live formation summary card
- [ ] Summary card shows the 8 back-row slots in a compact row (mini icons)
- [ ] Summary card shows count of pieces placed vs total slots (e.g., "5/8 SLOTS")
- [ ] Summary card has a "EDIT FORMATION" action that navigates to `/formation`
- [ ] `AppHeader` includes a navigation link to `/formation`
- [ ] Navigation between `/home`, `/formation`, and `/profile` works seamlessly
