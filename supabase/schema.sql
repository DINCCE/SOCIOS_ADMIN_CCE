-- Create a table for public profiles linked to auth.users
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(full_name) >= 3)
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- Policy: Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Realtime subscription setup
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Example Transactional Table: Todos
create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  is_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table todos enable row level security;

create policy "Users can view their own todos"
  on todos for select
  using ( auth.uid() = user_id );

create policy "Users can create their own todos"
  on todos for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own todos"
  on todos for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own todos"
  on todos for delete
  using ( auth.uid() = user_id );
