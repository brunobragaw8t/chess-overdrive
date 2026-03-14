# Plan: Authentication & Account

> Source PRD: `docs/PRD.md` — User Stories 1–6

## Architectural decisions

Durable decisions that apply across all phases:

- **Auth**: Convex Auth with Google OAuth (`@convex-dev/auth` + `@auth/core/providers/google`). Session persistence handled automatically by Convex Auth.
- **Schema**: Extend the default `authTables` `users` table with optional fields: `avatarStorageId` (Id<"_storage">), `totalWins` (number, default 0), `isDeleted` (boolean), `createdAt` (number). All new fields are optional to remain compatible with Convex Auth's user creation flow.
- **Routes**: TanStack Router with file-based routing. `/` (landing/login, public), `/home` (dashboard, auth required), `/profile` (profile/settings, auth required). Other routes (`/formation`, `/play`, `/game/:id`) are out of scope for this plan.
- **File storage**: Convex file storage for avatar uploads, using the upload URL pattern (generate URL mutation → POST file → save storage ID mutation).
- **Soft delete**: `isDeleted` boolean field on users. Soft-deleted users are signed out, display as "[Deleted Player]" to others, and are excluded from matchmaking.
- **Testing**: Vitest + `convex-test` + `@edge-runtime/vm` for backend function tests. TDD red-green-refactor loop: one test → one implementation → repeat. Tests verify behavior through public function interfaces, not implementation details.

---

## Phase 1: Infrastructure & Google Sign-In

**User stories**: 1 (Google sign-in), 6 (auto sign-in on return)

### What to build

A complete vertical slice from first visit to authenticated session. A visitor lands on `/`, sees a sign-in button, authenticates via Google OAuth, and is redirected to `/home`. On subsequent visits, the session is automatically restored without re-authentication.

This phase installs missing dependencies (TanStack Router, Vitest, convex-test, @edge-runtime/vm), configures Google OAuth in `convex/auth.ts`, wires `ConvexAuthProvider` in the React app, sets up TanStack Router file-based routing, creates the landing page with a Google sign-in button, creates a minimal `/home` dashboard page visible only to authenticated users, and creates an auth-guarded layout that redirects unauthenticated users.

Extend the `users` table schema with the new optional fields (`avatarStorageId`, `totalWins`, `isDeleted`, `createdAt`) now so the schema is stable for all subsequent phases.

### Acceptance criteria

- [ ] `convex/auth.ts` includes Google OAuth provider
- [ ] `convex/schema.ts` extends the `users` table with `avatarStorageId`, `totalWins`, `isDeleted`, `createdAt` fields (all optional)
- [ ] TanStack Router is installed and file-based routing is configured in `vite.config.ts`
- [ ] `src/main.tsx` wraps the app in `ConvexAuthProvider`
- [ ] Landing page (`/`) renders a "Sign in with Google" button and calls `signIn("google")`
- [ ] `/home` route exists behind an auth guard layout that redirects to `/` if unauthenticated
- [ ] `/home` displays a minimal dashboard showing the authenticated user's name
- [ ] Sign-out button exists and calls `signOut()`, redirecting to `/`
- [ ] Returning visitors with a valid session skip the landing page and go directly to `/home`
- [ ] Vitest is installed and configured with `edge-runtime` environment for `convex/` tests
- [ ] `package.json` has `test`, `test:once`, `test:coverage` scripts
- [ ] A `convex/users.ts` module exists with a `getCurrentUser` query that returns the current user document (or null)
- [ ] A `convex-test` based test verifies that `getCurrentUser` returns null for unauthenticated calls and returns user data for authenticated calls (using `t.withIdentity`)

### TDD behaviors to test

1. `getCurrentUser` returns null when unauthenticated
2. `getCurrentUser` returns user data when authenticated (via `t.withIdentity`)

---

## Phase 2: Profile Display & Name Editing

**User stories**: 2 (customize display name), 5 (view/edit profile — name portion)

### What to build

An authenticated user can navigate to `/profile`, see their current display name and email, and edit their display name via an inline form. The profile page queries the user document and a mutation updates the `name` field.

This phase creates the `/profile` route (auth-guarded), a `getCurrentUser` query if not already sufficient, and an `updateProfile` mutation that accepts a new `name` and patches the user document. The profile page renders the current name, an edit form, and a save button.

### Acceptance criteria

- [ ] `/profile` route exists behind the auth guard layout
- [ ] Profile page displays the user's current name and email (read-only for email)
- [ ] User can edit their display name via a form and save it
- [ ] `convex/users.ts` has an `updateProfile` mutation that validates the new name (non-empty, max length) and patches the user document
- [ ] Name update is reflected immediately on the profile page (Convex real-time reactivity)
- [ ] Navigation exists between `/home` and `/profile`
- [ ] Test: `updateProfile` mutation rejects empty name
- [ ] Test: `updateProfile` mutation updates name and the change is retrievable via `getCurrentUser`
- [ ] Test: `updateProfile` mutation rejects unauthenticated calls

### TDD behaviors to test

1. `updateProfile` rejects unauthenticated calls
2. `updateProfile` rejects empty or whitespace-only names
3. `updateProfile` updates the name; updated name is returned by `getCurrentUser`

---

## Phase 3: Avatar Upload

**User stories**: 3 (upload custom avatar), 5 (view/edit profile — avatar portion)

### What to build

An authenticated user can upload a custom avatar image from their profile page. The avatar is stored in Convex file storage and its storage ID is saved on the user document. The profile page displays the avatar (or a default placeholder if none).

This phase adds a `generateUploadUrl` mutation, a `saveAvatar` mutation that stores the `avatarStorageId` on the user, and a query (or extension of `getCurrentUser`) that returns the avatar URL. The profile page gets a file input for avatar selection and a preview.

### Acceptance criteria

- [ ] `convex/users.ts` has a `generateAvatarUploadUrl` mutation that calls `ctx.storage.generateUploadUrl()`
- [ ] `convex/users.ts` has a `saveAvatar` mutation that accepts a storage ID and patches the user's `avatarStorageId`
- [ ] Profile page has an avatar section with: current avatar display (or placeholder), file input, upload button
- [ ] After upload, the new avatar is displayed immediately
- [ ] Avatar URL is derived from the storage ID via `ctx.storage.getUrl()` in the query
- [ ] Avatar is visible on the `/home` dashboard as well
- [ ] Test: `saveAvatar` mutation rejects unauthenticated calls
- [ ] Test: `saveAvatar` mutation stores the avatar storage ID and it's retrievable via `getCurrentUser`
- [ ] Test: `generateAvatarUploadUrl` rejects unauthenticated calls

### TDD behaviors to test

1. `generateAvatarUploadUrl` rejects unauthenticated calls
2. `saveAvatar` rejects unauthenticated calls
3. `saveAvatar` stores avatar ID; `getCurrentUser` returns user with avatar URL

---

## Phase 4: Account Deletion (Soft Delete)

**User stories**: 4 (delete account via soft delete)

### What to build

An authenticated user can delete their account from the profile page. This performs a soft delete: the `isDeleted` field is set to `true`, the user is signed out, and their display name appears as "[Deleted Player]" to other users. Soft-deleted users cannot sign back in (or are treated as new users if they do).

This phase adds a `deleteAccount` mutation that sets `isDeleted: true`, updates `getCurrentUser` to return null for soft-deleted users (so they're treated as unauthenticated), adds a confirmation dialog to the profile page, and ensures the user is signed out after deletion.

### Acceptance criteria

- [ ] `convex/users.ts` has a `deleteAccount` mutation that sets `isDeleted: true` on the current user
- [ ] `getCurrentUser` returns null for soft-deleted users
- [ ] Profile page has a "Delete Account" button with a confirmation dialog
- [ ] After deletion, the user is signed out and redirected to `/`
- [ ] Other users see "[Deleted Player]" for the name of a soft-deleted user (helper function)
- [ ] Test: `deleteAccount` mutation rejects unauthenticated calls
- [ ] Test: `deleteAccount` mutation sets `isDeleted` to true
- [ ] Test: after soft delete, `getCurrentUser` returns null for that user
- [ ] Test: a helper function returns "[Deleted Player]" for deleted users and the actual name for active users

### TDD behaviors to test

1. `deleteAccount` rejects unauthenticated calls
2. `deleteAccount` sets `isDeleted: true`; `getCurrentUser` returns null afterward
3. Display name helper returns "[Deleted Player]" for deleted users, real name for active users
