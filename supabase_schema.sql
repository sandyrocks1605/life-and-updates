-- LIFE AND UPDATES: Supabase setup
-- Run this in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'student' check (role in ('student','editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  chapter text,
  description text,
  important boolean not null default false,
  file_url text,
  file_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.notes enable row level security;

-- Users can read their own profile.
create policy "profiles self read" on public.profiles
for select to authenticated using (id = auth.uid());

-- Students and editors can read notes.
create policy "notes authenticated read" on public.notes
for select to authenticated using (true);

-- Only editors can insert/update/delete notes.
create policy "notes editor insert" on public.notes
for insert to authenticated
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='editor'));

create policy "notes editor update" on public.notes
for update to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='editor'))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='editor'));

create policy "notes editor delete" on public.notes
for delete to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='editor'));


-- Automatically create a student profile whenever a new Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Create the storage bucket in Dashboard > Storage named: notes
-- Make it public if you want direct "Open note" links.
-- Storage policies below allow only editors to upload/delete.
create policy "notes storage editor upload"
on storage.objects for insert to authenticated
with check (
  bucket_id='notes' and
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='editor')
);

create policy "notes storage editor delete"
on storage.objects for delete to authenticated
using (
  bucket_id='notes' and
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='editor')
);

-- After creating an account, promote it to editor with:
-- update public.profiles set role='editor' where email='YOUR-EDITOR-EMAIL';
--
-- IMPORTANT: Create profiles for users after signup. For a simple setup,
-- insert them manually in the SQL editor using the user's auth UUID:
-- insert into public.profiles(id,email,role) values('AUTH-USER-UUID','EMAIL','editor');
