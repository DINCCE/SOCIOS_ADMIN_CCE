-- ==============================================================================
-- MEJORA DE ENTIDAD PERSONA: CRM 2025
-- Añade campos de salud, lealtad y contenedores JSONB especializados.
-- ==============================================================================

-- 0. Eliminar vistas dependientes temporalmente
DROP VIEW IF EXISTS public.v_actores_unificados;
DROP VIEW IF EXISTS public.v_personas_completa;

-- 1. Actualización de tabla personas
-- Nota: tipo_sangre ya existe como TEXT, añadimos validación y otros campos nuevos.
ALTER TABLE public.personas 
    ADD COLUMN IF NOT EXISTS eps TEXT,
    ADD COLUMN IF NOT EXISTS fecha_socio DATE,
    ADD COLUMN IF NOT EXISTS fecha_aniversario DATE,
    ADD COLUMN IF NOT EXISTS estado_vital TEXT DEFAULT 'vivo',
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS perfil_intereses JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS perfil_preferencias JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS perfil_metricas JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS perfil_compliance JSONB DEFAULT '{}';

-- 2. Añadir restricciones de validación
ALTER TABLE public.personas
    DROP CONSTRAINT IF EXISTS personas_tipo_sangre_check,
    ADD CONSTRAINT personas_tipo_sangre_check CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    DROP CONSTRAINT IF EXISTS personas_estado_vital_check,
    ADD CONSTRAINT personas_estado_vital_check CHECK (estado_vital IN ('vivo', 'fallecido', 'desconocido'));

-- 3. Migración de datos y limpieza de columna antigua
-- Movemos lo que haya en 'atributos' a 'perfil_intereses' antes de borrarla
UPDATE public.personas 
SET perfil_intereses = COALESCE(atributos, '{}'::jsonb)
WHERE atributos IS NOT NULL AND atributos != '{}'::jsonb;

ALTER TABLE public.personas DROP COLUMN IF EXISTS atributos;

-- 4. Actualización de metadatos (Comentarios)
COMMENT ON COLUMN public.personas.eps IS 'Entidad Promotora de Salud del socio.';
COMMENT ON COLUMN public.personas.fecha_socio IS 'Fecha de la primera vinculación del socio al club.';
COMMENT ON COLUMN public.personas.fecha_aniversario IS 'Fecha de aniversario de boda o unión del socio.';
COMMENT ON COLUMN public.personas.estado_vital IS 'Estado vital del socio: vivo, fallecido o desconocido.';
COMMENT ON COLUMN public.personas.tags IS 'Etiquetas multiselección para segmentación rápida.';
COMMENT ON COLUMN public.personas.perfil_intereses IS 'Contenedor JSONB para gustos y hobbies del socio (QUÉ le gusta).';
COMMENT ON COLUMN public.personas.perfil_preferencias IS 'Contenedor JSONB para preferencias operativas y hospitality (CÓMO ser atendido).';
COMMENT ON COLUMN public.personas.perfil_metricas IS 'Contenedor JSONB para métricas de valor e IA (Scores, LTV, Engagement).';
COMMENT ON COLUMN public.personas.perfil_compliance IS 'Contenedor JSONB para historial legal, habeas data y contratos.';

-- 5. Recrear Vistas con seguridad y nuevos campos
CREATE OR REPLACE VIEW public.v_personas_completa 
WITH (security_invoker = true) AS
SELECT 
    p.id,
    p.tipo_documento,
    p.numero_documento,
    p.primer_nombre,
    p.segundo_nombre,
    p.primer_apellido,
    p.segundo_apellido,
    ((((p.primer_nombre || COALESCE((' '::text || p.segundo_nombre), ''::text)) || ' '::text) || p.primer_apellido) || COALESCE((' '::text || p.segundo_apellido), ''::text)) AS nombre_completo,
    p.genero,
    p.fecha_nacimiento,
    p.nacionalidad,
    p.tipo_sangre,
    p.eps,
    p.fecha_socio,
    p.fecha_aniversario,
    p.estado_vital,
    p.tags,
    p.perfil_intereses,
    p.perfil_preferencias,
    p.perfil_metricas,
    p.perfil_compliance,
    -- ... campos de contacto
    p.email_secundario,
    p.telefono_secundario,
    p.whatsapp,
    -- ... campos base del BP
    bp.codigo_bp,
    bp.estado,
    bp.email_principal,
    bp.telefono_principal,
    bp.organizacion_id,
    o.nombre AS organizacion_nombre
FROM personas p
JOIN business_partners bp ON p.id = bp.id
JOIN organizations o ON bp.organizacion_id = o.id
WHERE bp.eliminado_en IS NULL;

CREATE OR REPLACE VIEW public.v_actores_unificados 
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
    p.tags, -- Añadido tags a vista unificada
    bp.creado_en,
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
    '{}'::TEXT[] AS tags,
    bp.creado_en,
    bp.eliminado_en
   FROM business_partners bp
     JOIN empresas e ON bp.id = e.id
  WHERE bp.tipo_actor = 'empresa'::text;

-- 6. Actualizar RPC crear_persona
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
  p_tipo_sangre text DEFAULT NULL,
  p_eps text DEFAULT NULL,
  p_fecha_socio date DEFAULT NULL,
  p_fecha_aniversario date DEFAULT NULL,
  p_tags text[] DEFAULT '{}',
  p_nacionalidad text DEFAULT 'CO',
  p_email_secundario text DEFAULT NULL,
  p_telefono_secundario text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL
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
BEGIN
  -- Insert en BP
  INSERT INTO business_partners (organizacion_id, tipo_actor, email_principal, telefono_principal, creado_por)
  VALUES (p_organizacion_id, 'persona', p_email_principal, p_telefono_principal, v_creado_por)
  RETURNING id, codigo_bp INTO v_bp_id, v_codigo_bp;

  -- Insert en Personas
  INSERT INTO personas (
    id, tipo_documento, numero_documento, primer_nombre, segundo_nombre, 
    primer_apellido, segundo_apellido, genero, fecha_nacimiento, nacionalidad,
    tipo_sangre, eps, fecha_socio, fecha_aniversario, tags,
    email_secundario, telefono_secundario, whatsapp, creado_por
  )
  VALUES (
    v_bp_id, p_tipo_documento, p_numero_documento, p_primer_nombre, p_segundo_nombre,
    p_primer_apellido, p_segundo_apellido, p_genero, p_fecha_nacimiento, p_nacionalidad,
    p_tipo_sangre, p_eps, p_fecha_socio, p_fecha_aniversario, p_tags,
    p_email_secundario, p_telefono_secundario, p_whatsapp, v_creado_por
  );

  RETURN jsonb_build_object('success', true, 'bp_id', v_bp_id, 'codigo_bp', v_codigo_bp);
END;
$$;
