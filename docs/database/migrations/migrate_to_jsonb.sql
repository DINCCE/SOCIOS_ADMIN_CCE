-- ============================================================================
-- MIGRACIÓN: Mover datos de columnas directas a JSONB en dm_actores
-- ============================================================================
--
-- Este script migra los datos existentes de las columnas directas (antiguo modelo)
-- a las estructuras JSONB (nuevo modelo), preservando todos los datos existentes.
--
-- Fecha: 2026-01-26
-- Autor: Migración de sistema a JSONB
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MIGRAR perfil_identidad
-- ----------------------------------------------------------------------------

-- Migrar nacionalidad
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{nacionalidad}',
  COALESCE(to_jsonb(nacionalidad), 'null'::jsonb)
)
WHERE nacionalidad IS NOT NULL
  AND (perfil_identidad->>'nacionalidad') IS NULL;

-- Migrar fecha_expedicion (si existe como columna directa)
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{fecha_expedicion}',
  COALESCE(to_jsonb(fecha_expedicion)::text, 'null'::jsonb)
)
WHERE fecha_expedicion IS NOT NULL
  AND (perfil_identidad->>'fecha_expedicion') IS NULL;

-- Migrar lugar_expedicion (legacy text field)
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{lugar_expedicion}',
  COALESCE(to_jsonb(lugar_expedicion), 'null'::jsonb)
)
WHERE lugar_expedicion IS NOT NULL
  AND (perfil_identidad->>'lugar_expedicion') IS NULL;

-- Migrar lugar_expedicion_id
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{lugar_expedicion_id}',
  COALESCE(to_jsonb(lugar_expedicion_id), 'null'::jsonb)
)
WHERE lugar_expedicion_id IS NOT NULL
  AND (perfil_identidad->>'lugar_expedicion_id') IS NULL;

-- Migrar lugar_nacimiento (legacy text field)
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{lugar_nacimiento}',
  COALESCE(to_jsonb(lugar_nacimiento), 'null'::jsonb)
)
WHERE lugar_nacimiento IS NOT NULL
  AND (perfil_identidad->>'lugar_nacimiento') IS NULL;

-- Migrar lugar_nacimiento_id
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{lugar_nacimiento_id}',
  COALESCE(to_jsonb(lugar_nacimiento_id), 'null'::jsonb)
)
WHERE lugar_nacimiento_id IS NOT NULL
  AND (perfil_identidad->>'lugar_nacimiento_id') IS NULL;


-- ----------------------------------------------------------------------------
-- 2. MIGRAR perfil_profesional_corporativo
-- ----------------------------------------------------------------------------

-- Migrar ocupacion
UPDATE dm_actores
SET perfil_profesional_corporativo = jsonb_set(
  COALESCE(perfil_profesional_corporativo, '{}'::jsonb),
  '{ocupacion}',
  COALESCE(to_jsonb(ocupacion), 'null'::jsonb)
)
WHERE ocupacion IS NOT NULL
  AND (perfil_profesional_corporativo->>'ocupacion') IS NULL;

-- Migrar profesion
UPDATE dm_actores
SET perfil_profesional_corporativo = jsonb_set(
  COALESCE(perfil_profesional_corporativo, '{}'::jsonb),
  '{profesion}',
  COALESCE(to_jsonb(profesion), 'null'::jsonb)
)
WHERE profesion IS NOT NULL
  AND (perfil_profesional_corporativo->>'profesion') IS NULL;

-- Migrar nivel_educacion
UPDATE dm_actores
SET perfil_profesional_corporativo = jsonb_set(
  COALESCE(perfil_profesional_corporativo, '{}'::jsonb),
  '{nivel_educacion}',
  COALESCE(to_jsonb(nivel_educacion), 'null'::jsonb)
)
WHERE nivel_educacion IS NOT NULL
  AND (perfil_profesional_corporativo->>'nivel_educacion') IS NULL;


-- ----------------------------------------------------------------------------
-- 3. MIGRAR perfil_salud
-- ----------------------------------------------------------------------------

-- Migrar tipo_sangre
UPDATE dm_actores
SET perfil_salud = jsonb_set(
  COALESCE(perfil_salud, '{}'::jsonb),
  '{tipo_sangre}',
  COALESCE(to_jsonb(tipo_sangre), 'null'::jsonb)
)
WHERE tipo_sangre IS NOT NULL
  AND (perfil_salud->>'tipo_sangre') IS NULL;

-- Migrar eps
UPDATE dm_actores
SET perfil_salud = jsonb_set(
  COALESCE(perfil_salud, '{}'::jsonb),
  '{eps}',
  COALESCE(to_jsonb(eps), 'null'::jsonb)
)
WHERE eps IS NOT NULL
  AND (perfil_salud->>'eps') IS NULL;

-- Asegurar estado_vital por defecto
UPDATE dm_actores
SET perfil_salud = jsonb_set(
  COALESCE(perfil_salud, '{}'::jsonb),
  '{estado_vital}',
  COALESCE(perfil_salud->>'estado_vital', '"vivo"'::jsonb)
)
WHERE (perfil_salud->>'estado_vital') IS NULL;


-- ----------------------------------------------------------------------------
-- 4. MIGRAR perfil_redes
-- ----------------------------------------------------------------------------

-- Migrar linkedin_url -> linkedin
UPDATE dm_actores
SET perfil_redes = jsonb_set(
  COALESCE(perfil_redes, '{}'::jsonb),
  '{linkedin}',
  COALESCE(to_jsonb(linkedin_url), 'null'::jsonb)
)
WHERE linkedin_url IS NOT NULL
  AND (perfil_redes->>'linkedin') IS NULL;

-- Migrar facebook_url -> facebook
UPDATE dm_actores
SET perfil_redes = jsonb_set(
  COALESCE(perfil_redes, '{}'::jsonb),
  '{facebook}',
  COALESCE(to_jsonb(facebook_url), 'null'::jsonb)
)
WHERE facebook_url IS NOT NULL
  AND (perfil_redes->>'facebook') IS NULL;

-- Migrar instagram_handle -> instagram
UPDATE dm_actores
SET perfil_redes = jsonb_set(
  COALESCE(perfil_redes, '{}'::jsonb),
  '{instagram}',
  COALESCE(to_jsonb(instagram_handle), 'null'::jsonb)
)
WHERE instagram_handle IS NOT NULL
  AND (perfil_redes->>'instagram') IS NULL;

-- Migrar twitter_handle -> twitter
UPDATE dm_actores
SET perfil_redes = jsonb_set(
  COALESCE(perfil_redes, '{}'::jsonb),
  '{twitter}',
  COALESCE(to_jsonb(twitter_handle), 'null'::jsonb)
)
WHERE twitter_handle IS NOT NULL
  AND (perfil_redes->>'twitter') IS NULL;

-- Migrar whatsapp si existe como columna directa
UPDATE dm_actores
SET perfil_redes = jsonb_set(
  COALESCE(perfil_redes, '{}'::jsonb),
  '{whatsapp}',
  COALESCE(to_jsonb(whatsapp), 'null'::jsonb)
)
WHERE whatsapp IS NOT NULL
  AND (perfil_redes->>'whatsapp') IS NULL;


-- ----------------------------------------------------------------------------
-- 5. MIGRAR perfil_contacto
-- ----------------------------------------------------------------------------

-- Migrar contacto_emergencia_id
UPDATE dm_actores
SET perfil_contacto = jsonb_set(
  COALESCE(perfil_contacto, '{}'::jsonb),
  '{contacto_emergencia_id}',
  COALESCE(to_jsonb(contacto_emergencia_id), 'null'::jsonb)
)
WHERE contacto_emergencia_id IS NOT NULL
  AND (perfil_contacto->>'contacto_emergencia_id') IS NULL;

-- Migrar relacion_emergencia
UPDATE dm_actores
SET perfil_contacto = jsonb_set(
  COALESCE(perfil_contacto, '{}'::jsonb),
  '{relacion_emergencia}',
  COALESCE(to_jsonb(relacion_emergencia), 'null'::jsonb)
)
WHERE relacion_emergencia IS NOT NULL
  AND (perfil_contacto->>'relacion_emergencia') IS NULL;


-- ----------------------------------------------------------------------------
-- 6. MIGRAR perfil_preferencias
-- ----------------------------------------------------------------------------

-- Migrar fecha_socio
UPDATE dm_actores
SET perfil_preferencias = jsonb_set(
  COALESCE(perfil_preferencias, '{}'::jsonb),
  '{fecha_socio}',
  COALESCE(to_jsonb(fecha_socio)::text, 'null'::jsonb)
)
WHERE fecha_socio IS NOT NULL
  AND (perfil_preferencias->>'fecha_socio') IS NULL;

-- Migrar fecha_aniversario
UPDATE dm_actores
SET perfil_preferencias = jsonb_set(
  COALESCE(perfil_preferencias, '{}'::jsonb),
  '{fecha_aniversario}',
  COALESCE(to_jsonb(fecha_aniversario)::text, 'null'::jsonb)
)
WHERE fecha_aniversario IS NOT NULL
  AND (perfil_preferencias->>'fecha_aniversario') IS NULL;


-- ----------------------------------------------------------------------------
-- VERIFICACIÓN DE MIGRACIÓN
-- ----------------------------------------------------------------------------

-- Verificar cantidad de registros migrados por perfil
SELECT
  'perfil_identidad' as perfil,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN perfil_identidad IS NOT NULL THEN 1 END) as con_datos
FROM dm_actores
WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_profesional_corporativo' as perfil,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN perfil_profesional_corporativo IS NOT NULL THEN 1 END) as con_datos
FROM dm_actores
WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_salud' as perfil,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN perfil_salud IS NOT NULL THEN 1 END) as con_datos
FROM dm_actores
WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_redes' as perfil,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN perfil_redes IS NOT NULL THEN 1 END) as con_datos
FROM dm_actores
WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_contacto' as perfil,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN perfil_contacto IS NOT NULL THEN 1 END) as con_datos
FROM dm_actores
WHERE tipo_actor = 'persona' AND eliminado_en IS NULL

UNION ALL

SELECT
  'perfil_preferencias' as perfil,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN perfil_preferencias IS NOT NULL THEN 1 END) as con_datos
FROM dm_actores
WHERE tipo_actor = 'persona' AND eliminado_en IS NULL;


-- ----------------------------------------------------------------------------
-- NOTAS IMPORTANTES
-- ----------------------------------------------------------------------------
--
-- 1. Este script es IDEMPOTENTE: puede ejecutarse múltiples veces sin duplicar datos
-- 2. Preserva datos existentes en JSONB usando COALESCE y verificando NULL
-- 3. Solo migra datos de tipo_actor = 'persona' (no empresas)
-- 4. Después de la migración, las columnas directas pueden eliminarse
--
-- Columnas directas que pueden eliminarse después de verificar migración:
--   - nacionalidad
--   - fecha_expedicion (si existe)
--   - lugar_expedicion (si existe)
--   - lugar_expedicion_id (si existe)
--   - lugar_nacimiento (si existe)
--   - lugar_nacimiento_id (si existe)
--   - ocupacion
--   - profesion
--   - nivel_educacion
--   - tipo_sangre
--   - eps
--   - linkedin_url
--   - facebook_url
--   - instagram_handle
--   - twitter_handle
--   - whatsapp (si existe)
--   - contacto_emergencia_id (si existe)
--   - relacion_emergencia (si existe)
--   - fecha_socio (si existe)
--   - fecha_aniversario (si existe)
--
-- ============================================================================
