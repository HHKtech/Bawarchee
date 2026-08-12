# Bawarchee Progress

## 1. Current Project Status
- **Project:** Bawarchee (fresh-start Next.js 14 App Router app)
- **Overall roadmap:** 1 of 9 modules completed.
- **Completed module:** Module 1 — Auth Module.
- **Current status:** Runnable foundation created for future modules.
- **Pending modules:** Module 2 Profile & Family Setup, Module 3 Item Catalog & Search, Module 4 Inventory, Module 5 Receipt Scanner, Module 6 Dashboard Layout, Module 7 Recipe Generation, Module 8 AI Chat, Module 9 Consumption & Deduction.

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

## 3. Current Focus
- Module 1 is complete. The next focus is **Module 2: Profile & Family Setup Module**.

## 4. Key Technical Decisions / Env Vars / Architecture Notes
- Use **Next.js 14 App Router + TypeScript + Tailwind CSS**.
- Use **@supabase/ssr exclusively**; deprecated `@supabase/auth-helpers-nextjs` is not used.
- Auth client files expose `createClient()` separately for browser and server environments.
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` for OAuth redirects. Local default is `http://localhost:3000`.
  - `GOOGLE_GENERATIVE_AI_API_KEY` reserved for later Gemini modules.
- Supabase SQL must be run manually in Supabase before real auth/onboarding checks work.
- Middleware route policy:
  - Protected: `/dashboard/:path*`, `/profile/:path*`, `/api/:path*`.
  - Public exception: `/api/catalog` and nested `/api/catalog/*`.
  - Public auth pages: `/login`, `/signup`, with redirect to `/dashboard` if already onboarded.
- New users are expected to have `profiles.is_onboarded = false` from the auth trigger and are routed to `/profile/setup`.

## 5. Next Immediate Steps
- Begin Module 2: replace `/profile/setup` placeholder with onboarding form.
- Implement profile GET/POST route for profile and family member data.
- Add `family_members` schema/RLS and connect household/family-size onboarding fields.
- Set `profiles.is_onboarded = true` after successful onboarding.
