# Bawarchee

Bawarchee is a fresh-start Next.js 14 App Router application for intelligent household pantry inventory and conversational recipe assistance.

This repository currently implements **Module 1: Auth Module**, **Module 2: Profile & Family Setup Module**, **Module 3: Item Catalog & Search Module**, **Module 4: Inventory Module**, **Module 5: Receipt Scanner Module**, and **Module 6: Dashboard Layout Module**.

## Implemented in Module 1

- Next.js 14 + TypeScript + Tailwind CSS project foundation.
- Supabase SSR auth helpers using `@supabase/ssr` only:
  - `lib/supabase/client.ts` for Client Components.
  - `lib/supabase/server.ts` for Server Components, Server Actions, and Route Handlers.
- Email/password login at `/login`.
- Email/password signup at `/signup`.
- Google OAuth sign-in/sign-up flow via `/auth/callback`.
- Protected middleware for `/dashboard`, `/profile`, and `/api` routes, excluding `/api/catalog`.
- Onboarding gate redirecting authenticated users with `profiles.is_onboarded = false` to `/profile/setup`.
- Logout via Server Action and `/auth/logout` route handler.
- Supabase `profiles` schema and auth trigger in `supabase/schema.sql`.
- `progress.md` source-of-truth tracking file.

## Implemented in Module 2

- `family_members` Supabase table with authenticated user-owned RLS policies.
- Typed profile and family-member records in `lib/supabase/types.ts`.
- Authenticated `/api/profile` route with:
  - `GET` for loading the current user's profile and family members.
  - `POST` for saving onboarding/settings, setting `is_onboarded = true`, recalculating `household_size`, and replacing family-member rows.
- Three-step onboarding wizard at `/profile/setup`.
- Editable settings page at `/profile` for preferences and household setup.
- Middleware support for completing onboarding via `/api/profile` and redirecting onboarded users away from `/profile/setup`.

## Implemented in Module 3

- Curated grocery/pantry seed catalog in `lib/catalog-seed.json` covering vegetables, fruits, proteins, seafood, dairy, grains, spices, condiments, bakery, beverages, and pantry staples.
- Public `catalog_items` Supabase schema with read-only RLS for anonymous and authenticated users.
- Public `/api/catalog` search endpoint with `q`, `category`, and `limit` query parameters plus JSON seed fallback while the database is unseeded or unavailable.
- Reusable debounced multi-select catalog search component in `components/catalog/CatalogSearch.tsx`.
- Standalone preview page at `/catalog` for manually testing search, category filtering, unit display, and chip selection.

## Implemented in Module 4

- Authenticated `inventory_items` Supabase schema with user-owned RLS, catalog item references, merge-friendly denormalized display fields, and inventory indexes.
- Typed inventory records in `lib/supabase/types.ts` and shared API payload types in `lib/inventory-api-types.ts`.
- Authenticated `/api/inventory` route with:
  - `GET` for loading the current user's inventory grouped-ready by category/name ordering.
  - `POST` for adding one or more items and merging exact `item_name` + `unit` matches by increasing quantity.
  - `PATCH` for inline quantity edits.
  - `DELETE` for removing a specific user-owned inventory row.
- Reusable `components/inventory/AddItemModal.tsx` that embeds the existing `CatalogSearch` component and posts selected catalog items with quantities.
- `components/inventory/InventoryPanel.tsx` on `/dashboard` with grouped inventory categories, multi-select checkboxes, inline quantity editing, delete actions, and a Module 5 receipt-scan placeholder.

## Implemented in Module 5

- Added `receipt_scans` and `receipt_scan_items` Supabase schema with authenticated user-owned RLS policies.
- Added private `receipts` Supabase Storage bucket setup notes/policies for per-user receipt image paths.
- Added typed receipt scan records and shared receipt API payload types.
- Added Gemini-powered receipt item extraction with graceful fallback parsing.
- Implemented authenticated receipt scan and confirmation API routes.
- Added `components/inventory/ReceiptScanModal.tsx` and wired the live `📷 Scan Receipt` flow into the inventory panel.

## Implemented in Module 6

- Added `context/DashboardContext.tsx` for shared dashboard selections, active recipe session, and generated recipe state.
- Extracted `components/dashboard/DashboardHeader.tsx` with Bawarchee branding, profile link, and logout action.
- Updated `/dashboard` to render a responsive 3-panel shell: Inventory, AI Chat placeholder, and Generated Recipes placeholder.
- Added mobile tabs for switching between Inventory, AI Chat, and Recipes on small screens.
- Connected inventory row checkboxes to dashboard context and added a sticky selection banner with `Generate Recipes ✨`.

## Prerequisites

- Node.js 18.17+ recommended.
- A Supabase project with email/password auth enabled.
- Optional: Google OAuth provider configured in Supabase Auth.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key-for-receipt-extraction
```

`GOOGLE_GENERATIVE_AI_API_KEY` is required by the Module 5 Gemini receipt extraction helper and will also be used by the upcoming Module 7 recipe generation flow.

## Supabase setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor. It creates:

- `public.profiles`
- `public.family_members`
- `public.catalog_items`
- `public.inventory_items`
- `public.receipt_scans`
- `public.receipt_scan_items`
- Private `receipts` Supabase Storage bucket policies using per-user object paths
- Row Level Security policies for user-owned profile/family/inventory/receipt access and public read-only catalog access
- `public.handle_new_user()` trigger function
- `on_auth_user_created` trigger on `auth.users`

To seed the grocery catalog, copy the JSON array from `lib/catalog-seed.json` into the commented `jsonb_to_recordset` seed script at the bottom of `supabase/schema.sql`, then run it in the Supabase SQL editor.

For Google OAuth, configure the Supabase provider and add this redirect URL:

```text
http://localhost:3000/auth/callback
```

For production, also add your deployed equivalent, for example:

```text
https://your-domain.vercel.app/auth/callback
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Module roadmap

1. Auth Module — complete
2. Profile & Family Setup Module — complete
3. Item Catalog & Search Module — complete
4. Inventory Module — complete
5. Receipt Scanner Module — complete
6. Dashboard Layout Module — complete
7. Recipe Generation Module — next
8. AI Chat Module
9. Consumption & Deduction Module
