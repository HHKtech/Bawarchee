# Bawarchee Progress

## 1. Current Project Status
- **Project:** Bawarchee (fresh-start Next.js 14 App Router app)
- **Overall roadmap:** 8 of 9 modules completed + security hardening applied.
- **Completed modules:** Module 1 — Auth Module; Module 2 — Profile & Family Setup Module; Module 3 — Item Catalog & Search Module; Module 4 — Inventory Module; Module 5 — Receipt Scanner Module; Module 6 — Dashboard Layout Module; Module 7 — Recipe Generation Module; Module 8 — AI Chat Module.
- **Current status:** Authenticated users can complete onboarding, manage cooking preferences and household setup data, maintain a user-scoped pantry inventory, scan grocery receipts with Gemini AI, enable TOTP-based 2FA, use a responsive 3-panel dashboard, generate customized portion-scaled recipe suggestions using Gemini 2.5 Flash, and chat conversationally with Bawarchee to ask cooking questions, find substitutions, or dynamically update recipes by specifying missing ingredients.
- **Pending modules:** Module 9 Consumption & Deduction.

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

### Module 6 — Dashboard Layout Module
- Verified Module 5 completion before starting Module 6.
- Added `context/DashboardContext.tsx` with shared dashboard state for `selectedItemIds`, `activeSessionId`, and `generatedRecipes`, plus selection/session/recipe handlers.
- Extracted `components/dashboard/DashboardHeader.tsx` with Bawarchee branding, profile navigation, and `LogoutButton`.
- Updated `app/dashboard/layout.tsx` to wrap the authenticated dashboard shell in `DashboardProvider` and render the shared header.
- Reworked `app/dashboard/page.tsx` into a responsive dashboard composition layer:
  - Desktop uses three side-by-side panels for Inventory, AI Chat, and Generated Recipes.
  - Mobile uses a tab switcher: Inventory / AI Chat / Recipes.
- Added placeholders for future modules:
  - `components/chat/ChatPanel.tsx` for Module 8 AI Chat.
  - `components/recipes/RecipePanel.tsx` for Module 7 recipe generation results.
- Updated `components/inventory/InventoryPanel.tsx` to use `DashboardContext` for row checkbox state, select-all/clear controls, and a sticky selection banner with selected count and "Generate Recipes ✨" action.

### Module 7 — Recipe Generation Module
- Extended `supabase/schema.sql` with `public.recipe_sessions` and `public.recipe_suggestions` tables, including RLS policies, user indexes, and explicit table privilege grants for `authenticated` and `service_role` database roles.
- Updated database typings in `lib/supabase/types.ts` to represent sessions and suggestions explicitly.
- Migrated `lib/gemini.ts` to the modern `@google/genai` SDK and implemented `generateRecipesFromInventory()` targeting `gemini-2.5-flash`.
- Created authenticated `POST /api/recipes/generate` endpoint to build sessions and fetch AI suggestions.
- Created `POST /api/recipes/cooked` endpoint to confirm and mark a suggested recipe as cooked in the database.
- Upgraded `DashboardContext` to manage `isGeneratingRecipes` loading states.
- Replaced the Recipe Panel placeholder with a premium scrollable interface, loader animations, skeleton card pulses, and `RecipeCard` instances featuring ingredient checklists and step-by-step instructions.

### Module 8 — AI Chat Module
- Extended `supabase/schema.sql` with `public.chat_messages` table, including RLS policies, indexes, and grants.
- Updated database typings in `lib/supabase/types.ts` to include `ChatMessage` and `chat_messages` table mappings.
- Implemented `processChatRefinement()` in `lib/gemini.ts` to support conversational replies and dynamic recipe updates for stated missing ingredients.
- Created `POST /api/chat/message` API endpoint to handle user inputs, update active exclusions, regenerate recipes in the DB, and return assistant messages.
- Created `GET /api/chat/messages` API endpoint to load session conversation history and exclusions.
- Created `ChatMessage` UI component for distinct user and assistant chat bubble styling.
- Overwrote `ChatPanel` placeholder to enable dynamic message rendering, typing loader animations, auto scroll to bottom, and automatic Panel 3 recipe syncing.

## 3. Bug Fixes & Upgrades (Post-Module 5)

### Gemini SDK Migration
- **Root cause:** `@google/generative-ai` v0.21.0 (old SDK) uses the `v1beta` API endpoint, which no longer supports `gemini-1.5-flash`, `gemini-2.0-flash`, or `gemini-2.5-flash` for new API key formats (`AQ.*` prefix).
- **Fix:** Migrated `lib/gemini.ts` from `@google/generative-ai` to `@google/genai` (new unified SDK).
  - Replaced `GoogleGenerativeAI` with `GoogleGenAI({ apiKey })`.
  - Updated `generateContent` call to use `client.models.generateContent({ model, contents })` format.
  - Updated response access from `result.response.text()` to `result.text`.
  - Model set to `gemini-2.5-flash` (confirmed available via `ListModels` API check).
- Installed `@google/genai` package (`npm install @google/genai`).

### Receipt Scan Route Bug Fix
- **Root cause:** `app/api/receipt/scan/route.ts` was referencing `rawItem.suggested_name`, `rawItem.category`, and `rawItem.confidence` — fields that don't exist on `ExtractedReceiptItem` returned by `lib/gemini.ts` (which only has `raw_text`, `quantity`, `unit`).
- **Fix:** Updated fuzzy-matching logic in `route.ts` to use `raw_text` as the match key, removed references to non-existent fields, and replaced `rawItem.confidence` / `rawItem.category` with safe hardcoded defaults (`0.85` matched, `0.5` unmatched, `'Other'` category).

### Two-Factor Authentication (Optional, Per-User TOTP)
- Implemented optional TOTP-based 2FA using Supabase's built-in MFA API — no extra libraries required.
- **New API routes:**
  - `GET /api/auth/mfa/status` — returns `{ enabled, factorId }` for the current user.
  - `POST /api/auth/mfa/enroll` — starts TOTP enrollment; returns `{ factorId, qrCode, secret, uri }`.
  - `POST /api/auth/mfa/verify` — verifies a TOTP code against a factor (used for enrollment confirmation).
  - `POST /api/auth/mfa/unenroll` — removes the TOTP factor, disabling 2FA.
- **New page:** `app/auth/mfa/page.tsx` — 6-digit OTP entry screen shown after password login when 2FA is enabled.
- **New components:**
  - `components/auth/MfaVerifyForm.tsx` — styled OTP input that calls `supabase.auth.mfa.challengeAndVerify()` and redirects to dashboard on success.
  - `components/profile/TwoFactorSection.tsx` — profile security panel with status badge, QR code enrollment flow (with manual secret fallback), code confirmation input, and disable button with confirmation dialog.
- **Modified `app/auth/actions.ts`:** After `signInWithPassword`, lists MFA factors and redirects to `/auth/mfa` instead of `/dashboard` if a verified TOTP factor exists.
- **Modified `middleware.ts`:**
  - Uses `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` to detect when `nextLevel === 'aal2'` but `currentLevel === 'aal1'`.
  - Redirects to `/auth/mfa` for all protected paths in this state.
  - Redirects away from `/auth/mfa` to `/dashboard` if session is already `aal2`.
  - Added `/auth/mfa` to the middleware matcher.
- **Modified `app/profile/page.tsx`:** Added `<TwoFactorSection />` below the Household setup card as a new Security section.
- **Prerequisite:** TOTP must be enabled in Supabase Dashboard → Authentication → MFA before enrollment calls will succeed.

## 4. Current Focus
- Module 8 AI Chat is complete. The next immediate focus is **Module 9: Consumption & Deduction Module**.

## 5. Key Technical Decisions / Env Vars / Architecture Notes
- Use **Next.js 14 App Router + TypeScript + Tailwind CSS**.
- Use **@supabase/ssr exclusively**; deprecated `@supabase/auth-helpers-nextjs` is not used.
- Auth client files expose `createClient()` separately for browser and server environments.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` for OAuth redirects. Local default is `http://localhost:3000`.
  - `GOOGLE_GENERATIVE_AI_API_KEY` for Gemini receipt parsing & recipe generation. Must be a new-format key (`AQ.*`) using `@google/genai` SDK.
- Supabase SQL must be run manually in Supabase before real auth/onboarding/profile/catalog/inventory/receipt behavior works.
- Middleware route policy:
  - Protected: `/dashboard/:path*`, `/profile/:path*`, `/auth/mfa`, and `/api/:path*`.
  - Public exception: `/api/catalog` and nested `/api/catalog/*`.
  - Onboarding API exception: `/api/profile` remains authenticated but is not blocked by the not-onboarded redirect so `/profile/setup` can submit.
  - MFA enforcement: if session AAL is `aal1` but next required level is `aal2`, all protected paths redirect to `/auth/mfa`.
- New users are expected to have `profiles.is_onboarded = false` from the auth trigger and are routed to `/profile/setup`.
- Successful Module 2 onboarding sets `profiles.is_onboarded = true`, enabling dashboard access and preventing return to `/profile/setup`.
- `household_size` is derived as the primary user plus submitted family members (`family_members.length + 1`).
- `/api/catalog` remains public through the existing middleware exception and returns seed fallback results if Supabase catalog access is unavailable.
- Inventory operations are always authenticated through `lib/supabase/server.ts` and explicitly scoped by `user_id = auth.uid()` / `user.id` in route queries.
- Inventory add workflows reuse `CatalogSearch` and `/api/catalog`; exact `item_name` + `unit` matches merge quantities instead of creating duplicate rows.
- Receipt scanner parses images via Gemini (`@google/genai` SDK, `gemini-2.5-flash`), fuzzy-matches line items against catalog, and merges confirmed items into `public.inventory_items`.
- 2FA is fully optional per user; users without 2FA enrolled see no change in login flow. Supabase MFA TOTP must be enabled in the project dashboard for enrollment to work.
- Recipe generation uses the modern `@google/genai` SDK and `gemini-2.5-flash` to construct customized recipes from checked pantry items, scaled to profile household sizes and excluding specified allergen or preference parameters.
- Recipe suggestions are persisted in `recipe_suggestions` and can be marked as `'cooked'` via `/api/recipes/cooked` endpoint.
- AI Chat uses conversation history and profile context to provide helpful culinary responses. If users specify missing ingredients, the chat engine dynamically triggers database exclusion updates and recipe updates in context.
- DB types in `lib/supabase/types.ts` are declared explicitly to avoid strict typecheck errors in Postgrest updates.

## 6. Next Immediate Steps
- Begin **Module 9: Consumption & Deduction Module**.
- Implement pantry deduction logic when the user clicks "I cooked this" on a recipe card, decrementing the quantities of used ingredients in `public.inventory_items`.
- Support manual consumption or deletion of items from the inventory.
