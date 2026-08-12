-- Bawarchee Module 1: auth profile foundation
-- Run this in the Supabase SQL editor for the project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_onboarded boolean not null default false,
  dietary_restrictions text[] default '{}'::text[],
  allergies text,
  cuisine_preference text[] default '{}'::text[],
  cooking_skill text,
  calorie_goal integer,
  household_size integer default 1 check (household_size is null or household_size > 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, is_onboarded)
  values (new.id, false)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bawarchee Module 2: profile family setup

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  age_group text not null default 'adult' check (age_group in ('child', 'adult', 'senior')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.family_members enable row level security;

drop policy if exists "Users can manage their own family members" on public.family_members;

create policy "Users can manage their own family members"
  on public.family_members for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Bawarchee Module 3: public grocery catalog

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text not null,
  default_unit text not null
);

alter table public.catalog_items enable row level security;

drop policy if exists "Catalog items are publicly readable" on public.catalog_items;

create policy "Catalog items are publicly readable"
  on public.catalog_items for select
  to anon, authenticated
  using (true);

create index if not exists catalog_items_name_idx on public.catalog_items (name);
create index if not exists catalog_items_category_idx on public.catalog_items (category);

-- Seed script guidance:
-- 1. Copy the JSON array from lib/catalog-seed.json.
-- 2. In Supabase SQL editor, paste it into the jsonb literal below and run:
--
-- with seed_items as (
--   select *
--   from jsonb_to_recordset($json$
--   [paste lib/catalog-seed.json contents here]
--   $json$::jsonb) as item(name text, category text, default_unit text)
-- )
-- insert into public.catalog_items (name, category, default_unit)
-- select lower(trim(name)), trim(category), trim(default_unit)
-- from seed_items
-- on conflict (name) do update
-- set category = excluded.category,
--     default_unit = excluded.default_unit;


-- Bawarchee Module 4: authenticated inventory items

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  catalog_item_id uuid references public.catalog_items(id) on delete set null,
  item_name text not null,
  category text default 'Other',
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  added_via text default 'search' check (added_via in ('search', 'receipt', 'manual')),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.inventory_items enable row level security;

drop policy if exists "Users can manage their own inventory items" on public.inventory_items;

create policy "Users can manage their own inventory items"
  on public.inventory_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists inventory_items_user_item_name_idx on public.inventory_items (user_id, item_name);
