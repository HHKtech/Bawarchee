# Bawarchee 🍳

Intelligent household pantry inventory tracker and Gemini-powered conversational recipe assistant. Bawarchee uses Next.js 14, Supabase (with SSR auth/storage/db), and the Gemini 2.5 Flash API to help households manage ingredients, parse receipts, generate portion-scaled recipe suggestions, converse with a culinary assistant, and automatically deduct ingredients from the pantry.

---

## 🚀 Key Features

- **🔐 Robust Authentication & TOTP 2FA**: Email/password authentication, Google OAuth sign-in, and optional per-user Time-based One-Time Password (TOTP) two-factor authentication.
- **📋 Profile & Onboarding Setup Wizard**: Fast household wizard detailing preferences (cuisine, cooking skill, dietary restrictions, allergies) and family members, dynamically computing the total household size.
- **🔍 Curated Grocery Catalog**: Multi-select catalog search covering major food groups and fallback local search.
- **📦 Pantry Inventory Tracking**: User-scoped inventory items with quantity tracking, inline editing, and smart merging (automatically merging exact item name & unit matches).
- **📷 AI Receipt Scanner**: Scan physical grocery receipts using Gemini 2.5 Flash to automatically extract line items and quantities, review matches, and merge them into the inventory in one click.
- **⚡ Three-Panel Interactive Dashboard**: A responsive dashboard that is switchable between mobile and desktop views:
  - **Panel 1: Inventory Management** (with items checklist selection)
  - **Panel 2: Conversational Chef Chat** (culinary chat assistant)
  - **Panel 3: Recipe Generator** (displaying portion-scaled instructions)
- **✨ Portion-Scaled Recipe Generation**: Instantly generate customized, allergen-safe recipe suggestions scaled to your household size using selected pantry ingredients.
- **💬 Conversational Chef Chat**: Ask cooking questions, discuss ingredient substitutions, or state missing ingredients (e.g. *"I don't have butter"*), which updates active exclusions and automatically regenerates recipe suggestions in real-time.
- **🍳 Inventory Consumption & Deduction**: Clicking *"I cooked this! 🍳"* on a recipe card automatically deducts the ingredient quantities from your database pantry, deleting items when depleted ($\le 0$), and triggers a live panel refresh.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 App Router (React 18, TypeScript)
- **Styling**: Tailwind CSS, CSS variables, micro-animations
- **Database & Auth**: Supabase Database, Supabase Auth SSR (`@supabase/ssr`), Row Level Security (RLS) policies, and Supabase Storage (receipt bucket)
- **AI Engine**: `@google/genai` (SDK) with model `gemini-2.5-flash` in JSON Mode

---

## 📋 Prerequisites

- **Node.js**: `18.17+` or higher.
- **Supabase**: An active Supabase project with email/password auth enabled.
- **Google GenAI API Key**: A valid API key with access to `gemini-2.5-flash`.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

> [!NOTE]
> Make sure `NEXT_PUBLIC_SITE_URL` matches your local default port or production domain for redirecting OAuth callbacks and password resets.

---

## 🗄️ Supabase Database & Storage Setup

1. Open your **Supabase Dashboard**.
2. Go to the **SQL Editor** and execute the entire SQL schema in [supabase/schema.sql](file:///c:/Users/hasee/OneDrive/Desktop/New%20folder/supabase/schema.sql). This will set up:
   - Tables (`profiles`, `family_members`, `catalog_items`, `inventory_items`, `receipt_scans`, `receipt_scan_items`, `recipe_sessions`, `recipe_suggestions`, `chat_messages`).
   - Database indexes to optimize query lookups.
   - Row Level Security (RLS) policies scoped to owners.
   - Trigger functions (like `handle_new_user` on auth signup).
   - Privilege grants for standard authentication roles.
3. To seed the grocery catalog, copy the catalog JSON array from `lib/catalog-seed.json` into the commented `jsonb_to_recordset` seed query at the bottom of `supabase/schema.sql`, and execute it in your SQL Editor.
4. Create a **Private Storage Bucket** in Supabase named `receipts` to store uploaded receipt scans securely.

---

## 💻 Running the App Locally

First, install dependencies:
```bash
npm install
```

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Project Roadmap (All 9 Modules Live)

- [x] **Module 1**: Authentication & Security (Email/Password, Google OAuth, TOTP 2FA)
- [x] **Module 2**: Profile & Family Setup Wizard
- [x] **Module 3**: Item Catalog & Multi-Select Search
- [x] **Module 4**: Pantry Inventory Management (CRUD)
- [x] **Module 5**: Gemini AI Grocery Receipt Scanner
- [x] **Module 6**: Responsive Three-Panel Dashboard Composition
- [x] **Module 7**: Portion-Scaled Recipe Generation
- [x] **Module 8**: Conversational Culinary Chat Assistant
- [x] **Module 9**: Automatic Inventory Consumption & Deduction
