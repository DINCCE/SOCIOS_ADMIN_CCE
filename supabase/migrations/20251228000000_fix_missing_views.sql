-- ==============================================================================
-- FIX: Recreate missing or broken views and synchronize naming with frontend
-- ==============================================================================

-- 1. Drop existing views to ensure a clean slate
DROP VIEW IF EXISTS public.v_personas_completa CASCADE;
DROP VIEW IF EXISTS public.v_empresas_completa CASCADE;
DROP VIEW IF EXISTS public.v_actores_unificados CASCADE;

-- 1.1 Ensure missing columns exist in tables
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS digito_verificacion TEXT;

-- 2. Recreate v_personas_completa
-- Standardizes naming: codigo_bp -> codigo, eliminado_en -> bp_eliminado_en
CREATE OR REPLACE VIEW public.v_personas_completa 
WITH (security_invoker = true) AS
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
    ((((p.primer_nombre || COALESCE((' '::text || p.segundo_nombre), ''::text)) || ' '::text) || p.primer_apellido) || COALESCE((' '::text || p.segundo_apellido), ''::text)) AS nombre_completo,
    p.genero,
    p.fecha_nacimiento,
    p.lugar_nacimiento,
    p.nacionalidad,
    p.estado_civil,
    p.ocupacion,
    p.profesion,
    p.nivel_educacion,
    p.tipo_sangre,
    p.eps,
    p.fecha_socio,
    p.fecha_aniversario,
    p.estado_vital,
    p.tags,
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
    p.perfil_intereses,
    p.perfil_preferencias,
    p.perfil_metricas,
    p.perfil_compliance,
    p.creado_en,
    p.actualizado_en,
    -- ... campos base del BP (Business Partner)
    bp.organizacion_id,
    bp.tipo_actor,
    bp.codigo_bp AS codigo, -- Mapping to 'codigo' for frontend consistency
    bp.estado,
    bp.email_principal,
    bp.telefono_principal,
    bp.creado_en AS bp_creado_en,
    bp.actualizado_en AS bp_actualizado_en,
    bp.eliminado_en AS bp_eliminado_en, -- Explicit mapping for page.tsx filtering
    o.nombre AS organizacion_nombre,
    (SELECT CONCAT(pe.primer_nombre, ' ', pe.primer_apellido) FROM personas pe WHERE pe.id = p.contacto_emergencia_id) AS nombre_contacto_emergencia
FROM personas p
JOIN business_partners bp ON p.id = bp.id
JOIN organizations o ON bp.organizacion_id = o.id;

-- 3. Recreate v_empresas_completa
CREATE OR REPLACE VIEW public.v_empresas_completa 
WITH (security_invoker = true) AS
SELECT 
    e.id,
    e.nit,
    e.digito_verificacion,
    e.razon_social,
    e.nombre_comercial,
    (e.nit || '-' || e.digito_verificacion) AS nit_completo,
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
    e.creado_en,
    e.actualizado_en,
    -- ... campos base del BP
    bp.organizacion_id,
    bp.tipo_actor,
    bp.codigo_bp AS codigo,
    bp.estado,
    bp.email_principal,
    bp.telefono_principal,
    bp.creado_en AS bp_creado_en,
    bp.actualizado_en AS bp_actualizado_en,
    bp.eliminado_en AS bp_eliminado_en,
    o.nombre AS organizacion_nombre,
    (SELECT CONCAT(pe.primer_nombre, ' ', pe.primer_apellido) FROM personas pe WHERE pe.id = e.representante_legal_id) AS nombre_representante_legal
FROM empresas e
JOIN business_partners bp ON e.id = bp.id
JOIN organizations o ON bp.organizacion_id = o.id;

-- 4. Recreate v_actores_unificados (Polymorphic)
CREATE OR REPLACE VIEW public.v_actores_unificados AS
SELECT 
    bp.id,
    bp.codigo_bp AS codigo,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.estado,
    ((((p.primer_nombre || COALESCE((' '::text || p.segundo_nombre), ''::text)) || ' '::text) || p.primer_apellido) || COALESCE((' '::text || p.segundo_apellido), ''::text)) AS nombre,
    p.numero_documento AS identificacion,
    p.tipo_documento AS tipo_identificacion,
    bp.email_principal,
    bp.telefono_principal,
    p.tags,
    p.creado_en,
    bp.eliminado_en
FROM business_partners bp
JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'::text
UNION ALL
SELECT 
    bp.id,
    bp.codigo_bp AS codigo,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.estado,
    e.razon_social AS nombre,
    e.nit AS identificacion,
    'NIT'::text AS tipo_identificacion,
    bp.email_principal,
    bp.telefono_principal,
    '{}'::TEXT[] AS tags,
    e.creado_en,
    bp.eliminado_en
FROM business_partners bp
JOIN empresas e ON bp.id = e.id
WHERE bp.tipo_actor = 'empresa'::text;

COMMENT ON VIEW public.v_personas_completa IS 'Vista unificada de personas con datos de BP y organizaciones.';
COMMENT ON VIEW public.v_empresas_completa IS 'Vista unificada de empresas con datos de BP y organizaciones.';
COMMENT ON VIEW public.v_actores_unificados IS 'Vista polimórfica para listados rápidos de todos los socios.';
