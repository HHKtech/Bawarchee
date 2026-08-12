# Bawarchee Progress

## 1. Current Project Status
- **Project:** Bawarchee (fresh-start Next.js 14 App Router app)
- **Overall roadmap:** 5 of 9 modules completed.
- **Completed modules:** Module 1 — Auth Module; Module 2 — Profile & Family Setup Module; Module 3 — Item Catalog & Search Module; Module 4 — Inventory Module; Module 5 — Receipt Scanner Module.
- **Current status:** Authenticated users can complete onboarding, manage cooking preferences and household setup data, search/select public grocery catalog items, maintain a user-scoped pantry inventory, and scan grocery receipts with Gemini AI to automatically extract and confirm pantry additions.
- **Pending modules:** Module 6 Dashboard Layout, Module 7 Recipe Generation, Module 8 AI Chat, Module 9 Consumption & Deduction.

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
  - Includes Add Items modal trigger and Scan Receipt button wired to Module 5 modal.
  - Supports future recipe multi-select checkboxes, inline quantity editing, delete actions, category badges, and empty state.
- Updated `app/dashboard/page.tsx` to mount `InventoryPanel`.
- Updated `README.md` with Module 4 setup, feature summary, schema list, and roadmap status.

### Module 5 — Receipt Scanner Module
- **Phase 1 (Database & Storage Schema)**:
  - Added `public.receipt_scans` and `public.receipt_scan_items` table definitions to `supabase/schema.sql` with authenticated user-owned RLS policies and `receipts` storage bucket configuration.
  - Updated `lib/supabase/types.ts` with `ReceiptScan`, `ReceiptScanItem`, and `ReceiptScanStatus` table interfaces.
- **Phase 2 (API Routes)**:
  - Added shared receipt request/response interfaces in `lib/receipt-api-types.ts` (`ScanReceiptResponse`, `ConfirmReceiptRequest`, `ConfirmReceiptResponse`, `ReceiptItemExtracted`).
  - Extended `lib/gemini.ts` with `extractItemsFromReceipt()` using `@google/generative-ai` model `gemini-1.5-flash` with graceful local fallback parser.
  - Implemented `POST /api/receipt/scan`:
    - Authenticates user session via `lib/supabase/server.ts`.
    - Accepts multipart `formData` receipt file.
    - Uploads to Supabase Storage `receipts` bucket with fallback.
    - Extracts items via Gemini.
    - Performs server-side fuzzy matching against `public.catalog_items` (and seed fallback).
    - Inserts rows into `public.receipt_scans` and `public.receipt_scan_items`.
    - Returns `{ scan_id, image_url, items }`.
  - Implemented `POST /api/receipt/confirm`:
    - Authenticates user session via `lib/supabase/server.ts`.
    - Accepts `{ scan_id, confirmed_items }`.
    - Updates scan status to `confirmed`.
    - Directly posts/merges items into `public.inventory_items` using Module 4 merge logic.
- **Phase 3 (Receipt Scanner UI Modal)**:
  - Created `components/inventory/ReceiptScanModal.tsx` with a 3-step flow:
    - **Step 1 (Upload):** Drag-and-drop / file picker for receipt photos (JPG, PNG, WebP, HEIC) with drag-hover state.
    - **Step 2 (Confirm):** Review screen showing Matched items (catalog-linked, confidence ≥ 0.5) in green and Unmatched items (orange, editable name). Each row has inline qty/unit editing and a Skip toggle.
    - **Step 3 (Success):** Confirmation screen with count of items added and options to scan another receipt or view inventory.
  - AI scanning is shown with a loading overlay ("Reading receipt with AI…") while `POST /api/receipt/scan` is in flight.
  - On confirm, calls `POST /api/receipt/confirm` and triggers `onItemsAdded()` to refresh the parent `InventoryPanel` live list.
  - Wired `ReceiptScanModal` into `components/inventory/InventoryPanel.tsx`:
    - "Scan Receipt soon" placeholder replaced with a live `📷 Scan Receipt` button.
    - `isReceiptModalOpen` state added; modal mounts alongside `AddItemModal`.
  - Updated `app/dashboard/page.tsx` aside to reference Module 6 (Dashboard Layout) as the next module.
- **Stability Fixes (applied during Module 5)**:
  - Added `app/error.tsx` root React error boundary — prevents blank white screens from unhandled client errors.
  - Fixed `middleware.ts` infinite redirect loop for non-onboarded users.
  - Generated `supabase/catalog-seed.sql` — ready-to-run INSERT for all 180 catalog items.

## 3. Current Focus
- Module 5 is fully complete (all 3 phases). The next focus is **Module 6: Dashboard Layout**.

## 4. Key Technical Decisions / Env Vars / Architecture Notes
- Use **Next.js 14 App Router + TypeScript + Tailwind CSS**.
- Use **@supabase/ssr exclusively**; deprecated `@supabase/auth-helpers-nextjs` is not used.
- Auth client files expose `createClient()` separately for browser and server environments.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` for OAuth redirects. Local default is `http://localhost:3000`.
  - `GOOGLE_GENERATIVE_AI_API_KEY` for Gemini receipt parsing & recipe generation.
- Supabase SQL must be run manually in Supabase before real auth/onboarding/profile/catalog/inventory/receipt behavior works.
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
- Receipt scanner parses images via Gemini, fuzzy-matches line items against catalog, and merges confirmed items into `public.inventory_items`.

## 5. Next Immediate Steps
- Begin **Module 6: Dashboard Layout**.
- Design and implement a multi-panel dashboard with nutrition insights widget, household summary card, weekly meal plan teaser, and quick-access shortcuts to recipe generation.
- Explore reusable card/panel component patterns that will scale into Modules 7–9.
