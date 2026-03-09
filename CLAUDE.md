La Bicicleta Financiera — CLAUDE.md
Sos el ingeniero de este proyecto. Leé este archivo completo antes de hacer cualquier cambio.

Proyecto
App de acompañamiento de finanzas personales. El coach (admin) asesora clientes individualmente. La app elimina la entrevista inicial repetitiva y le da al cliente un espacio propio para ver su diagnóstico, objetivos y tareas.

Dos roles:
* client — completa onboarding (quiz + formulario), ve su reporte, objetivos y tareas
* admin — ve todos los clientes, genera reportes con Claude API, publica contenido, carga objetivos y tareas

Stack
Capa Tecnología
Frontend Next.js 14, React 18, TypeScript, Tailwind CSS
Backend Node.js, Express 4.18, TypeScript
Base de datos + Auth Supabase (PostgreSQL + Supabase Auth)
IA Anthropic Claude API (latest)
Deploy Frontend Vercel
Deploy Backend Railway

Cómo correr el proyecto
# Desde la raíz — corre frontend (3000) y backend (3001) en paralelo
npm run dev

# Solo frontend
cd frontend && npm run dev

# Solo backend
cd backend && npm run dev

Variables de entorno requeridas:
Backend (backend/.env):
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_KEY=      # service_role key — bypasses RLS
ANTHROPIC_API_KEY=

Frontend (frontend/.env.local):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001

Estructura del proyecto
labicicletafinanciera/
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── auth/               # login, register, callback, onboarding redirect
│   │   ├── admin/              # panel admin (en desarrollo)
│   │   ├── dashboard/          # dashboard cliente (en desarrollo)
│   │   └── onboarding/         # quiz + formulario cliente
│   ├── components/auth/        # AuthCard, AuthLayout, OtpInput
│   └── lib/
│       ├── auth/actions.ts     # OTP, password auth, signOut, getUserProfile
│       ├── onboarding/         # acciones del onboarding (a implementar)
│       └── supabase/           # client.ts, server.ts, middleware.ts
└── backend/
    └── src/
        ├── index.ts            # Express server (solo health check por ahora)
        └── lib/supabase.ts     # cliente admin con service_role key

Auth — Lo que ya funciona
* Login y registro con OTP por email (flujo de 6 dígitos)
* Login y registro con email + password
* Redirección post-login según rol: admin → /admin, client → /dashboard
* Middleware de Supabase para refresh de sesión en SSR
* Tabla profiles en Supabase con campo role ('admin' | 'client')

Regla: El frontend usa @supabase/ssr para manejar cookies. El backend usa service_role key para bypassear RLS cuando sea necesario.

Base de datos — Schema completo

Auth y usuarios
profiles (
   id uuid references auth.users,
   email text,
   full_name text,
   role text CHECK (role IN ('admin', 'client')),
   created_at timestamptz
)

Sistema de engagements (sesiones coach-cliente)
engagements (
   id uuid,
   user_id uuid references profiles,
   title text,
   engagement_number int,
   status text CHECK (status IN ('pending', 'active', 'completed')),
   engagement_date date
)

Sistema de quizzes (contenido dinámico — vive en DB, no en código)
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
   explanation text,
   -- se muestra después de responder, debe enseñar
   topic text          -- emergency_fund | bad_debt | compound_interest | budgeting | etc.
)

quiz_question_map (
   quiz_id uuid references quizzes,
   question_id uuid references quiz_questions,
   position int        -- orden dentro del quiz
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

Sistema de formularios (contenido dinámico — vive en DB, no en código)
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
   value jsonb         -- cualquier tipo: string, number, array
)

Reportes, objetivos y tareas
diagnosticos (
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

UUIDs fijos del contenido inicial
Onboarding quiz:    'a1b2c3d4-0000-0000-0000-000000000001'
Quiz questions:     '...000010' (fondo emergencia)
                    '...000011' (deuda mala)
                    '...000012' (interés compuesto)
                    '...000013' (presupuesto)
Onboarding form:    'b2c3d4e5-0000-0000-0000-000000000001'
Form sections:      '...000010' (datos personales)
                    '...000020' (situación financiera)
                    '...000030' (mentalidad y objetivos)

Convenciones de código
* TypeScript estricto — no usar any salvo que sea inevitable y esté comentado
* Server Components por defecto en Next.js — usar 'use client' solo cuando sea necesario (interactividad, hooks)
* Acciones del servidor en lib/[feature]/actions.ts
* Nombres en inglés para todo el código (variables, funciones, tipos, columnas de DB)
* Texto UI en español — todo lo que ve el usuario va en español argentino con "vos"
* Tailwind para estilos — no CSS custom salvo casos excepcionales
* Zod para validación de formularios en el frontend
* React Hook Form para manejo de forms

Paleta de colores Tailwind (custom theme)
primary-bg:      #0f0e0c
primary-surface: #1a1916
primary-border:  #2e2c28
primary-accent:  #c9a84c
primary-text:    #f0ece4

Backend — Reglas
* El servidor Express corre en puerto 3001
* Usar supabase (service_role) del cliente admin para operaciones que requieren bypassear RLS
* Todos los endpoints deben validar que el request tenga un JWT válido de Supabase antes de procesar
* La generación de reportes con Claude API vive en el backend — nunca llamar a Anthropic desde el frontend
* Estructura de rutas a implementar:
   * GET /health ✅
   * POST /api/reports/generate — genera reporte con Claude
   * GET /api/clients — lista de clientes (admin only)
   * GET /api/clients/:id — detalle de cliente (admin only)

Estado actual del proyecto

Completo ✅
* Sistema de auth (OTP + password, dos roles, redirección post-login)
* Middleware SSR de Supabase
* Componentes base (AuthCard, OtpInput, AuthLayout)
* Configuración de Tailwind con tema personalizado

En desarrollo 🔧
* frontend/app/onboarding/ — quiz + formulario de onboarding del cliente
* frontend/app/dashboard/ — dashboard del cliente (reporte, objetivos, tareas)
* frontend/app/admin/ — panel admin (lista clientes, generación de reportes)
* backend/src/ — todos los endpoints de la API

Pendiente 📋
* Integración con Claude API para generación de reportes
* Sistema de objetivos y tareas (CRUD)
* Migraciones de DB documentadas

Contexto del negocio (importante para tomar decisiones)
* Audiencia: clientes argentinos, contexto de inflación alta, instrumentos locales (FCI, CEDEARs, plazo fijo, cripto, dólar MEP)
* Voz del coach: directa, cercana, sin tecnicismos, usa "vos"
* El quiz de nivel (onboarding) determina el tono del reporte generado por Claude — beginner/intermediate/advanced
* Todo el contenido de quizzes y forms vive en Supabase, no en código — el sistema es 100% dinámico
* V0 scope: NO incluye notificaciones, seguimiento de progreso en el tiempo, múltiples sesiones con historial, ni cobro integrado

Reglas que no se negocian
1. Nunca hardcodear contenido de quizzes o forms en el código — siempre insertar en DB via SQL
2. Nunca llamar a Anthropic API desde el frontend
3. Siempre validar el rol del usuario antes de mostrar contenido de admin
4. El service_role key nunca va al frontend — solo backend
5. Al generar SQL para nuevos quizzes/forms, usar uuid_generate_v4() para IDs nuevos
