-- EduSphere AI — Supabase PostgreSQL Schema
-- Run this SQL in your Supabase project's SQL Editor (https://supabase.com/dashboard)
-- to create tables and configure access for the EduSphere backend.

create extension if not exists "pgcrypto";

-- 1. Courses Table
create table if not exists public.courses (
  id text primary key,
  code text not null,
  title text not null,
  instructor text not null,
  credits numeric(3,1) not null default 4.0,
  term text not null,
  status text not null check (status in ('active', 'completed')) default 'active',
  grade text not null default 'In Progress',
  current_score integer not null default 92,
  weekly_hours_target numeric(4,1) not null default 8.0,
  image_url text default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

-- 2. Syllabus Modules Table
create table if not exists public.syllabus_modules (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  week integer not null,
  title text not null,
  topic_summary text not null default '',
  completed boolean not null default false,
  due_date text not null default ''
);

-- 3. Research Notes Table
create table if not exists public.research_notes (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  authors text not null default '',
  year text not null default '2026',
  publication text not null default '',
  citation_key text not null default '',
  summary text not null default '',
  body text not null default '',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 4. Flashcards Table
create table if not exists public.flashcards (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  front text not null,
  back text not null,
  hint text not null default '',
  mastery integer not null default 0 check (mastery between 0 and 3),
  last_reviewed_at timestamptz
);

-- 5. Study Tasks Table
create table if not exists public.study_tasks (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  type text not null default 'Assignment',
  due_date text not null,
  estimated_minutes integer not null default 60,
  priority text not null check (priority in ('high', 'medium', 'low')) default 'medium',
  status text not null check (status in ('todo', 'in_progress', 'done')) default 'todo'
);

-- 6. Thesis Chapters Table
create table if not exists public.thesis_chapters (
  id text primary key,
  order_index integer not null,
  title text not null,
  target_words integer not null default 1500,
  content text not null default '',
  status text not null check (status in ('Drafting', 'Revising', 'Finalized')) default 'Drafting',
  updated_at timestamptz not null default now()
);

-- 7. Study Sessions Table
create table if not exists public.study_sessions (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  duration_minutes integer not null,
  focus_topic text not null,
  completed_at timestamptz not null default now()
);

-- 8. Scholar Profile Table
create table if not exists public.scholar_profiles (
  id text primary key default 'default',
  name text not null,
  program text not null default '',
  institution text not null default '',
  term text not null default '',
  gpa numeric(3,2) not null default 4.0,
  avatar_url text default '',
  thesis_title text default '',
  updated_at timestamptz not null default now()
);

-- Indexes for optimal lookup performance
create index if not exists idx_syllabus_course on public.syllabus_modules(course_id);
create index if not exists idx_notes_course on public.research_notes(course_id);
create index if not exists idx_flashcards_course on public.flashcards(course_id);
create index if not exists idx_tasks_course on public.study_tasks(course_id);
create index if not exists idx_sessions_course on public.study_sessions(course_id);

-- Row Level Security (RLS) Configuration
-- Enabling RLS and adding policies allows both anon and service_role keys to read and write.
alter table public.courses enable row level security;
alter table public.syllabus_modules enable row level security;
alter table public.research_notes enable row level security;
alter table public.flashcards enable row level security;
alter table public.study_tasks enable row level security;
alter table public.thesis_chapters enable row level security;
alter table public.study_sessions enable row level security;
alter table public.scholar_profiles enable row level security;

-- Permissive policies for workspace data
drop policy if exists "Allow all on courses" on public.courses;
create policy "Allow all on courses" on public.courses for all using (true) with check (true);

drop policy if exists "Allow all on syllabus_modules" on public.syllabus_modules;
create policy "Allow all on syllabus_modules" on public.syllabus_modules for all using (true) with check (true);

drop policy if exists "Allow all on research_notes" on public.research_notes;
create policy "Allow all on research_notes" on public.research_notes for all using (true) with check (true);

drop policy if exists "Allow all on flashcards" on public.flashcards;
create policy "Allow all on flashcards" on public.flashcards for all using (true) with check (true);

drop policy if exists "Allow all on study_tasks" on public.study_tasks;
create policy "Allow all on study_tasks" on public.study_tasks for all using (true) with check (true);

drop policy if exists "Allow all on thesis_chapters" on public.thesis_chapters;
create policy "Allow all on thesis_chapters" on public.thesis_chapters for all using (true) with check (true);

drop policy if exists "Allow all on study_sessions" on public.study_sessions;
create policy "Allow all on study_sessions" on public.study_sessions for all using (true) with check (true);
 
drop policy if exists "Allow all on scholar_profiles" on public.scholar_profiles;
create policy "Allow all on scholar_profiles" on public.scholar_profiles for all using (true) with check (true);

-- Explicit PostgreSQL Role Grants
-- Grants full table and schema access to anon and authenticated roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

