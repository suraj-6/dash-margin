-- Margins Supabase schema
-- Paste this into the Supabase SQL editor after creating your project.

-- Required extensions for UUID generation
create extension if not exists "pgcrypto";

-- Users table (extends Supabase auth)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  institution text,
  depth_level integer default 0,
  articles_read integer default 0,
  annotations_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Articles table
create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  author_name text not null,
  content text not null,
  read_time_minutes integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Annotations table
create table if not exists annotations (
  id uuid default gen_random_uuid() primary key,
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  highlighted_text text not null,
  paragraph_index integer not null,
  annotation_text text not null,
  annotation_type text check (annotation_type in ('insight', 'question', 'challenge', 'connection')),
  quality_score double precision default 0,
  created_at timestamp with time zone default now()
);

-- Annotation replies
create table if not exists annotation_replies (
  id uuid default gen_random_uuid() primary key,
  annotation_id uuid references annotations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  reply_text text not null,
  created_at timestamp with time zone default now()
);

-- Reading progress tracking
create table if not exists reading_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  scroll_depth double precision default 0,
  time_spent_seconds integer default 0,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- Row Level Security policies
alter table profiles enable row level security;
alter table articles enable row level security;
alter table annotations enable row level security;
alter table annotation_replies enable row level security;
alter table reading_progress enable row level security;

-- Allow public read access to articles
drop policy if exists "Articles are viewable by everyone" on articles;
create policy "Articles are viewable by everyone" on articles
  for select using (true);

-- Allow public read access to annotations
drop policy if exists "Annotations are viewable by everyone" on annotations;
create policy "Annotations are viewable by everyone" on annotations
  for select using (true);

-- Allow authenticated users to create annotations
drop policy if exists "Users can create annotations" on annotations;
create policy "Users can create annotations" on annotations
  for insert with check (auth.uid() = user_id);

-- Users can view their own reading progress
drop policy if exists "Users can view own reading progress" on reading_progress;
create policy "Users can view own reading progress" on reading_progress
  for select using (auth.uid() = user_id);

-- Users can update their own reading progress
drop policy if exists "Users can update own reading progress" on reading_progress;
create policy "Users can update own reading progress" on reading_progress
  for all using (auth.uid() = user_id);

-- Helpful indexes
create index if not exists annotations_article_id_idx on annotations(article_id);
create index if not exists annotations_user_id_idx on annotations(user_id);
create index if not exists annotation_replies_annotation_id_idx on annotation_replies(annotation_id);
create index if not exists reading_progress_user_id_idx on reading_progress(user_id);
create index if not exists reading_progress_article_id_idx on reading_progress(article_id);

-- ============================================================
-- RPC Functions (used by the API layer)
-- ============================================================

-- Atomically increment a user's annotations_count
create or replace function increment_annotations_count(user_id_param uuid)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set annotations_count = coalesce(annotations_count, 0) + 1,
      updated_at = now()
  where id = user_id_param;
end;
$$;

-- ============================================================
-- Triggers: Auto-create profile on user sign-up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, depth_level, articles_read, annotations_count)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Anonymous Reader'),
    new.raw_user_meta_data->>'avatar_url',
    0,
    0,
    0
  );
  return new;
end;
$$;

-- Trigger fires after a new user is created in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Additional RLS Policies
-- ============================================================

-- Profiles: users can read any profile, update their own
drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Replies: viewable by everyone, insertable by authenticated users
drop policy if exists "Replies are viewable by everyone" on annotation_replies;
create policy "Replies are viewable by everyone" on annotation_replies
  for select using (true);

drop policy if exists "Users can create replies" on annotation_replies;
create policy "Users can create replies" on annotation_replies
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- Seed: Sample article
-- ============================================================

insert into articles (id, title, subtitle, author_name, content, read_time_minutes)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Network Effects in Knowledge Platforms',
  'Why the best communities are small, dense, and trust-rich',
  'Margins Research',
  E'Knowledge networks operate on fundamentally different principles than social networks. While social platforms optimize for engagement and viral spread, knowledge networks thrive on depth, context, and accumulated trust between participants.\n\nConsider how the best academic departments function. It''s not the largest departments that produce groundbreaking research — it''s the ones where researchers deeply understand each other''s work, where the density of connections matters more than the breadth. A physicist who has spent years reading and engaging with a colleague''s papers can offer insights that no casual observer ever could.\n\nThis principle extends beyond academia. In any domain where ideas matter, the quality of discourse is determined by the shared context between participants. When everyone in a conversation has read the same foundational texts, engaged with the same core arguments, and built upon each other''s thinking, the conversation operates at a fundamentally different level.\n\nThe implications for platform design are profound. Most social platforms treat all users as interchangeable nodes in a network. But in knowledge networks, each node has a unique intellectual signature — a combination of what they''ve read, what they''ve thought about it, and how they''ve connected ideas across domains.\n\nThis is why curation becomes the most valuable skill in an information-rich world. Not algorithmic curation that optimizes for engagement, but human curation that optimizes for intellectual growth. The curator who can identify which five articles will fundamentally shift your thinking on a topic is providing more value than any recommendation algorithm.\n\nThe future of knowledge platforms lies in what we might call "trust architecture" — systems that make the depth of engagement visible, that reward quality over quantity, and that create spaces where the best thinking naturally rises to the surface. Not through votes or likes, but through the accumulated evidence of genuine intellectual engagement.',
  8
)
on conflict (id) do nothing;
