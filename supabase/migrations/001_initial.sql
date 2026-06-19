-- ============================================================
-- Migración 001: Esquema inicial para Viabilidad Tecnológica
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Tabla de perfiles (roles de usuario) ─────────────────
CREATE TABLE IF NOT EXISTS perfiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  rol        TEXT NOT NULL CHECK (rol IN ('gerencia', 'tecnologia')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Tabla principal de solicitudes ───────────────────────
CREATE TABLE IF NOT EXISTS solicitudes (
  id                    TEXT PRIMARY KEY,
  area                  TEXT NOT NULL,
  solicitante           TEXT NOT NULL,
  categoria             TEXT NOT NULL DEFAULT '',
  elemento              TEXT NOT NULL,
  cantidad_solicitada   INTEGER NOT NULL DEFAULT 0,
  justificacion         TEXT NOT NULL DEFAULT '',
  prioridad             TEXT NOT NULL DEFAULT 'Media'
                          CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
  estado                TEXT NOT NULL DEFAULT 'Pendiente'
                          CHECK (estado IN ('Pendiente', 'Aprobado', 'Negado', 'Aprobado parcial')),
  cantidad_aprobada     INTEGER NOT NULL DEFAULT 0,
  comentario_gerencia   TEXT NOT NULL DEFAULT '',
  urgente               BOOLEAN NOT NULL DEFAULT FALSE,
  ultimo_modificado_por TEXT,
  ultimo_modificado_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_solicitudes_area   ON solicitudes (area);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes (estado);

-- ── 4. Row Level Security ────────────────────────────────────
ALTER TABLE perfiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfiles_own_read"
  ON perfiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "solicitudes_authenticated_read"
  ON solicitudes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "solicitudes_gerencia_insert"
  ON solicitudes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'gerencia')
  );

CREATE POLICY "solicitudes_gerencia_update"
  ON solicitudes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'gerencia'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'gerencia'));

CREATE POLICY "solicitudes_gerencia_delete"
  ON solicitudes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'gerencia'));

-- ── 5. Realtime ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes;

-- ============================================================
-- PASO 2: CREAR LOS DOS USUARIOS (ejecutar DESPUÉS del paso 1)
-- ============================================================
--
-- En Supabase Dashboard ve a:
--   Authentication > Users > "Add user" > "Create new user"
--
--   Usuario 1 - Gerencia:
--     Email:    gerencia@sistema.interno
--     Password: Fombisol2026
--     ✅ Auto Confirm User
--
--   Usuario 2 - Tecnología:
--     Email:    tecnologia@sistema.interno
--     Password: 123456
--     ✅ Auto Confirm User
--
-- Luego copia el UUID de cada usuario y ejecuta:
-- ============================================================

-- ── PASO 3: Asignar roles (reemplaza los UUIDs reales) ──────
--
-- INSERT INTO perfiles (id, email, rol) VALUES
--   ('UUID-DE-GERENCIA',   'gerencia@sistema.interno',   'gerencia'),
--   ('UUID-DE-TECNOLOGIA', 'tecnologia@sistema.interno', 'tecnologia');
--
-- ============================================================
