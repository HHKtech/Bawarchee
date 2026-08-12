# Bawarchee Progress

## 1. Current Project Status
- **Project:** Bawarchee (fresh-start Next.js 14 App Router app)
- **Overall roadmap:** 4 of 9 modules completed.
- **Completed modules:** Module 1 — Auth Module; Module 2 — Profile & Family Setup Module; Module 3 — Item Catalog & Search Module; Module 4 — Inventory Module.
- **Current status:** Authenticated users can complete onboarding, manage cooking preferences and household setup data, search/select public grocery catalog items, and maintain a user-scoped pantry inventory with add/merge, inline quantity update, and delete flows.
- **Pending modules:** Module 5 Receipt Scanner, Module 6 Dashboard Layout, Module 7 Recipe Generation, Module 8 AI Chat, Module 9 Consumption & Deduction.

## 2. Completed Modules & Sub-tasks
### Module 1 — Auth Module
- Created initial Next.js 14 App Router project foundation, Supabase SSR helpers, auth actions/routes, login/signup/logout UI, protected dashboard/profile placeholders, middleware auth/onboarding gates, profile schema, README, and progress tracker.

### Module 2 — Profile & Family Setup Module
- Added `public.family_members` with authenticated user-owned RLS.
- Added typed profile/family-member definitions.
- Implemented authenticated `/api/profile` GET/POST.
- Built onboarding wizard and editable profile settings with shared profile form components/utilities.
- Updated middleware to support onboarding API access and setup redirects.

### Module 3 — Item Catalog & Search Module
- Populated `lib/catalog-seed.json` with a curated grocery/pantry catalog.
- Added shared catalog utilities/types in `lib/catalog.ts`.
- Added `public.catalog_items` schema, public read-only RLS, indexes, and seed guidance.
- Implemented public `/api/catalog` search with Supabase queries and seed fallback.
- Added reusable `components/catalog/CatalogSearch.tsx` and `/catalog` preview page.

### Module 4 — Inventory Module
- Extended `supabase/schema.sql` with `public.inventory_items`:
  - `id`, `user_id`, nullable `catalog_item_id`, denormalized `item_name`, `category`, `quantity`, `unit`, `added_via`, and `updated_at`.
  - RLS enabled with authenticated users allowed to manage only rows where `user_id = auth.uid()`.
  - Index on `(user_id, item_name)`.
- Updated `lib/supabase/types.ts` with typed `InventoryItem`, `InventoryAddedVia`, and `inventory_items` table Insert/Update/Row definitions.
- Added `lib/inventory-api-types.ts` for shared inventory API payload/response types.
- Added `app/api/inventory/route.ts` with authenticated route handlers:
  - `GET /api/inventory` loads current user's inventory ordered by category and item name.
  - `POST /api/inventory` accepts multiple items, inserts new rows, and merges exact `item_name` + `unit` matches by adding quantities.
  - `PATCH /api/inventory` updates a user-owned row quantity.
  - `DELETE /api/inventory` deletes a user-owned row by query-string or body `id`.
- Added `components/inventory/AddItemModal.tsx`:
  - Reuses `components/catalog/CatalogSearch.tsx` and public `GET /api/catalog`.
  - Lets users select catalog tags, enter quantities/units prefilled from `default_unit`, and post to inventory.
- Added `components/inventory/InventoryPanel.tsx` and `components/inventory/InventoryItemRow.tsx`:
  - Displays live inventory grouped by category.
  - Includes Add Items modal trigger and Scan Receipt placeholder for Module 5.
  - Supports future recipe multi-select checkboxes, inline quantity editing, delete actions, category badges, and empty state.
- Updated `app/dashboard/page.tsx` to mount `InventoryPanel` and show a Receipt Scanner next-step card.
- Updated `README.md` with Module 4 setup, feature summary, schema list, and roadmap status.

## 3. Current Focus
- Module 4 is complete. The next focus is **Module 5: Receipt Scanner Module**.

## 4. Key Technical Decisions / Env Vars / Architecture Notes
- Use **Next.js 14 App Router + TypeScript + Tailwind CSS**.
- Use **@supabase/ssr exclusively**; deprecated `@supabase/auth-helpers-nextjs` is not used.
- Auth client files expose `createClient()` separately for browser and server environments.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` for OAuth redirects. Local default is `http://localhost:3000`.
  - `GOOGLE_GENERATIVE_AI_API_KEY` reserved for later Gemini modules.
- Supabase SQL must be run manually in Supabase before real auth/onboarding/profile/catalog/inventory behavior works.
- Middleware route policy:
  - Protected: `/dashboard/:path*`, `/profile/:path*`, and `/api/:path*`.
  - Public exception: `/api/catalog` and nested `/api/catalog/*`.
  - Onboarding API exception: `/api/profile` remains authenticated but is not blocked by the not-onboarded redirect so `/profile/setup` can submit.
- New users are expected to have `profiles.is_onboarded = false` from the auth trigger and are routed to `/profile/setup`.
- Successful Module 2 onboarding sets `profiles.is_onboarded = true`, enabling dashboard access and preventing return to `/profile/setup`.
- `household_size` is derived as the primary user plus submitted family members (`family_members.length + 1`).
- `/api/catalog` remains public through the existing middleware exception and returns seed fallback results if Supabase catalog access is unavailable.
- Inventory operations are always authenticated through `lib/supabase/server.ts` and explicitly scoped by `user_id = auth.uid()` / `user.id` in route queries.
- Inventory add workflows reuse `CatalogSearch` and `/api/catalog`; exact `item_name` + `unit` matches merge quantities instead of creating duplicate rows.

## 5. Next Immediate Steps
- Begin Module 5: Receipt Scanner Module.
- Wire the Inventory Panel's "Scan Receipt" placeholder into a receipt upload/extraction workflow.
- Reuse Module 4 inventory `POST /api/inventory` merge behavior for receipt-derived items.
