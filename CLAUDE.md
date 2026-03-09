# La Bicicleta Financiera — CLAUDE.md

You are the engineer on this project. Read this file completely before making any changes.

---

## Project Overview

Personal finance coaching web app. The coach (admin) advises clients individually. The app eliminates the repetitive initial interview and gives each client their own space to view their diagnosis, goals, and post-session tasks.

**Two roles:**
- `client` — completes onboarding (quiz + form), views their report, objectives, and tasks
- `admin` — views all clients, generates AI reports via Claude API, publishes content, loads objectives and tasks

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 4.18, TypeScript |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| AI | Anthropic Claude API (latest) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Running the Project

```bash
# From root — runs frontend (3000) and backend (3001) in parallel
npm run dev

# Frontend only
cd frontend && npm run dev

# Backend only
cd backend && npm run dev
```

**Required environment variables:**

Backend (`backend/.env`):
```
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_KEY=      # service_role key — bypasses RLS
ANTHROPIC_API_KEY=
```

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Project Structure

```
labicicletafinanciera/
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── auth/               # login, register, callback, onboarding redirect
│   │   ├── admin/              # admin panel (in development)
│   │   ├── dashboard/          # client dashboard (in development)
│   │   └── onboarding/         # quiz + form flow
│   ├── components/auth/        # AuthCard, AuthLayout, OtpInput
│   └── lib/
│       ├── auth/actions.ts     # OTP, password auth, signOut, getUserProfile
│       ├── onboarding/         # onboarding actions
│       └── supabase/           # client.ts, server.ts, middleware.ts
└── backend/
    └── src/
        ├── index.ts            # Express server
        └── lib/supabase.ts     # admin client with service_role key
```

---

## Auth — What's Working

- Login and registration with **OTP via email** (6-digit code flow)
- Login and registration with **email + password**
- Post-login redirect by role: `admin` → `/admin`, `client` → `/dashboard`
- Supabase middleware for SSR session refresh
- `profiles` table in Supabase with `role` field ('admin' | 'client')

**Rule:** Frontend uses `@supabase/ssr` for cookie-based session management. Backend uses `service_role` key to bypass RLS when needed.

---

## Database Schema

### Auth and users
```sql
profiles (
  id uuid references auth.users,
  email text,
  full_name text,
  role text CHECK (role IN ('admin', 'client')),
  created_at timestamptz
)
```

### Engagements (coach-client sessions)
```sql
engagements (
  id uuid,
  user_id uuid references profiles,
  title text,
  engagement_number int,
  status text CHECK (status IN ('pending', 'active', 'completed')),
  engagement_date date
)
```

**Engagement lifecycle:**
1. Created with status `active` when the client starts answering the quiz
2. Moves to `completed` when the client finishes quiz + form
3. Admin reviews responses, has the in-person session, generates and publishes the report
4. Admin loads objectives and tasks referencing that `engagement_id`

**Key rule — objectives and tasks are cross-engagement:**
Even though each objective and task has an `engagement_id` (the engagement in which it was created), the client sees ALL of them together in their dashboard without filtering by engagement. They are long-term commitments that persist across multiple sessions over time.

**Client dashboard data reads:**
- Report: latest record in `reports` where `reporte_publicado = true`
- Objectives: all records in `objetivos` for that `user_id` (no engagement filter)
- Tasks: all records in `tareas` for that `user_id` (no engagement filter)

### Quiz system (dynamic content — lives in DB, not in code)
```sql
quizzes (
  id uuid,
  name text,
  type text CHECK (type IN ('onboarding', 'followup', 'assessment'))
)

quiz_questions (
  id uuid,
  question text,
  option_a text,
  option_b text,
  option_c text,
  correct_option text CHECK (correct_option IN ('a', 'b', 'c')),
  explanation text,   -- shown after answering, must teach not just confirm
  topic text          -- emergency_fund | bad_debt | compound_interest | budgeting | etc.
)

quiz_question_map (
  quiz_id uuid references quizzes,
  question_id uuid references quiz_questions,
  position int        -- order within the quiz
)

quiz_attempts (
  id uuid,
  user_id uuid references profiles,
  engagement_id uuid references engagements,
  quiz_id uuid references quizzes,
  score int,
  level text,         -- 'beginner' | 'intermediate' | 'advanced'
  answers jsonb       -- { "question_uuid": "a" }
)
```

### Form system (dynamic content — lives in DB, not in code)
```sql
forms (
  id uuid,
  name text,
  type text CHECK (type IN ('onboarding', 'followup', 'checkin'))
)

form_sections (
  id uuid,
  form_id uuid references forms,
  title text,
  description text,
  position int
)

form_questions (
  id uuid,
  section_id uuid references form_sections,
  label text,
  field_type text CHECK (field_type IN ('text','number','radio','checkbox','select','textarea')),
  options jsonb,      -- [{ "value": "string", "label": "string" }]
  placeholder text,
  required boolean,
  position int
)

form_answers (
  id uuid,
  user_id uuid references profiles,
  engagement_id uuid references engagements,
  question_id uuid references form_questions,
  value jsonb         -- any type: string, number, array
)
```

### Reports, objectives and tasks
```sql
reports (
  id uuid,
  user_id uuid references profiles,
  engagement_id uuid references engagements,
  reporte_texto text,
  reporte_publicado boolean DEFAULT false
)

objetivos (
  id uuid,
  user_id uuid references profiles,
  engagement_id uuid references engagements,
  titulo text,
  descripcion text,
  eta date,
  orden int
)

tareas (
  id uuid,
  user_id uuid references profiles,
  engagement_id uuid references engagements,
  descripcion text,
  completada boolean DEFAULT false,
  completada_at timestamptz,
  orden int
)
```

### Fixed UUIDs for initial seeded content
```
Onboarding quiz:    'a1b2c3d4-0000-0000-0000-000000000001'
Quiz questions:     '...000010' (emergency fund)
                    '...000011' (bad debt)
                    '...000012' (compound interest)
                    '...000013' (budgeting)
Onboarding form:    'b2c3d4e5-0000-0000-0000-000000000001'
Form sections:      '...000010' (personal data)
                    '...000020' (financial situation)
                    '...000030' (mindset and goals)
```

---

## Code Conventions

- **Strict TypeScript** — no `any` unless unavoidable and commented
- **Server Components by default** in Next.js — use `'use client'` only when required (interactivity, hooks)
- **Server actions** go in `lib/[feature]/actions.ts`
- **All code in English** — variable names, functions, types, DB column names
- **All UI text in Spanish** — everything the user sees is in Argentine Spanish using "vos"
- **Tailwind** for styles — no custom CSS except edge cases
- **Zod** for frontend form validation
- **React Hook Form** for form state management

### Tailwind custom color palette

All custom colors are under the `bicicleta` namespace. Always use `bicicleta-*` classes, never raw hex values in components.

```
bicicleta-bg:           #0a0a0f        dark background
bicicleta-surface:      #13131a        card / panel surface
bicicleta-surface2:     #1c1c26        secondary surface / nested cards
bicicleta-border:       #2a2a3d        borders and dividers
bicicleta-accent:       #7c6af7        primary accent (purple)
bicicleta-accent-light: #a394ff        hover / lighter accent
bicicleta-accent-glow:  rgba(124,106,247,0.15)   glow effects
bicicleta-text:         #f0f0f8        primary text
bicicleta-text-muted:   #8080a0        secondary / muted text
bicicleta-text-dim:     #4a4a6a        disabled / placeholder text
bicicleta-success:      #4ade80        success states
bicicleta-error:        #f87171        error states
```

Usage examples: `bg-bicicleta-bg`, `text-bicicleta-text`, `border-bicicleta-border`, `bg-bicicleta-accent`

---

## Backend Rules

- Express server runs on port **3001**
- Use `supabase` (service_role) admin client for operations that need to bypass RLS
- All endpoints must validate a valid Supabase JWT before processing
- Claude API report generation lives in the backend — never call Anthropic from the frontend
- Authenticate requests by extracting the Bearer token from the `Authorization` header and verifying it with Supabase

### API endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/health` | public | Health check ✅ |
| GET | `/api/clients` | admin | Client list with status |
| GET | `/api/clients/:id` | admin | Client quiz + form responses |
| POST | `/api/reports/generate` | admin | Generate report via Claude, creates record in `reports` |
| PUT | `/api/reports/:id` | admin | Edit report text |
| PATCH | `/api/reports/:id/publish` | admin | Publish report (`reporte_publicado = true`) |
| POST | `/api/clients/:id/objectives` | admin | Load objectives for a client |
| POST | `/api/clients/:id/tasks` | admin | Load tasks for a client |
| GET | `/api/me/dashboard` | client | Report + all objectives + all tasks |
| PATCH | `/api/tasks/:id/complete` | client | Mark task as completed |

---

## Project Status

### Complete ✅
- Auth system (OTP + password, two roles, post-login redirect)
- Supabase SSR middleware
- Base components (AuthCard, OtpInput, AuthLayout)
- Tailwind custom theme configuration
- Onboarding: quiz loaded in DB, client can answer and data persists to DB
- Engagement created when quiz starts (`active`), completed when quiz + form are done

### Pending for V0 📋

**Client side:**
- Dashboard "waiting" state (completed onboarding, waiting for first session)
- Dashboard with published report (report + objectives + tasks, cross-engagement)
- Mark tasks as completed

**Admin side:**
- Client list with status
- Client profile with full history
- Engagement detail with report generation flow

**Backend:**
- All API endpoints listed in the table above

---

## Routing Structure

### Admin routes
```
/admin
  Client list table
  Columns: name, email, engagement count, latest engagement status, last activity date

/admin/clients/[id]
  Client profile — single scroll page with:
  ├── Header: name, email, quiz level from latest attempt
  ├── Cross-engagement summary: all active objectives + all pending tasks
  └── Engagement history: list of all engagements (date, status, has report)
      → each row links to /admin/clients/[id]/engagements/[engagementId]

/admin/clients/[id]/engagements/[engagementId]
  Engagement detail:
  ├── Quiz results: score, level, each question with client's answer
  ├── Form responses: grouped by section
  ├── Report: generate button → editable textarea → publish button
  └── Objectives and tasks created in this engagement
```

### Client routes
```
/dashboard
  Global cross-engagement view — single scroll page:
  ├── If no published report: "waiting" state (onboarding complete, session pending)
  └── If published report exists:
      ├── Latest published report text
      ├── All objectives (from any engagement, ordered by eta)
      ├── All tasks (from any engagement, pending first)
      └── Engagement history: list of past sessions with date
```

### Key design decisions
- Admin always enters at the client profile level, not directly into an engagement
- Client sees a cross-engagement unified view — never needs to think about sessions
- Engagement history is visible on both sides for transparency and tracking
- V0 has one engagement per client — the routing already supports multiple without changes

---

## Business Context (important for making decisions)

- **Target audience:** Argentine clients, high inflation context, local instruments (FCI, CEDEARs, plazo fijo, crypto, MEP dollar)
- **Coach voice:** direct, warm, no jargon, uses Argentine "vos" second person
- **Quiz level result** (beginner/intermediate/advanced) adjusts the tone of the Claude-generated report automatically
- **All quiz and form content lives in Supabase** — the system is 100% dynamic, nothing hardcoded in code
- **V0 scope:** does NOT include notifications, progress tracking over time, multi-session history, or integrated payments

---

## Non-Negotiable Rules

1. **Never hardcode quiz or form content in code** — always insert via SQL into the DB
2. **Never call Anthropic API from the frontend** — backend only
3. **Always validate user role** before rendering admin content
4. **service_role key stays in the backend** — never expose to frontend
5. When generating SQL for new quizzes/forms, use `uuid_generate_v4()` for new IDs