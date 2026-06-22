# AGENTS.md — REQUISICION

## Stack
React 19 / TypeScript 6.0 / Vite 8 / Supabase (auth + pg + realtime) / framer-motion / xlsx

## Commands
- `npm run dev` — vite dev server
- `npm run build` — `tsc -b && vite build` (typecheck then build; no standalone typecheck script)
- `npm run lint` — `eslint .`
- `npm run preview` — `vite preview`
- No test framework or test scripts exist

## Supabase Setup
- Copy `.env.example` → `.env.local`, fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Apply migration `supabase/migrations/001_initial.sql` via Supabase SQL Editor
- Create two users in Authentication dashboard:
  - `gerencia@sistema.interno` / `Fombisol2026`
  - `tecnologia@sistema.interno` / `123456`
- After creation, insert rows into `perfiles` table mapping each user's UUID to their role

## Architecture
- **Entry**: `src/main.tsx` → `<AuthProvider>` wraps `<App />`
- **Auth**: `src/contexts/AuthContext.tsx` — fixed role emails (`ROLE_EMAILS`), login via Supabase auth with password, role fetched from `perfiles` table
- **Data**: `src/hooks/useRequisicion.ts` — loads from Supabase `solicitudes` table, falls back to localStorage, seeds initial data on first run; subscribes to realtime changes on `solicitudes`
- **Types**: `src/types/index.ts` (app types) + `src/types/database.ts` (Supabase row types)
- **Initial data**: `src/data/initialData.ts` — hardcoded requisitions across departments + technical items
- **Roles**: `gerencia` can approve/deny/edit; `tecnologia` is read-only (enforced in `App.tsx:70`)
- **Export**: `src/utils/excelExport.ts` writes `.xlsx` with 3 sheets (full review, approved, summary)

## TypeScript Quirks
- `verbatimModuleSyntax: true` → must use `import type` for type-only imports
- `erasableSyntaxOnly: true` → no enums, no namespaces, no parameter properties
- `noUnusedLocals` / `noUnusedParameters` enabled → strict lint on unused vars
- `@types/node` available for vite.config.ts; `vite/client` types for src

## Style System
- Per-component CSS files in `src/styles/` (imported directly into components)
- CSS custom properties in `variables.css` (corporate palette, status colors, spacing, shadows)
- Font: Inter via Google Fonts import in `global.css`

## Conventions
- Spanish: UI text, comments, error messages, commit messages
- IDs: `usr-{N}-{M}` (user requests), `ti-{N}` (technical items), `custom-{timestamp}-{random}` (user-added items)
- localStorage key: `viabilidad_tecnologica_v2`
