-- ==============================================================================
-- CORRECCIÓN DE SEGURIDAD EN VISTAS: SECURITY INVOKER
-- Las vistas por defecto en PostgreSQL (si no se especifica) pueden saltarse las 
-- políticas de RLS si el creador es un superusuario. 
-- Al añadir WITH (security_invoker = true), la vista respeta el RLS del usuario 
-- que ejecuta la consulta, garantizando el multi-tenancy.
-- ==============================================================================

-- 1. Vista: v_personas_completa
DROP VIEW IF EXISTS public.v_personas_completa;
CREATE VIEW public.v_personas_completa 
WITH (security_invoker = true) AS
SELECT p.id,
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
    bp.codigo_bp,
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
    o.nombre AS organizacion_nombre,
    o.slug AS organizacion_slug,
    o.tipo AS organizacion_tipo,
    ((((ce.primer_nombre || COALESCE((' '::text || ce.segundo_nombre), ''::text)) || ' '::text) || ce.primer_apellido) || COALESCE((' '::text || ce.segundo_apellido), ''::text)) AS contacto_emergencia_nombre
   FROM personas p
     JOIN business_partners bp ON p.id = bp.id
     JOIN organizations o ON bp.organizacion_id = o.id
     LEFT JOIN personas ce ON p.contacto_emergencia_id = ce.id;

-- 2. Vista: v_empresas_completa
DROP VIEW IF EXISTS public.v_empresas_completa;
CREATE VIEW public.v_empresas_completa 
WITH (security_invoker = true) AS
SELECT e.id,
    e.nit,
    e.nit AS nit_completo,
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
    e.creado_por AS empresa_creado_por,
    e.actualizado_en AS empresa_actualizado_en,
    e.actualizado_por AS empresa_actualizado_por,
    e.eliminado_en AS empresa_eliminado_en,
    e.eliminado_por AS empresa_eliminado_por,
    bp.codigo_bp,
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
    o.nombre AS organizacion_nombre,
    o.slug AS organizacion_slug,
    o.tipo AS organizacion_tipo,
    ((((rl.primer_nombre || COALESCE((' '::text || rl.segundo_nombre), ''::text)) || ' '::text) || rl.primer_apellido) || COALESCE((' '::text || rl.segundo_apellido), ''::text)) AS representante_legal_nombre
   FROM (((empresas e
     JOIN business_partners bp ON ((e.id = bp.id)))
     JOIN organizations o ON ((bp.organizacion_id = o.id)))
     LEFT JOIN personas rl ON ((e.representante_legal_id = rl.id)));

-- 3. Vista: v_actores_unificados
DROP VIEW IF EXISTS public.v_actores_unificados;
CREATE VIEW public.v_actores_unificados 
WITH (security_invoker = true) AS
SELECT bp.id,
    bp.codigo_bp,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.estado,
    ((((p.primer_nombre || COALESCE((' '::text || p.segundo_nombre), ''::text)) || ' '::text) || p.primer_apellido) || COALESCE((' '::text || p.segundo_apellido), ''::text)) AS nombre,
    p.numero_documento AS identificacion,
    p.tipo_documento AS tipo_identificacion,
    bp.email_principal,
    bp.telefono_principal,
    p.email_secundario,
    p.telefono_secundario,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
   FROM business_partners bp
     JOIN personas p ON bp.id = p.id
  WHERE bp.tipo_actor = 'persona'::text
UNION ALL
 SELECT bp.id,
    bp.codigo_bp,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.estado,
    e.razon_social AS nombre,
    e.nit AS identificacion,
    'NIT'::text AS tipo_identificacion,
    bp.email_principal,
    bp.telefono_principal,
    NULL::text AS email_secundario,
    e.telefono_secundario,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
   FROM business_partners bp
     JOIN empresas e ON bp.id = e.id
  WHERE bp.tipo_actor = 'empresa'::text;

-- Restablecer comentarios
COMMENT ON VIEW public.v_personas_completa IS 'Vista desnormalizada que combina datos de personas, business_partners y organizations para facilitar queries. Respeta RLS.';
COMMENT ON VIEW public.v_empresas_completa IS 'Vista desnormalizada que combina datos de empresas, business_partners, organizations y representante legal. Respeta RLS.';
COMMENT ON VIEW public.v_actores_unificados IS 'Vista polimórfica que unifica TODOS los actores (personas + empresas) en una sola vista con campos comunes. Respeta RLS.';
