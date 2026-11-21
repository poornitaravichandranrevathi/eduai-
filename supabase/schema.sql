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

-- 9. Customer Support & Inquiries Table
create table if not exists public.customer_inquiries (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  category text not null check (category in ('Academic Advisory', 'Course Content', 'Technical Support', 'Thesis & Research', 'Billing & Account', 'General Inquiry')),
  priority text not null check (priority in ('high', 'medium', 'low')) default 'medium',
  status text not null check (status in ('pending', 'in_progress', 'responded', 'resolved')) default 'pending',
  course_id text references public.courses(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  ai_suggested_response text default '',
  satisfaction_rating integer check (satisfaction_rating between 1 and 5),
  customer_feedback text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. AI Chatbots & Customer Auto-Responders
create table if not exists public.chatbots (
  id text primary key,
  name text not null,
  description text not null default '',
  avatar_icon text not null default 'bot',
  avatar_color text not null default 'purple',
  category text not null default 'Student Support',
  model text not null default 'gemini-4-hydrogen',
  temperature numeric not null default 0.7,
  system_prompt text not null default '',
  welcome_message text not null default '',
  suggested_prompts jsonb not null default '[]'::jsonb,
  knowledge_base_course_ids jsonb not null default '[]'::jsonb,
  assigned_inquiry_categories jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  auto_reply_to_inquiries boolean not null default false,
  metrics jsonb not null default '{"conversationsCount":0,"resolvedTicketsCount":0,"avgSatisfaction":5.0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for optimal lookup performance
create index if not exists idx_syllabus_course on public.syllabus_modules(course_id);
create index if not exists idx_notes_course on public.research_notes(course_id);
create index if not exists idx_flashcards_course on public.flashcards(course_id);
create index if not exists idx_tasks_course on public.study_tasks(course_id);
create index if not exists idx_sessions_course on public.study_sessions(course_id);
create index if not exists idx_inquiries_status on public.customer_inquiries(status);
create index if not exists idx_inquiries_customer on public.customer_inquiries(customer_email);

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
alter table public.customer_inquiries enable row level security;
alter table public.chatbots enable row level security;

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

drop policy if exists "Allow all on customer_inquiries" on public.customer_inquiries;
create policy "Allow all on customer_inquiries" on public.customer_inquiries for all using (true) with check (true);

drop policy if exists "Allow all on chatbots" on public.chatbots;
create policy "Allow all on chatbots" on public.chatbots for all using (true) with check (true);

-- Explicit PostgreSQL Role Grants
-- Grants full table and schema access to anon and authenticated roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

