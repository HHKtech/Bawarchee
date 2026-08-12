# Bawarchee

Bawarchee is a fresh-start Next.js 14 App Router application for intelligent household pantry inventory and conversational recipe assistance.

This repository currently implements **Module 1: Auth Module**, **Module 2: Profile & Family Setup Module**, and **Module 3: Item Catalog & Search Module**.

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
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key-for-later-modules
```

`GOOGLE_GENERATIVE_AI_API_KEY` is included now because later modules use Gemini 1.5 Flash, but Modules 1-2 do not call Gemini.

## Supabase setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor. It creates:

- `public.profiles`
- `public.family_members`
- `public.catalog_items`
- Row Level Security policies for user-owned profile/family access and public read-only catalog access
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
4. Inventory Module — next
5. Receipt Scanner Module
6. Dashboard Layout Module
7. Recipe Generation Module
8. AI Chat Module
9. Consumption & Deduction Module
