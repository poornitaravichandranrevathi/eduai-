-- EduSphere AI — Supabase PostgreSQL Schema
-- Run this SQL in your Supabase project's SQL Editor to enable live Supabase persistence.

create extension if not exists "pgcrypto";

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

create table if not exists public.syllabus_modules (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  week integer not null,
  title text not null,
  topic_summary text not null default '',
  completed boolean not null default false,
  due_date text not null default ''
);

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

create table if not exists public.flashcards (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  front text not null,
  back text not null,
  hint text not null default '',
  mastery integer not null default 0 check (mastery between 0 and 3),
  last_reviewed_at timestamptz
);

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

create table if not exists public.thesis_chapters (
  id text primary key,
  order_index integer not null,
  title text not null,
  target_words integer not null default 1500,
  content text not null default '',
  status text not null check (status in ('Drafting', 'Revising', 'Finalized')) default 'Drafting',
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  duration_minutes integer not null,
  focus_topic text not null,
  completed_at timestamptz not null default now()
);

create index if not exists idx_syllabus_course on public.syllabus_modules(course_id);
create index if not exists idx_notes_course on public.research_notes(course_id);
create index if not exists idx_flashcards_course on public.flashcards(course_id);
create index if not exists idx_tasks_course on public.study_tasks(course_id);
create index if not exists idx_sessions_course on public.study_sessions(course_id);
