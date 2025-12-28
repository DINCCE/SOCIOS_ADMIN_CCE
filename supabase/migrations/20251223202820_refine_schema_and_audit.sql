-- ==============================================================================
-- REFINAMIENTO DE ESQUEMA: REMOCIÓN DE DV Y ESTANDARIZACIÓN DE AUDITORÍA
-- Aplicado a personas y empresas para consistencia total con business_partners.
-- ==============================================================================

-- 0. Eliminar vistas dependientes temporalmente
DROP VIEW IF EXISTS public.v_actores_unificados;
DROP VIEW IF EXISTS public.v_empresas_completa;

-- 1. Refinamiento en tabla specialized: empresas
ALTER TABLE public.empresas DROP COLUMN IF EXISTS digito_verificacion;

-- 2. Adición de columnas de auditoría a personas y empresas
ALTER TABLE public.personas 
    ADD COLUMN IF NOT EXISTS creado_por UUID,
    ADD COLUMN IF NOT EXISTS actualizado_por UUID,
    ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS eliminado_por UUID;

ALTER TABLE public.empresas
    ADD COLUMN IF NOT EXISTS creado_por UUID,
    ADD COLUMN IF NOT EXISTS actualizado_por UUID,
    ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS eliminado_por UUID;

-- 3. Actualización de metadatos (Comentarios)
COMMENT ON COLUMN public.personas.creado_por IS 'UUID del usuario/app que creó el registro detallado.';
COMMENT ON COLUMN public.personas.actualizado_por IS 'UUID del usuario/app que actualizó el registro detallado.';
COMMENT ON COLUMN public.personas.eliminado_en IS 'Sincronizado con business_partners para consultas directas filtradas.';
COMMENT ON COLUMN public.personas.eliminado_por IS 'Usuario que eliminó el registro.';

COMMENT ON COLUMN public.empresas.creado_por IS 'UUID del usuario/app que creó el registro detallado.';
COMMENT ON COLUMN public.empresas.actualizado_por IS 'UUID del usuario/app que actualizó el registro detallado.';
COMMENT ON COLUMN public.empresas.eliminado_en IS 'Sincronizado con business_partners para consultas directas filtradas.';
COMMENT ON COLUMN public.empresas.eliminado_por IS 'Usuario que eliminó el registro.';

-- 4. Recrear vistas sin digito_verificacion
CREATE OR REPLACE VIEW public.v_empresas_completa AS
 SELECT e.id,
    e.nit,
    e.nit AS nit_completo, -- Sin DV
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

CREATE OR REPLACE VIEW public.v_actores_unificados AS
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
   FROM (business_partners bp
     JOIN personas p ON ((bp.id = p.id)))
  WHERE (bp.tipo_actor = 'persona'::text)
UNION ALL
 SELECT bp.id,
    bp.codigo_bp,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.estado,
    e.razon_social AS nombre,
    e.nit AS identificacion, -- Solo NIT
    'NIT'::text AS tipo_identificacion,
    bp.email_principal,
    bp.telefono_principal,
    NULL::text AS email_secundario,
    e.telefono_secundario,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
   FROM (business_partners bp
     JOIN empresas e ON ((bp.id = e.id)))
  WHERE (bp.tipo_actor = 'empresa'::text);

-- 5. Redefinición de RPC: crear_persona
CREATE OR REPLACE FUNCTION public.crear_persona(
  p_organizacion_id uuid,
  p_primer_nombre text,
  p_primer_apellido text,
  p_tipo_documento text,
  p_numero_documento text,
  p_genero text,
  p_fecha_nacimiento date,
  p_email_principal text DEFAULT NULL,
  p_telefono_principal text DEFAULT NULL,
  p_segundo_nombre text DEFAULT NULL,
  p_segundo_apellido text DEFAULT NULL,
  p_email_secundario text DEFAULT NULL,
  p_telefono_secundario text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL,
  p_nacionalidad text DEFAULT 'CO',
  p_estado_civil text DEFAULT NULL,
  p_ocupacion text DEFAULT NULL,
  p_profesion text DEFAULT NULL,
  p_nivel_educacion text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bp_id uuid;
  v_codigo_bp text;
  v_creado_por uuid := auth.uid();
  v_warnings text[] := array[]::text[];
BEGIN
  -- 1. Validaciones básicas
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'La organización con ID % no existe', p_organizacion_id;
  END IF;

  -- 2. Insertar en business_partners
  INSERT INTO business_partners (
    organizacion_id,
    tipo_actor,
    estado,
    email_principal,
    telefono_principal,
    creado_por
  )
  VALUES (
    p_organizacion_id,
    'persona',
    'activo',
    p_email_principal,
    p_telefono_principal,
    v_creado_por
  )
  RETURNING id, codigo_bp INTO v_bp_id, v_codigo_bp;

  -- 3. Insertar en personas
  INSERT INTO personas (
    id,
    tipo_documento,
    numero_documento,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    genero,
    fecha_nacimiento,
    nacionalidad,
    email_secundario,
    telefono_secundario,
    whatsapp,
    estado_civil,
    ocupacion,
    profesion,
    nivel_educacion,
    creado_por
  )
  VALUES (
    v_bp_id,
    p_tipo_documento,
    p_numero_documento,
    p_primer_nombre,
    p_segundo_nombre,
    p_primer_apellido,
    p_segundo_apellido,
    p_genero,
    p_fecha_nacimiento,
    p_nacionalidad,
    p_email_secundario,
    p_telefono_secundario,
    p_whatsapp,
    p_estado_civil,
    p_ocupacion,
    p_profesion,
    p_nivel_educacion,
    v_creado_por
  );

  RETURN jsonb_build_object(
    'success', true,
    'bp_id', v_bp_id,
    'codigo_bp', v_codigo_bp,
    'message', 'Persona creada exitosamente',
    'warnings', v_warnings
  );
END;
$$;

-- 6. Redefinición de RPC: crear_empresa (Sin DV)
CREATE OR REPLACE FUNCTION public.crear_empresa(
  p_organizacion_id uuid,
  p_razon_social text,
  p_nit text,
  p_tipo_sociedad text,
  p_email_principal text DEFAULT NULL,
  p_telefono_principal text DEFAULT NULL,
  p_nombre_comercial text DEFAULT NULL,
  p_fecha_constitucion date DEFAULT NULL,
  p_ciudad_constitucion text DEFAULT NULL,
  p_sector_industria text DEFAULT NULL,
  p_actividad_economica text DEFAULT NULL,
  p_tamano_empresa text DEFAULT NULL,
  p_email_secundario text DEFAULT NULL,
  p_telefono_secundario text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_representante_legal_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bp_id uuid;
  v_codigo_bp text;
  v_creado_por uuid := auth.uid();
  v_warnings text[] := array[]::text[];
BEGIN
  -- 1. Validaciones básicas
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'La organización con ID % no existe', p_organizacion_id;
  END IF;

  -- 2. Insertar en business_partners
  INSERT INTO business_partners (
    organizacion_id,
    tipo_actor,
    estado,
    email_principal,
    telefono_principal,
    creado_por
  )
  VALUES (
    p_organizacion_id,
    'empresa',
    'activo',
    p_email_principal,
    p_telefono_principal,
    v_creado_por
  )
  RETURNING id, codigo_bp INTO v_bp_id, v_codigo_bp;

  -- 3. Insertar en empresas
  INSERT INTO empresas (
    id,
    nit,
    razon_social,
    nombre_comercial,
    tipo_sociedad,
    fecha_constitucion,
    ciudad_constitucion,
    sector_industria,
    actividad_economica,
    tamano_empresa,
    email_secundario,
    telefono_secundario,
    whatsapp,
    website,
    representante_legal_id,
    creado_por
  )
  VALUES (
    v_bp_id,
    p_nit,
    p_razon_social,
    p_nombre_comercial,
    p_tipo_sociedad,
    p_fecha_constitucion,
    p_ciudad_constitucion,
    p_sector_industria,
    p_actividad_economica,
    p_tamano_empresa,
    p_email_secundario,
    p_telefono_secundario,
    p_whatsapp,
    p_website,
    p_representante_legal_id,
    v_creado_por
  );

  RETURN jsonb_build_object(
    'success', true,
    'bp_id', v_bp_id,
    'codigo_bp', v_codigo_bp,
    'message', 'Empresa creada exitosamente',
    'warnings', v_warnings
  );
END;
$$;
