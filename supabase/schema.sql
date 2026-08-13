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


-- Bawarchee Module 5 Phase 1: receipt scan foundation

create table if not exists public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  image_url text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'discarded')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.receipt_scan_items (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.receipt_scans(id) on delete cascade,
  raw_text text not null,
  matched_catalog_item_id uuid references public.catalog_items(id) on delete set null,
  matched_item_name text,
  quantity numeric not null default 1 check (quantity >= 0),
  unit text not null default 'pcs',
  confirmed boolean not null default false
);

alter table public.receipt_scans enable row level security;
alter table public.receipt_scan_items enable row level security;

drop policy if exists "Users can manage their own receipt scans" on public.receipt_scans;

create policy "Users can manage their own receipt scans"
  on public.receipt_scans for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own receipt scan items" on public.receipt_scan_items;
drop policy if exists "Users can insert their own receipt scan items" on public.receipt_scan_items;
drop policy if exists "Users can update their own receipt scan items" on public.receipt_scan_items;
drop policy if exists "Users can delete their own receipt scan items" on public.receipt_scan_items;

create policy "Users can read their own receipt scan items"
  on public.receipt_scan_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.receipt_scans scans
      where scans.id = receipt_scan_items.scan_id
        and scans.user_id = auth.uid()
    )
  );

create policy "Users can insert their own receipt scan items"
  on public.receipt_scan_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.receipt_scans scans
      where scans.id = receipt_scan_items.scan_id
        and scans.user_id = auth.uid()
    )
  );

create policy "Users can update their own receipt scan items"
  on public.receipt_scan_items for update
  to authenticated
  using (
    exists (
      select 1
      from public.receipt_scans scans
      where scans.id = receipt_scan_items.scan_id
        and scans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.receipt_scans scans
      where scans.id = receipt_scan_items.scan_id
        and scans.user_id = auth.uid()
    )
  );

create policy "Users can delete their own receipt scan items"
  on public.receipt_scan_items for delete
  to authenticated
  using (
    exists (
      select 1
      from public.receipt_scans scans
      where scans.id = receipt_scan_items.scan_id
        and scans.user_id = auth.uid()
    )
  );

create index if not exists receipt_scans_user_created_at_idx on public.receipt_scans (user_id, created_at desc);
create index if not exists receipt_scan_items_scan_id_idx on public.receipt_scan_items (scan_id);

-- Private Supabase Storage bucket for receipt images.
-- Expected object path convention for later upload flows: {auth.uid()}/{scan-id-or-filename}.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their own receipt images" on storage.objects;
drop policy if exists "Users can upload their own receipt images" on storage.objects;
drop policy if exists "Users can update their own receipt images" on storage.objects;
drop policy if exists "Users can delete their own receipt images" on storage.objects;

create policy "Users can read their own receipt images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload their own receipt images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own receipt images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own receipt images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- Bawarchee Module 7: Recipe Generation Module

create table if not exists public.recipe_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  selected_inventory_item_ids uuid[] default '{}'::uuid[],
  exclusions text[] default '{}'::text[],
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.recipe_suggestions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.recipe_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  ingredients_used jsonb not null, -- format: Array<{ item_name: string, quantity: number, unit: string }>
  steps text[] not null,
  est_time_minutes integer,
  est_calories integer,
  serves integer,
  status text not null default 'suggested' check (status in ('suggested', 'cooked')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.recipe_sessions enable row level security;
alter table public.recipe_suggestions enable row level security;

drop policy if exists "Users can manage their own recipe sessions" on public.recipe_sessions;
create policy "Users can manage their own recipe sessions"
  on public.recipe_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own recipe suggestions" on public.recipe_suggestions;
create policy "Users can manage their own recipe suggestions"
  on public.recipe_suggestions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists recipe_sessions_user_id_idx on public.recipe_sessions (user_id);
create index if not exists recipe_suggestions_session_id_idx on public.recipe_suggestions (session_id);
create index if not exists recipe_suggestions_user_id_idx on public.recipe_suggestions (user_id);

grant all privileges on table public.recipe_sessions to authenticated;
grant all privileges on table public.recipe_suggestions to authenticated;
grant all privileges on table public.recipe_sessions to service_role;
grant all privileges on table public.recipe_suggestions to service_role;


-- Bawarchee Module 8: AI Chat Module

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.recipe_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.chat_messages enable row level security;

drop policy if exists "Users can manage their own chat messages" on public.chat_messages;
create policy "Users can manage their own chat messages"
  on public.chat_messages for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);
create index if not exists chat_messages_user_id_idx on public.chat_messages (user_id);

grant all privileges on table public.chat_messages to authenticated;
grant all privileges on table public.chat_messages to service_role;



