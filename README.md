# EduSphere AI — Supabase Integration & Architecture Guide

EduSphere AI is an intelligent academic copilot for coursework tracking, syllabus timelines, thesis structuring, research citations, and active recall mastery.

This document guides you through connecting and configuring **Supabase PostgreSQL** as the persistent cloud backend.

---

## ⚡ Quick Start: Connecting Supabase in 5 Steps

### 1. Create a Supabase Project
1. Log in or create an account at [https://supabase.com](https://supabase.com).
2. Click **New Project**, select your preferred organization, name it (e.g. `edusphere-ai`), choose a database password, and choose your preferred region.

### 2. Run the Database Schema
1. In your Supabase dashboard, navigate to **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) in this repository and copy its entire contents.
4. Paste the SQL into the editor and click **Run**.
   - This creates 8 tables: `courses`, `syllabus_modules`, `research_notes`, `flashcards`, `study_tasks`, `thesis_chapters`, `study_sessions`, and `scholar_profiles`.
   - It also configures indexes and Row Level Security (RLS) policies allowing full workspace access.

### 3. Copy API Credentials to `.env`
1. In Supabase, go to **Project Settings** (gear icon) ➔ **API**.
2. Copy:
   - **Project URL** (e.g. `https://your-project-ref.supabase.co`)
   - **anon / public key** or **service_role key** (secret)
3. Open or create the [`.env`](.env) file in the root directory:
   ```env
   # Supabase Backend Configuration
   SUPABASE_URL="https://your-project-ref.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Client-side mirror (optional for Vite SDK usage)
   VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

### 4. Seed and Test the Connection
Run the built-in database validation and seeding script:
```bash
npm run seed:supabase
```
This script will:
- Test network connectivity to your Supabase PostgreSQL instance.
- Check that all tables exist and report their row counts.
- Seed initial graduate courses, research notes, active-recall flashcards, and syllabus milestones from `.data/edusphere-db.json` into Supabase.

### 5. Launch the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The TopBar will display a **Supabase Live** indicator confirming that data is persisting directly to PostgreSQL.

---

## 🏗️ Architecture: Hybrid Supabase & Local Fallback

The backend uses a dual-engine data layer implemented in `src/server/store.ts`:

```
┌────────────────────────────────────────────────────────┐
│                   EduSphere AI UI                      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────▼─────────────────────────────┐
│             Express Backend (server.ts)                │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
  [Supabase Configured?]        [Not Configured / Offline]
             │                           │
             ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Supabase PostgreSQL    │   │      Local JSON DB       │
│  (Cloud Persistence)     │   │ (.data/edusphere-db.json)│
│  - courses               │   │                          │
│  - syllabus_modules      │   │  (Safe offline fallback  │
│  - research_notes        │   │   with zero data loss)   │
│  - flashcards            │   └──────────────────────────┘
│  - study_tasks           │
│  - thesis_chapters       │
│  - study_sessions        │
│  - scholar_profiles      │
└──────────────────────────┘
```

1. **Auto-Detection**: The backend automatically detects when Supabase credentials are present in `.env`.
2. **Auto-Seeding**: When connecting to a fresh database with empty tables, the server automatically migrates the initial academic dataset into Supabase without manual intervention.
3. **Resilient Fallback**: If Supabase credentials are not provided or if the database is temporarily unreachable, the app seamlessly operates on `.data/edusphere-db.json`.
4. **Live Diagnostic Indicator**: The TopBar in the UI dynamically queries `/api/supabase/status` and indicates whether the application is live on Supabase or using local storage.

---

## 📡 API Endpoints Reference

### Supabase Diagnostic & Management
- `GET /api/supabase/status` — Checks Supabase credentials, database connectivity, and record counts.
- `POST /api/supabase/seed` — Seeds or re-syncs workspace data from local JSON into Supabase PostgreSQL.

### Workspace Data CRUD
- `GET /api/workspace` — Retrieves complete snapshot (courses, syllabus, notes, flashcards, tasks, thesis chapters, sessions).
- `POST /api/courses` — Creates a course and its initial syllabus modules in Supabase.
- `DELETE /api/courses/:id` — Deletes a course (cascades to all associated modules, notes, and cards).
- `POST /api/courses/:courseId/modules` — Adds a syllabus module.
- `PATCH /api/courses/:courseId/modules/:moduleId` — Updates module completion status.
- `POST /api/notes` — Creates or updates a research note.
- `DELETE /api/notes/:id` — Deletes a research note.
- `POST /api/flashcards` — Adds new flashcards.
- `PATCH /api/flashcards/:id` — Updates flashcard mastery level (0–3) and review timestamp.
- `DELETE /api/flashcards/:id` — Deletes a flashcard.
- `POST /api/tasks` — Creates or updates a study planner task.
- `DELETE /api/tasks/:id` — Deletes a task.
- `PUT /api/thesis/chapters/:id` — Updates a thesis chapter's content or status.
- `POST /api/sessions` — Logs a completed study session with focus topic and duration.
