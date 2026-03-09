# La Bicicleta Financiera

Aplicación web de acompañamiento de finanzas personales con análisis inteligente y reportes generados por IA.

## Estructura del Proyecto

Este es un monorepo que contiene dos aplicaciones principales:

```
labicilcetafinanciera/
├── frontend/          # Aplicación Next.js 14 (TypeScript + Tailwind)
├── backend/           # Servidor Express con Node.js (TypeScript)
├── .gitignore
└── README.md
```

### Frontend (`/frontend`)

**Stack:**
- Next.js 14
- TypeScript
- Tailwind CSS
- App Router
- React 18

**Scripts disponibles:**
- `npm run dev` - Inicia el servidor de desarrollo (puerto 3000)
- `npm run build` - Compila la aplicación para producción
- `npm run start` - Inicia el servidor en modo producción
- `npm run lint` - Ejecuta el linter

**Configuración:**
- Copiar `.env.local.example` a `.env.local` y completar las variables

### Backend (`/backend`)

**Stack:**
- Node.js
- Express
- TypeScript
- Supabase (base de datos y autenticación)
- Anthropic API (generación de reportes)

**Scripts disponibles:**
- `npm run dev` - Inicia el servidor de desarrollo (puerto 3001)
- `npm run build` - Compila TypeScript a JavaScript
- `npm run start` - Inicia el servidor en modo producción
- `npm run lint` - Ejecuta el linter

**Endpoints:**
- `GET /health` - Health check del servidor

**Configuración:**
- Copiar `.env.example` a `.env` y completar las variables

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Credenciales de Supabase
- API Key de Anthropic

## Instalación

1. Instalar dependencias del frontend:
```bash
cd frontend
npm install
```

2. Instalar dependencias del backend:
```bash
cd ../backend
npm install
```

## Desarrollo

### Terminal 1 - Frontend
```bash
cd frontend
npm run dev
# Disponible en http://localhost:3000
```

### Terminal 2 - Backend
```bash
cd backend
npm run dev
# Disponible en http://localhost:3001
```

## Variables de Entorno

### Frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`.env`)
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Construcción para Producción

### Frontend
```bash
cd frontend
npm run build
npm run start
```

### Backend
```bash
cd backend
npm run build
npm run start
```

## Estructura de Carpetas

### Frontend
```
frontend/
├── app/
│   ├── layout.tsx       # Layout raíz
│   ├── page.tsx         # Página de inicio
│   └── globals.css      # Estilos globales
├── public/              # Archivos estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── .gitignore
```

### Backend
```
backend/
├── src/
│   └── index.ts         # Punto de entrada
├── dist/                # Compilado (generado)
├── package.json
├── tsconfig.json
└── .gitignore
```

## Próximos Pasos

- [ ] Integración con Supabase (autenticación y base de datos)
- [ ] Componentes UI base (formularios, tablas, gráficos)
- [ ] Endpoints de API para finanzas
- [ ] Sistema de reportes con Claude API
- [ ] Módulos de análisis financiero
- [ ] Pruebas unitarias e integración
- [ ] Despliegue

## Contribuir

Por favor asegúrate de:
1. Seguir los estilos de código existentes
2. Escribir pruebas para nuevas funcionalidades
3. Actualizar la documentación según sea necesario

## Licencia

ISC
