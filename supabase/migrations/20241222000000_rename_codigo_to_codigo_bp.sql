-- =====================================================
-- Migration: Rename codigo to codigo_bp + Auto-generation
-- Date: 2024-12-22
-- Description:
--   1. Renombra campo 'codigo' a 'codigo_bp' en business_partners
--   2. Implementa trigger para autogeneración de codigo_bp
--   3. Actualiza registros existentes al formato BP-0000001
--   4. Recrea vistas con el nuevo nombre de campo
-- =====================================================

-- =====================================================
-- PASO 1: Renombrar columna codigo → codigo_bp
-- =====================================================

ALTER TABLE business_partners
RENAME COLUMN codigo TO codigo_bp;

COMMENT ON COLUMN business_partners.codigo_bp IS 'Código único autogenerado formato BP-0000001 (7 dígitos)';

-- =====================================================
-- PASO 2: Función para autogenerar codigo_bp
-- =====================================================

CREATE OR REPLACE FUNCTION generar_codigo_bp()
RETURNS TRIGGER AS $$
DECLARE
  siguiente_numero INTEGER;
BEGIN
  -- Solo generar si codigo_bp es NULL o vacío (permite override manual)
  IF NEW.codigo_bp IS NULL OR NEW.codigo_bp = '' THEN
    -- Obtener el siguiente número secuencial
    -- Busca el máximo número actual en códigos con formato BP-XXXXXXX
    SELECT COALESCE(
      MAX(SUBSTRING(codigo_bp FROM 4)::INTEGER),
      0
    ) + 1
    INTO siguiente_numero
    FROM business_partners
    WHERE codigo_bp ~ '^BP-[0-9]{7}$'  -- Solo códigos válidos BP-XXXXXXX
      AND eliminado_en IS NULL;         -- Ignorar registros eliminados

    -- Generar código con formato: BP-0000001 (7 dígitos con padding de ceros)
    NEW.codigo_bp := 'BP-' || LPAD(siguiente_numero::TEXT, 7, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_codigo_bp() IS
'Genera automáticamente codigo_bp en formato BP-0000001 (7 dígitos).
Permite override manual si se proporciona un valor.
Ignora registros soft-deleted para evitar gaps.';

-- =====================================================
-- PASO 3: Crear trigger BEFORE INSERT
-- =====================================================

DROP TRIGGER IF EXISTS trigger_generar_codigo_bp ON business_partners;

CREATE TRIGGER trigger_generar_codigo_bp
  BEFORE INSERT ON business_partners
  FOR EACH ROW
  EXECUTE FUNCTION generar_codigo_bp();

COMMENT ON TRIGGER trigger_generar_codigo_bp ON business_partners IS
'Trigger que ejecuta generar_codigo_bp() antes de insertar un nuevo business_partner';

-- =====================================================
-- PASO 4: Actualizar registros existentes al nuevo formato
-- =====================================================

-- Actualizar registros existentes para que tengan formato BP-0000001
-- Preservando el orden de creación (por creado_en)
WITH registros_numerados AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY creado_en) as numero_secuencial
  FROM business_partners
  WHERE eliminado_en IS NULL
)
UPDATE business_partners bp
SET codigo_bp = 'BP-' || LPAD(rn.numero_secuencial::TEXT, 7, '0')
FROM registros_numerados rn
WHERE bp.id = rn.id;

-- =====================================================
-- PASO 5: Recrear vistas con el nuevo nombre de campo
-- =====================================================

-- Vista: v_personas_completa
DROP VIEW IF EXISTS v_personas_completa CASCADE;

CREATE VIEW v_personas_completa AS
SELECT
  p.id,
  p.tipo_documento,
  p.numero_documento,
  p.fecha_expedicion,
  p.lugar_expedicion,
  p.primer_nombre,
  p.segundo_nombre,
  p.primer_apellido,
  p.segundo_apellido,
  (p.primer_nombre ||
    COALESCE(' ' || p.segundo_nombre, '') ||
    ' ' || p.primer_apellido ||
    COALESCE(' ' || p.segundo_apellido, '')
  ) AS nombre_completo,
  p.genero,
  p.fecha_nacimiento,
  p.lugar_nacimiento,
  p.nacionalidad,
  p.estado_civil,
  p.ocupacion,
  p.profesion,
  p.nivel_educacion,
  p.tipo_sangre,
  p.email_secundario,
  p.telefono_secundario,
  p.whatsapp,
  p.linkedin_url,
  p.facebook_url,
  p.instagram_handle,
  p.twitter_handle,
  p.foto_url,
  p.contacto_emergencia_id,
  p.relacion_emergencia,
  p.atributos AS atributos_persona,
  p.creado_en AS persona_creado_en,
  p.actualizado_en AS persona_actualizado_en,
  -- Campos de business_partners
  bp.codigo_bp,  -- ⬅️ CAMBIO: codigo → codigo_bp
  bp.tipo_actor,
  bp.organizacion_id,
  bp.estado,
  bp.email_principal,
  bp.telefono_principal,
  bp.creado_en AS bp_creado_en,
  bp.creado_por AS bp_creado_por,
  bp.actualizado_en AS bp_actualizado_en,
  bp.actualizado_por AS bp_actualizado_por,
  bp.eliminado_en AS bp_eliminado_en,
  bp.eliminado_por AS bp_eliminado_por,
  -- Campos de organización
  o.nombre AS organizacion_nombre,
  o.slug AS organizacion_slug,
  o.tipo AS organizacion_tipo,
  -- Contacto de emergencia
  (ce.primer_nombre ||
    COALESCE(' ' || ce.segundo_nombre, '') ||
    ' ' || ce.primer_apellido ||
    COALESCE(' ' || ce.segundo_apellido, '')
  ) AS contacto_emergencia_nombre
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas ce ON p.contacto_emergencia_id = ce.id;

COMMENT ON VIEW v_personas_completa IS
'Vista desnormalizada que combina datos de personas, business_partners y organizations';

-- Vista: v_empresas_completa
DROP VIEW IF EXISTS v_empresas_completa CASCADE;

CREATE VIEW v_empresas_completa AS
SELECT
  e.id,
  e.nit,
  e.digito_verificacion,
  (e.nit || '-' || e.digito_verificacion) AS nit_completo,
  e.razon_social,
  e.nombre_comercial,
  e.tipo_sociedad,
  e.fecha_constitucion,
  e.ciudad_constitucion,
  e.pais_constitucion,
  e.numero_registro,
  e.codigo_ciiu,
  e.sector_industria,
  e.actividad_economica,
  e.tamano_empresa,
  e.representante_legal_id,
  e.cargo_representante,
  e.telefono_secundario,
  e.whatsapp,
  e.website,
  e.linkedin_url,
  e.facebook_url,
  e.instagram_handle,
  e.twitter_handle,
  e.logo_url,
  e.ingresos_anuales,
  e.numero_empleados,
  e.atributos AS atributos_empresa,
  e.creado_en AS empresa_creado_en,
  e.actualizado_en AS empresa_actualizado_en,
  -- Campos de business_partners
  bp.codigo_bp,  -- ⬅️ CAMBIO: codigo → codigo_bp
  bp.tipo_actor,
  bp.organizacion_id,
  bp.estado,
  bp.email_principal,
  bp.telefono_principal,
  bp.creado_en AS bp_creado_en,
  bp.creado_por AS bp_creado_por,
  bp.actualizado_en AS bp_actualizado_en,
  bp.actualizado_por AS bp_actualizado_por,
  bp.eliminado_en AS bp_eliminado_en,
  bp.eliminado_por AS bp_eliminado_por,
  -- Campos de organización
  o.nombre AS organizacion_nombre,
  o.slug AS organizacion_slug,
  o.tipo AS organizacion_tipo,
  -- Representante legal
  (rl.primer_nombre ||
    COALESCE(' ' || rl.segundo_nombre, '') ||
    ' ' || rl.primer_apellido ||
    COALESCE(' ' || rl.segundo_apellido, '')
  ) AS representante_legal_nombre
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas rl ON e.representante_legal_id = rl.id;

COMMENT ON VIEW v_empresas_completa IS
'Vista desnormalizada que combina datos de empresas, business_partners y organizations';

-- Vista: v_actores_unificados (polimórfica)
DROP VIEW IF EXISTS v_actores_unificados CASCADE;

CREATE VIEW v_actores_unificados AS
-- Personas
SELECT
  bp.id,
  bp.codigo_bp,  -- ⬅️ CAMBIO: codigo → codigo_bp
  bp.organizacion_id,
  bp.tipo_actor,
  bp.estado,
  (p.primer_nombre ||
    COALESCE(' ' || p.segundo_nombre, '') ||
    ' ' || p.primer_apellido ||
    COALESCE(' ' || p.segundo_apellido, '')
  ) AS nombre,
  p.numero_documento AS identificacion,
  p.tipo_documento::TEXT AS tipo_identificacion,
  bp.email_principal,
  bp.telefono_principal,
  p.email_secundario,
  p.telefono_secundario,
  bp.creado_en,
  bp.actualizado_en,
  bp.eliminado_en
FROM business_partners bp
INNER JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'

UNION ALL

-- Empresas
SELECT
  bp.id,
  bp.codigo_bp,  -- ⬅️ CAMBIO: codigo → codigo_bp
  bp.organizacion_id,
  bp.tipo_actor,
  bp.estado,
  e.razon_social AS nombre,
  (e.nit || '-' || e.digito_verificacion) AS identificacion,
  'NIT' AS tipo_identificacion,
  bp.email_principal,
  bp.telefono_principal,
  NULL AS email_secundario,
  e.telefono_secundario,
  bp.creado_en,
  bp.actualizado_en,
  bp.eliminado_en
FROM business_partners bp
INNER JOIN empresas e ON bp.id = e.id
WHERE bp.tipo_actor = 'empresa';

COMMENT ON VIEW v_actores_unificados IS
'Vista polimórfica que unifica personas y empresas con campos comunes';

-- =====================================================
-- PASO 6: Verificación final
-- =====================================================

-- Mostrar resumen de cambios
DO $$
DECLARE
  total_registros INTEGER;
  registros_con_nuevo_formato INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_registros
  FROM business_partners
  WHERE eliminado_en IS NULL;

  SELECT COUNT(*) INTO registros_con_nuevo_formato
  FROM business_partners
  WHERE codigo_bp ~ '^BP-[0-9]{7}$'
    AND eliminado_en IS NULL;

  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Total de registros activos: %', total_registros;
  RAISE NOTICE '📊 Registros con formato BP-XXXXXXX: %', registros_con_nuevo_formato;
  RAISE NOTICE '🔧 Función generar_codigo_bp() creada';
  RAISE NOTICE '🔧 Trigger trigger_generar_codigo_bp creado';
  RAISE NOTICE '👁️  Vistas actualizadas: v_personas_completa, v_empresas_completa, v_actores_unificados';
END $$;
