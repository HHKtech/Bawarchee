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
