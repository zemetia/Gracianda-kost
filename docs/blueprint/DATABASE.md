# Database & Auth

← [Blueprint INDEX](./INDEX.md)

---

## Stack

| Package | Version | Role |
|---|---|---|
| `prisma` | ^7.x | ORM CLI (dev) |
| `@prisma/client` | ^7.x | Generated query client (prod) |
| `@prisma/adapter-pg` | ^7.x | Prisma 7 driver adapter for PostgreSQL |
| `pg` | ^8.x | PostgreSQL node.js driver |
| `@auth/prisma-adapter` | ^2.x | Connects NextAuth to Prisma |
| `next-auth` | ^5 beta | Auth.js — session, JWT, providers |
| `bcryptjs` | ^3.x | Password hashing (pure JS, no native deps) |

---

## Modular Prisma Schema

All `.prisma` files live in `prisma/schema/`. Prisma 7 merges them automatically when `package.json` points to the folder.

```json
// package.json
"prisma": {
  "schema": "prisma/schema"
}
```

### Key config file

[`prisma.config.ts`](../../prisma.config.ts) — **Prisma 7 root config** (replaces the old `prisma.schema` key in `package.json`).

```ts
// prisma.config.ts
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema',           // folder with *.prisma files
  datasource: { url: process.env.DATABASE_URL }, // for CLI (migrate/introspect)
  migrations: { seed: 'tsx prisma/seed.ts' },
});
```

> **Prisma 7 architecture change**: The `url` field is no longer in `schema.prisma`. The CLI reads it from `prisma.config.ts`; the PrismaClient reads it through the `@prisma/adapter-pg` driver adapter in `src/lib/prisma.ts`.

### Schema files

| File | Models |
|---|---|
| [`prisma/schema/base.prisma`](../../prisma/schema/base.prisma) | `generator client` + `datasource db` (no `url` — Prisma 7) |
| [`prisma/schema/user.prisma`](../../prisma/schema/user.prisma) | `User`, `UserRole` enum |
| [`prisma/schema/auth.prisma`](../../prisma/schema/auth.prisma) | `Account`, `Session`, `VerificationToken` |

### Adding a new domain model

Create `prisma/schema/<domain>.prisma`. Any relations to `User` should reference the `User` model by name — Prisma merges all files before validation.

```prisma
// prisma/schema/post.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

Also add the back-relation to `user.prisma`:
```prisma
model User {
  // ...existing fields
  posts Post[]
}
```

---

## Room ↔ RoomType

`RoomType` is a per-property template for units that are physically identical. A room may have no type at all; the relation is optional and `onDelete: SET NULL`.

Two rules, both implemented once in [`src/lib/room-template.ts`](../../src/lib/room-template.ts) — never re-derive them in a page or a service:

| Dimension | Rule |
|---|---|
| Fasilitas (`RoomFacility` vs `RoomTypeFacility`) | **Room menimpa type.** A room with ≥1 row of its own uses only its own; a room with none inherits the type's. Never a union. |
| Foto/video (`Attachment` `ROOM` vs `ROOM_TYPE`) | Same override rule, evaluated independently of facilities. |
| Harga (`Room.price`, `RoomPrice` vs `RoomType.price`, `RoomTypePrice`) | **Type is only a default.** It prefills the room form on the client; `Room.price`/`RoomPrice` stay the single source of truth for contracts and billing. Never read a type's price during billing. |

`resolveInherited(own, fromType)` returns `{ items, source }` — `source` is what the admin UI labels as "mengikuti tipe".

Duplication (`roomService.duplicate`) clones one room into up to 50 units: number generation lives in `generateRoomNumbers()`, price tiers/facilities/type/description/size carry over, attachments deliberately do not.

---

## Nonaktif vs Terhapus (Property / Room / RoomType)

Two independent lifecycles on the same three models. The rules live once in [`src/lib/record-status.ts`](../../src/lib/record-status.ts) — never hand-roll the `where` clause.

| State | Column | Visible to admin? | Visible to public? | Reversible? |
|---|---|---|---|---|
| Aktif | `isActive = true`, `deletedAt = null` | yes | yes | — |
| Nonaktif | `isActive = false`, `deletedAt = null` | **only** behind the `?status=inactive` filter, never merged into the active list | no | yes, "Aktifkan" |
| Terhapus | `deletedAt != null` (and `isActive = false`) | never, anywhere | no | no |

- `recordStatusWhere(status)` is the only correct filter for a list; `NOT_DELETED` is for queries that may legitimately include parked records (`roomService.list(id, 'all')` — pickers for maintenance/insiden, the command palette).
- A soft delete always sets `isActive = false` as well, so a legacy query that only knows about `isActive` can never surface a deleted row.
- Never a hard delete: contracts, payments, maintenance records, and `AuditLog` entries still point at the row.
- Deletes are refused, with a message, when history would break: a room with an ACTIVE contract, a room type that rooms still inherit from, a property with any running contract. Deleting a property cascades the soft delete to its rooms and room types — otherwise they linger with no property tab left to reach them from.
- UI: `StatusFilter` (server) renders the two buckets with counts; `RecordActions` (client) is the shared card footer — both destructive paths go through `ConfirmDialog`.

---

## Insiden: properti, kamar, orang

An incident is filed against three axes at once, and all three are queryable:

| Axis | Column | Notes |
|---|---|---|
| Properti | `Incident.propertyId` | Required — every report belongs to a building. |
| Kamar | `Incident.roomId` (nullable) + `location` | A unit if it happened inside one, otherwise the free-text spot ("Parkiran"); neither set means the property as a whole. `incidentPlaceLabel()` in [`src/lib/incident.ts`](../../src/lib/incident.ts) is the only place this fallback chain is written. |
| Orang | `IncidentPerson[]` | Any number of people per incident, each with a role: `PELAPOR` / `TERLIBAT` / `SAKSI` / `TERDAMPAK`. |

`IncidentPerson` rules:

- **`name` is always stored**, even when the row links to a tenant — a snapshot, same doctrine as `Contract.rentPrice`. An old report must stay readable after the tenant moves out or their name is corrected.
- `tenantId` / `occupantId` are both optional and mutually exclusive. Empty means someone with no record in the system — a guest, a courier, a neighbour. Outsiders show up in incidents constantly and must never be unrecordable.
- The form submits an opaque `tenant:<id>` / `occupant:<id>` ref from one `Combobox`; `personRef()` / `parsePersonRef()` are the only code that knows that format.
- `occupantId` is `onDelete: SetNull` (occupant rows cascade away with their contract); `tenantId` is restrict, like every other tenant reference.
- `incidentService.listForTenant(id)` is the per-person view — every incident naming that person **anywhere in the building**, not just in their room. It backs "Riwayat Insiden" on the tenant page, which sits directly above the blacklist card because that history is what the blacklist decision is made from.

Enum labels live in `src/lib/incident.ts`, never in a page-local map.

---

## Blacklist Penyewa

A blacklist entry is a decision about a person, so the schema records who made it and why — not just a boolean. Columns on `Tenant`: `isBlacklisted`, `blacklistReason` (enum `BlacklistReason`), `blacklistNote` (kronologi), `blacklistedAt`, `blacklistedById` → `User` (`ON DELETE SET NULL`).

- Wording, `<Select>` options, and badge tone come from [`src/lib/blacklist.ts`](../../src/lib/blacklist.ts) — never a page-local label map. Only `KEAMANAN` renders `destructive`; if every category is red, none of them is.
- `blacklistSchema` requires both a category and a note **only when `isBlacklisted` is true** (`superRefine`) — removing someone demands nothing.
- `tenantService.setBlacklist(id, data, actorId)` owns two rules: `blacklistedAt` is set once, when the entry is created, so editing the kronologi never makes the person look newly flagged; removing clears reason, note, date, and actor together, leaving the trail in `AuditLog` where it belongs.
- Rows from before these columns existed have `blacklistReason = null`. They get their own filter bucket via the sentinel `UNCATEGORIZED` (`?kategori=TANPA_KATEGORI`), which is not an enum member — the chip only appears when the count is non-zero.
- The list is **not** a hard block. `/admin/contracts/new` still lets a blacklisted tenant through behind a warning plus an acknowledgement checkbox; the page's job is to make sure whoever ticks it knows what they are agreeing to. Hence the "Masih menghuni" banner: a blacklisted tenant with an ACTIVE contract is unfinished work, not an archive entry.

---

## Prisma Client Singleton

```ts
import { prisma } from '@/lib/prisma';
```

[`src/lib/prisma.ts`](../../src/lib/prisma.ts) — creates one `PrismaClient` per process (dev hot-reload safe via `globalThis`) using the `@prisma/adapter-pg` driver:

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

**Never instantiate `new PrismaClient()` outside this file.** Never create a `Pool` directly in application code.

---

## `npm run db:*` Commands

| Script | Prisma command | When to use |
|---|---|---|
| `npm run db:generate` | `prisma generate` | After any schema change — regenerates the client |
| `npm run db:push` | `prisma db push` | Push schema to DB without a migration (prototype / dev only) |
| `npm run db:pull` | `prisma db pull` | Introspect existing DB and update schema |
| `npm run db:migrate` | `prisma migrate dev` | Create + apply a migration in development |
| `npm run db:migrate:deploy` | `prisma migrate deploy` | Apply pending migrations in CI/production |
| `npm run db:migrate:reset` | `prisma migrate reset --force` | Wipe DB + rerun all migrations (dev only) |
| `npm run db:studio` | `prisma studio` | Open the Prisma data browser |
| `npm run db:format` | `prisma format` | Format all `.prisma` files |
| `npm run db:seed` | `tsx prisma/seed.ts` | Run the seed script (create `prisma/seed.ts` first) |

---

## NextAuth (Auth.js v5)

### Entry points

| File | Export | Purpose |
|---|---|---|
| [`src/auth.ts`](../../src/auth.ts) | `handlers, auth, signIn, signOut` | Single config file — imported everywhere |
| [`src/app/api/auth/[...nextauth]/route.ts`](../../src/app/api/auth/%5B...nextauth%5D/route.ts) | `GET, POST` | HTTP handler — do not edit |
| [`src/lib/auth.ts`](../../src/lib/auth.ts) | `getSession, requireAuth, requireRole` | Server-side session helpers |
| [`src/types/auth.ts`](../../src/types/auth.ts) | type augmentations | Adds `id` + `role` to `Session` + `JWT` |

### Session strategy: JWT (default)

Sessions are stored in a signed/encrypted HTTP-only cookie — no database round-trip on every request. The `Session` table in Prisma is created but unused with JWT strategy.

Switch to `strategy: 'database'` in `src/auth.ts` if you need server-side session invalidation.

### Providers

The template ships with `Credentials` only. To add an OAuth provider:

```ts
// src/auth.ts
import GitHub from 'next-auth/providers/github';

providers: [
  GitHub,
  Credentials({ ... }),
],
```

Add the required env vars (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`) — Auth.js v5 auto-reads these by convention.

### Server-side usage

```ts
// Server Component or Route Handler
import { getSession, requireAuth, requireRole } from '@/lib/auth';

// Nullable — returns null if not signed in
const session = await getSession();

// Throws 'Unauthorized' if not signed in
const session = await requireAuth();

// Throws 'Forbidden' if role doesn't match (accepts a single role or an array)
const session = await requireRole('SUPER_ADMIN');
const session = await requireRole(['SUPER_ADMIN', 'KEUANGAN']);

// Access user from session
session.user.id    // string
session.user.email // string | null | undefined
session.user.role  // string
```

### Client-side usage

```tsx
'use client';
import { useSession } from 'next-auth/react';

export function UserMenu() {
  const { data: session, status } = useSession();
  // status: 'loading' | 'authenticated' | 'unauthenticated'
}
```

Wrap client subtree that needs `useSession` with `<SessionProvider>` from `next-auth/react`. Mount it in `src/app/[locale]/layout.tsx` inside the provider tree.

### Sign-in / Sign-out (Server Actions)

```ts
import { signIn, signOut } from '@/auth';

// Inside a Server Action or Route Handler only
await signIn('credentials', { email, password, redirectTo: '/dashboard' });
await signOut({ redirectTo: '/' });
```

---

## Type Augmentation

[`src/types/auth.ts`](../../src/types/auth.ts) extends the NextAuth types to include `id` and `role` on every `session.user` object and JWT token. This file is automatically picked up by TypeScript since it lives in `src/types/`.

```ts
// next-auth module — adds id + role to session.user
declare module 'next-auth' {
  interface Session { user: { id: string; role: string } & DefaultSession['user'] }
  interface User { role?: string | null }
}

// @auth/core/jwt — note: use @auth/core/jwt, NOT next-auth/jwt (doesn't resolve in v5 beta)
declare module '@auth/core/jwt' {
  interface JWT { id?: string; role?: string | null }
}
```

---

## Password Hashing

Use `bcryptjs` (pure JS — no native compilation required):

```ts
import bcrypt from 'bcryptjs';

// Hash on register
const hashed = await bcrypt.hash(plainPassword, 12);

// Compare on sign-in (already done inside src/auth.ts authorize)
const valid = await bcrypt.compare(plainPassword, hashedPassword);
```

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | JWT signing + encryption key — `openssl rand -base64 32` |
| `AUTH_URL` | Prod | Canonical origin for redirects — defaults to `NEXT_PUBLIC_APP_URL` |

---

## Sign-in Page

`src/auth.ts` sets `pages.signIn = '/sign-in'`. With `localePrefix: 'always'` routing, the actual path is `/en/sign-in` / `/id/sign-in`. Update this to your localized route after scaffolding the sign-in page.

---

## File Creation Checklist — New Auth Feature

- [ ] Add Zod schema to [`src/lib/validations/auth.ts`](../../src/lib/validations/auth.ts)
- [ ] Create Server Action in `src/app/[locale]/<feature>/actions.ts` — call `prisma` directly, never in components
- [ ] Use `requireAuth()` or `requireRole()` from `@/lib/auth` at the top of protected Server Actions / Route Handlers
- [ ] For new OAuth providers: add to `providers[]` in [`src/auth.ts`](../../src/auth.ts) + env vars

---

← [Blueprint INDEX](./INDEX.md)
