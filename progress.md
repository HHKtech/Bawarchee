# Bawarchee Progress

## 1. Current Project Status
- **Project:** Bawarchee (fresh-start Next.js 14 App Router app)
- **Overall roadmap:** 3 of 9 modules completed.
- **Completed modules:** Module 1 — Auth Module; Module 2 — Profile & Family Setup Module; Module 3 — Item Catalog & Search Module.
- **Current status:** Authenticated users can complete onboarding, manage cooking preferences, maintain household/family setup data, and search/select public grocery catalog items.
- **Pending modules:** Module 4 Inventory, Module 5 Receipt Scanner, Module 6 Dashboard Layout, Module 7 Recipe Generation, Module 8 AI Chat, Module 9 Consumption & Deduction.

## 2. Completed Modules & Sub-tasks
### Module 1 — Auth Module
- Created initial Next.js 14 App Router project files under `bawarchee/`:
  - `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`, `.gitignore`, `next-env.d.ts`.
  - `app/layout.tsx`, `app/page.tsx`, and `app/globals.css`.
- Added mandatory `progress.md` source-of-truth tracker.
- Added environment templates:
  - `.env.local.example`
  - `.env.local` placeholder values for local development.
- Implemented Supabase SSR helpers with `@supabase/ssr` only:
  - `lib/supabase/client.ts` uses `createBrowserClient`.
  - `lib/supabase/server.ts` uses `createServerClient` with Next.js cookies.
  - `lib/supabase/types.ts` defines typed `profiles` table state.
- Implemented auth actions and routes:
  - `app/auth/actions.ts` for email/password login, signup, Google OAuth, and logout.
  - `app/auth/callback/route.ts` for OAuth code exchange.
  - `app/auth/logout/route.ts` for route-handler logout support.
- Implemented auth UI:
  - `app/login/page.tsx` with `components/auth/LoginForm.tsx`.
  - `app/signup/page.tsx` with `components/auth/SignupForm.tsx`.
  - Google OAuth button on both login and signup flows.
  - `components/auth/LogoutButton.tsx` reusable logout form.
- Added protected route placeholders for later modules:
  - `app/dashboard/layout.tsx`
  - `app/dashboard/page.tsx`
  - `app/profile/setup/page.tsx`
  - `app/profile/page.tsx`
- Implemented `middleware.ts`:
  - Refreshes/reads Supabase session via `@supabase/ssr`.
  - Protects `/dashboard/*`, `/profile/*`, and `/api/*`.
  - Excludes `/api/catalog` from protected API routes.
  - Redirects unauthenticated protected-route visitors to `/login`.
  - Redirects authenticated but not-onboarded users to `/profile/setup`.
  - Redirects onboarded users away from `/login` and `/signup` to `/dashboard`.
- Added `supabase/schema.sql`:
  - `public.profiles` table with `id`, `is_onboarded`, `dietary_restrictions`, `allergies`, `cuisine_preference`, `cooking_skill`, `calorie_goal`, `household_size`, and `created_at`.
  - RLS enabled with own-profile select/update/insert policies.
  - `public.handle_new_user()` trigger function.
  - `on_auth_user_created` trigger on `auth.users`.
- Added minimal placeholders required by planned architecture:
  - `app/api/catalog/route.ts` public placeholder endpoint.
  - `lib/gemini.ts` reserved Gemini model constant.
  - `lib/catalog-seed.json` empty seed placeholder.
- Added `README.md` with setup, env vars, Supabase SQL, and run instructions.

### Module 2 — Profile & Family Setup Module
- Extended `supabase/schema.sql` with `public.family_members`:
  - `id`, `user_id`, `age_group`, and `created_at` columns.
  - `age_group` check constraint for `child`, `adult`, and `senior`.
  - RLS enabled with an authenticated own-row manage policy.
- Updated `lib/supabase/types.ts` with typed `family_members`, `AgeGroup`, and `CookingSkill` definitions while keeping `dietary_restrictions` and `cuisine_preference` as `text[]` and `allergies` as plain text.
- Added `app/api/profile/route.ts`:
  - `GET` authenticates the current user and returns their `profiles` row plus ordered `family_members` rows.
  - `POST` authenticates the current user, normalizes profile input, calculates `household_size = family_members.length + 1`, upserts `profiles` with `is_onboarded = true`, and replaces the user's family member rows.
- Replaced `app/profile/setup/page.tsx` with a 3-step onboarding wizard:
  - Preferences and restrictions with multi-select dietary/cuisine chips, allergies free text, cooking skill, and optional calorie goal.
  - Household/family member editor with dynamic age-group rows and real-time portion multiplier.
  - Review and submit step that saves via `POST /api/profile` and redirects to `/dashboard`.
- Replaced `app/profile/page.tsx` with editable profile settings:
  - Loads existing profile/family data from `GET /api/profile`.
  - Allows updating preferences, family members, and household sizing.
  - Saves updates through the shared profile API.
- Added shared Module 2 UI/util files:
  - `lib/profile-options.ts`
  - `lib/profile-api-types.ts`
  - `lib/profile-form.ts`
  - `components/profile/MultiSelectChips.tsx`
  - `components/profile/FamilyMembersEditor.tsx`
  - `components/profile/PreferencesFields.tsx`
  - `components/profile/ProfileReview.tsx`
- Updated `middleware.ts` onboarding flow:
  - Allows not-yet-onboarded users to call `/api/profile` from the setup wizard.
  - Redirects onboarded users away from `/profile/setup` to `/dashboard`.

### Module 3 — Item Catalog & Search Module
- Populated `lib/catalog-seed.json` with a curated grocery/pantry catalog covering Vegetables, Fruits, Meat & Poultry, Seafood, Dairy & Eggs, Grains & Pulses, Spices & Seasonings, Oils & Condiments, Bakery, Beverages, and Baking & Pantry.
- Added shared catalog utilities and types in `lib/catalog.ts`:
  - `CatalogItem` and `CatalogResponse` types.
  - category constants.
  - limit normalization and JSON seed filtering for fallback behavior.
- Extended `supabase/schema.sql` with `public.catalog_items`:
  - `id`, `name`, `category`, and `default_unit` columns.
  - unique item names.
  - RLS enabled with public read-only `select` policy for `anon` and `authenticated` roles.
  - indexes for `name` and `category`.
  - commented seed script using `jsonb_to_recordset` and the contents of `lib/catalog-seed.json`.
- Updated `lib/supabase/types.ts` with typed `catalog_items` table definitions.
- Replaced `app/api/catalog/route.ts` placeholder with a public `GET /api/catalog` endpoint:
  - accepts `q`, `category`, and `limit` query parameters.
  - performs Supabase `ilike` partial name search and category filtering.
  - returns `{ items, total }`.
  - falls back to local JSON seed filtering if Supabase env/database/table access is unavailable or the table has not been seeded yet.
- Added reusable `components/catalog/CatalogSearch.tsx`:
  - 200ms debounced search-as-you-type input.
  - category filter pills.
  - multi-select item cards and selected chips.
  - category badges and default unit display.
- Added standalone catalog preview page at `app/catalog/page.tsx` for manual end-to-end testing.
- Updated `README.md` with Module 3 details, Supabase catalog setup notes, and roadmap status.

## 3. Current Focus
- Module 3 is complete. The next focus is **Module 4: Inventory Module**.

## 4. Key Technical Decisions / Env Vars / Architecture Notes
- Use **Next.js 14 App Router + TypeScript + Tailwind CSS**.
- Use **@supabase/ssr exclusively**; deprecated `@supabase/auth-helpers-nextjs` is not used.
- Auth client files expose `createClient()` separately for browser and server environments.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` for OAuth redirects. Local default is `http://localhost:3000`.
  - `GOOGLE_GENERATIVE_AI_API_KEY` reserved for later Gemini modules.
- Supabase SQL must be run manually in Supabase before real auth/onboarding/profile behavior works.
- Middleware route policy:
  - Protected: `/dashboard/:path*`, `/profile/:path*`, `/api/:path*`.
  - Public exception: `/api/catalog` and nested `/api/catalog/*`.
  - Onboarding API exception: `/api/profile` remains authenticated but is not blocked by the not-onboarded redirect so `/profile/setup` can submit.
  - Public auth pages: `/login`, `/signup`, with redirect to `/dashboard` if already onboarded.
- New users are expected to have `profiles.is_onboarded = false` from the auth trigger and are routed to `/profile/setup`.
- Successful Module 2 onboarding sets `profiles.is_onboarded = true`, enabling dashboard access and preventing return to `/profile/setup`.
- `household_size` is derived as the primary user plus submitted family members (`family_members.length + 1`).
- `dietary_restrictions` and `cuisine_preference` remain Postgres `text[]`; `allergies` remains plain free text.
- `/api/catalog` remains public through the existing middleware exception and returns seed fallback results if Supabase catalog access is unavailable.
- Catalog search uses Supabase `ilike` for case-insensitive partial matching and the client UI debounces input by 200ms.

## 5. Next Immediate Steps
- Begin Module 4: Inventory Module.
- Reuse `components/catalog/CatalogSearch.tsx` for adding pantry items from the public catalog.
- Design authenticated inventory tables and APIs around the completed profile/family and catalog foundations.
