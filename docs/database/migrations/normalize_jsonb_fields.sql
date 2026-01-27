-- ============================================================================
-- NORMALIZACIÓN: Estandarizar estructura JSONB en dm_actores
-- ============================================================================
--
-- Este script normaliza los datos JSONB existentes a la estructura estándar
-- definida en los schemas Zod, manejando campos con nombres históricos distintos.
--
-- Fecha: 2026-01-26
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NORMALIZAR perfil_identidad
-- ----------------------------------------------------------------------------

-- Mover campo 'rh' (histórico) a perfil_salud.tipo_sangre si no existe
UPDATE dm_actores
SET perfil_salud = jsonb_set(
  COALESCE(perfil_salud, '{}'::jsonb),
  '{tipo_sangre}',
  COALESCE(perfil_identidad->'rh', perfil_salud->'tipo_sangre', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND perfil_identidad ? 'rh'
  AND (perfil_salud->>'tipo_sangre') IS NULL;

-- Limpiar campo 'rh' de perfil_identidad después de mover
UPDATE dm_actores
SET perfil_identidad = perfil_identidad - 'rh'
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND perfil_identidad ? 'rh';

-- Asegurar que nacionalidad tenga el código ISO (2 caracteres)
-- Mover "Colombiana" -> "CO"
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  perfil_identidad,
  '{nacionalidad}',
  CASE
    WHEN perfil_identidad->>'nacionalidad' = 'Colombiana' THEN '"CO"'::jsonb
    WHEN perfil_identidad->>'nacionalidad' = 'Colombia' THEN '"CO"'::jsonb
    ELSE perfil_identidad->'nacionalidad'
  END
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND perfil_identidad->>'nacionalidad' IN ('Colombiana', 'Colombia');

-- ----------------------------------------------------------------------------
-- 2. NORMALIZAR perfil_profesional_corporativo
-- ----------------------------------------------------------------------------

-- Aplanar estructura anidada de 'educacion'
UPDATE dm_actores
SET perfil_profesional_corporativo = jsonb_set(
  perfil_profesional_corporativo,
  '{nivel_educacion}',
  COALESCE(
    perfil_profesional_corporativo->'educacion'->>'nivel',
    perfil_profesional_corporativo->>'nivel_educacion',
    'null'::jsonb
  )
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND perfil_profesional_corporativo ? 'educacion'
  AND (perfil_profesional_corporativo->>'nivel_educacion') IS NULL;

-- Eliminar objeto anidado 'educacion' después de aplanar
UPDATE dm_actores
SET perfil_profesional_corporativo = perfil_profesional_corporativo - 'educacion'
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND perfil_profesional_corporativo ? 'educacion';

-- Normalizar nivel_educacion a valores estándar
UPDATE dm_actores
SET perfil_profesional_corporativo = jsonb_set(
  perfil_profesional_corporativo,
  '{nivel_educacion}',
  CASE
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion') LIKE '%profesional%' THEN '"profesional"'::jsonb
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%técnico%' OR LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%tecnico%' THEN '"técnica"'::jsonb
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%bachiller%' THEN '"bachillerato"'::jsonb
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%primaria%' THEN '"primaria"'::jsonb
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%maestr%' OR LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%master%' THEN '"maestría"'::jsonb
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%doctor%' THEN '"doctorado"'::jsonb
    WHEN LOWER(perfil_profesional_corporativo->>'nivel_educacion) LIKE '%especial%' THEN '"especialización"'::jsonb
    ELSE perfil_profesional_corporativo->'nivel_educacion'
  END
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND (perfil_profesional_corporativo->>'nivel_educacion') IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. NORMALIZAR perfil_redes
-- ----------------------------------------------------------------------------

-- Asegurar que todos los campos necesarios existan
UPDATE dm_actores
SET perfil_redes = jsonb_set(
  COALESCE(perfil_redes, '{}'::jsonb),
  '{linkedin}',
  COALESCE(perfil_redes->'linkedin', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_redes ? 'linkedin');

UPDATE dm_actores
SET perfil_redes = jsonb_set(
  perfil_redes,
  '{facebook}',
  COALESCE(perfil_redes->'facebook', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_redes ? 'facebook');

UPDATE dm_actores
SET perfil_redes = jsonb_set(
  perfil_redes,
  '{instagram}',
  COALESCE(perfil_redes->'instagram', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_redes ? 'instagram');

UPDATE dm_actores
SET perfil_redes = jsonb_set(
  perfil_redes,
  '{twitter}',
  COALESCE(perfil_redes->'twitter', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_redes ? 'twitter');

UPDATE dm_actores
SET perfil_redes = jsonb_set(
  perfil_redes,
  '{whatsapp}',
  COALESCE(perfil_redes->'whatsapp', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_redes ? 'whatsapp');

UPDATE dm_actores
SET perfil_redes = jsonb_set(
  perfil_redes,
  '{foto_url}',
  COALESCE(perfil_redes->'foto_url', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_redes ? 'foto_url');

-- ----------------------------------------------------------------------------
-- 4. NORMALIZAR perfil_salud
-- ----------------------------------------------------------------------------

-- Asegurar estado_vital por defecto
UPDATE dm_actores
SET perfil_salud = jsonb_set(
  COALESCE(perfil_salud, '{}'::jsonb),
  '{estado_vital}',
  COALESCE(perfil_salud->>'estado_vital', '"vivo"'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND (perfil_salud->>'estado_vital') IS NULL;

-- ----------------------------------------------------------------------------
-- 5. NORMALIZAR perfil_contacto
-- ----------------------------------------------------------------------------

-- Asegurar que todos los campos necesarios existan
UPDATE dm_actores
SET perfil_contacto = jsonb_set(
  COALESCE(perfil_contacto, '{}'::jsonb),
  '{contacto_emergencia_id}',
  COALESCE(perfil_contacto->'contacto_emergencia_id', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_contacto ? 'contacto_emergencia_id');

UPDATE dm_actores
SET perfil_contacto = jsonb_set(
  perfil_contacto,
  '{relacion_emergencia}',
  COALESCE(perfil_contacto->'relacion_emergencia', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_contacto ? 'relacion_emergencia');

-- ----------------------------------------------------------------------------
-- 6. NORMALIZAR perfil_preferencias
-- ----------------------------------------------------------------------------

-- Asegurar que todos los campos necesarios existan
UPDATE dm_actores
SET perfil_preferencias = jsonb_set(
  COALESCE(perfil_preferencias, '{}'::jsonb),
  '{fecha_socio}',
  COALESCE(perfil_preferencias->'fecha_socio', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_preferencias ? 'fecha_socio');

UPDATE dm_actores
SET perfil_preferencias = jsonb_set(
  perfil_preferencias,
  '{fecha_aniversario}',
  COALESCE(perfil_preferencias->'fecha_aniversario', 'null'::jsonb)
)
WHERE tipo_actor = 'persona'
  AND eliminado_en IS NULL
  AND NOT (perfil_preferencias ? 'fecha_aniversario');


-- ----------------------------------------------------------------------------
-- VERIFICACIÓN FINAL
-- ----------------------------------------------------------------------------

SELECT
  'perfil_identidad' as perfil,
  COUNT(*) as total,
  COUNT(CASE WHEN perfil_identidad ? 'nacionalidad' THEN 1 END) as con_nacionalidad,
  COUNT(CASE WHEN perfil_identidad ? 'fecha_expedicion' THEN 1 END) as con_fecha_exp,
  COUNT(CASE WHEN perfil_identidad ? 'lugar_expedicion' THEN 1 END) as con_lugar_exp,
  COUNT(CASE WHEN perfil_identidad ? 'lugar_expedicion_id' THEN 1 END) as con_lugar_exp_id
FROM dm_actores WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_profesional' as perfil,
  COUNT(*) as total,
  COUNT(CASE WHEN perfil_profesional_corporativo ? 'ocupacion' THEN 1 END) as con_ocupacion,
  COUNT(CASE WHEN perfil_profesional_corporativo ? 'profesion' THEN 1 END) as con_profesion,
  COUNT(CASE WHEN perfil_profesional_corporativo ? 'nivel_educacion' THEN 1 END) as con_nivel_edu,
  0 as con_lugar_exp_id
FROM dm_actores WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_salud' as perfil,
  COUNT(*) as total,
  COUNT(CASE WHEN perfil_salud ? 'tipo_sangre' THEN 1 END) as con_tipo_sangre,
  COUNT(CASE WHEN perfil_salud ? 'eps' THEN 1 END) as con_eps,
  COUNT(CASE WHEN perfil_salud ? 'estado_vital' THEN 1 END) as con_estado_vital,
  0 as con_lugar_exp_id
FROM dm_actores WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_redes' as perfil,
  COUNT(*) as total,
  COUNT(CASE WHEN perfil_redes ? 'linkedin' THEN 1 END) as con_linkedin,
  COUNT(CASE WHEN perfil_redes ? 'whatsapp' THEN 1 END) as con_whatsapp,
  COUNT(CASE WHEN perfil_redes ? 'instagram' THEN 1 END) as con_instagram,
  0 as con_lugar_exp_id
FROM dm_actores WHERE tipo_actor = 'persona' AND eliminado_en IS NULL;
