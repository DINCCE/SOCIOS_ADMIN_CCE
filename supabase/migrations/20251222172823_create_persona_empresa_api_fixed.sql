-- =====================================================
-- Migration: Create RPC API for Business Partners (Fixed)
-- =====================================================
-- Description: Creates PostgreSQL RPC functions to handle
--              CTI (Class Table Inheritance) pattern for
--              creating personas and empresas.
--
-- Problem Solved: When creating a persona or empresa,
--                 we need to:
--                 1. Create a business_partner record first
--                 2. Create the persona/empresa with same ID
--                 3. Ensure atomic transaction (both succeed or fail)
--
-- Solution: SECURITY DEFINER functions that bypass RLS
--          and handle both inserts in a single transaction
-- =====================================================

-- =====================================================
-- Function: crear_persona
-- =====================================================
-- Purpose: Creates a new persona with its base business_partner
--          in a single atomic transaction
--
-- Returns: UUID of the created business_partner/persona
-- =====================================================

CREATE OR REPLACE FUNCTION crear_persona(
  -- Business Partner required fields
  p_organizacion_id UUID,

  -- Persona required fields
  p_primer_nombre TEXT,
  p_primer_apellido TEXT,
  p_tipo_documento TEXT,
  p_numero_documento TEXT,

  -- Business Partner optional fields
  p_codigo_bp TEXT DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb,

  -- Persona optional name fields
  p_segundo_nombre TEXT DEFAULT NULL,
  p_segundo_apellido TEXT DEFAULT NULL,

  -- Persona contact fields
  p_email TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL,
  p_celular TEXT DEFAULT NULL,

  -- Persona personal info
  p_fecha_nacimiento DATE DEFAULT NULL,
  p_genero TEXT DEFAULT NULL,
  p_estado_civil TEXT DEFAULT NULL,
  p_nacionalidad TEXT DEFAULT NULL,

  -- Persona location
  p_direccion JSONB DEFAULT NULL,
  p_ciudad TEXT DEFAULT NULL,
  p_departamento TEXT DEFAULT NULL,
  p_pais TEXT DEFAULT 'Colombia',

  -- Persona professional
  p_profesion TEXT DEFAULT NULL,
  p_cargo TEXT DEFAULT NULL,
  p_empresa_trabaja TEXT DEFAULT NULL,

  -- Persona identification
  p_lugar_expedicion_documento TEXT DEFAULT NULL,
  p_fecha_expedicion_documento DATE DEFAULT NULL,

  -- Persona financial
  p_ingresos_mensuales NUMERIC(15,2) DEFAULT NULL,
  p_egresos_mensuales NUMERIC(15,2) DEFAULT NULL,
  p_patrimonio NUMERIC(15,2) DEFAULT NULL,
  p_actividad_economica TEXT DEFAULT NULL,

  -- Persona banking
  p_informacion_bancaria JSONB DEFAULT NULL,

  -- Persona legal
  p_persona_expuesta_politicamente BOOLEAN DEFAULT false,
  p_declarante_renta BOOLEAN DEFAULT false,
  p_tipo_contribuyente TEXT DEFAULT NULL,

  -- Persona social
  p_referencias JSONB DEFAULT NULL,
  p_contacto_emergencia JSONB DEFAULT NULL,

  -- Persona additional
  p_notas TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bp_id UUID;
BEGIN
  -- Validate required organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'Organization with ID % does not exist', p_organizacion_id;
  END IF;

  -- Validate tipo_documento enum
  IF p_tipo_documento NOT IN (
    'cedula_ciudadania',
    'cedula_extranjeria',
    'pasaporte',
    'tarjeta_identidad',
    'registro_civil',
    'nit',
    'nit_extranjero',
    'carnet_diplomatico',
    'pep',
    'permiso_especial_permanencia'
  ) THEN
    RAISE EXCEPTION 'Invalid tipo_documento: %. Must be one of the valid document types.', p_tipo_documento;
  END IF;

  -- Validate numero_documento is unique for this organization
  IF EXISTS (
    SELECT 1 FROM personas p
    JOIN business_partners bp ON p.id = bp.id
    WHERE bp.organizacion_id = p_organizacion_id
    AND p.numero_documento = p_numero_documento
    AND bp.eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'A persona with document number % already exists in this organization', p_numero_documento;
  END IF;

  -- 1. Create business_partner base record
  INSERT INTO business_partners (
    organizacion_id,
    tipo_actor,
    codigo_bp,
    estado,
    atributos,
    creado_por
  )
  VALUES (
    p_organizacion_id,
    'persona',
    COALESCE(p_codigo_bp, ''),
    'activo',
    p_atributos,
    auth.uid()
  )
  RETURNING id INTO v_bp_id;

  -- 2. Create persona specialization record with same ID
  INSERT INTO personas (
    id,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    tipo_documento,
    numero_documento,
    lugar_expedicion_documento,
    fecha_expedicion_documento,
    email,
    telefono,
    celular,
    fecha_nacimiento,
    genero,
    estado_civil,
    nacionalidad,
    direccion,
    ciudad,
    departamento,
    pais,
    profesion,
    cargo,
    empresa_trabaja,
    ingresos_mensuales,
    egresos_mensuales,
    patrimonio,
    actividad_economica,
    informacion_bancaria,
    persona_expuesta_politicamente,
    declarante_renta,
    tipo_contribuyente,
    referencias,
    contacto_emergencia,
    notas
  )
  VALUES (
    v_bp_id,
    p_primer_nombre,
    p_segundo_nombre,
    p_primer_apellido,
    p_segundo_apellido,
    p_tipo_documento,
    p_numero_documento,
    p_lugar_expedicion_documento,
    p_fecha_expedicion_documento,
    p_email,
    p_telefono,
    p_celular,
    p_fecha_nacimiento,
    p_genero,
    p_estado_civil,
    p_nacionalidad,
    COALESCE(p_direccion, '{}'::jsonb),
    p_ciudad,
    p_departamento,
    p_pais,
    p_profesion,
    p_cargo,
    p_empresa_trabaja,
    p_ingresos_mensuales,
    p_egresos_mensuales,
    p_patrimonio,
    p_actividad_economica,
    p_informacion_bancaria,
    p_persona_expuesta_politicamente,
    p_declarante_renta,
    p_tipo_contribuyente,
    p_referencias,
    p_contacto_emergencia,
    p_notas
  );

  -- 3. Return the created ID
  RETURN v_bp_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with context
    RAISE EXCEPTION 'Error creating persona: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION crear_persona TO authenticated;

-- Add function comment
COMMENT ON FUNCTION crear_persona IS 'Creates a new persona business partner with CTI pattern in atomic transaction';


-- =====================================================
-- Function: crear_empresa
-- =====================================================
-- Purpose: Creates a new empresa with its base business_partner
--          in a single atomic transaction
--
-- Returns: UUID of the created business_partner/empresa
-- =====================================================

CREATE OR REPLACE FUNCTION crear_empresa(
  -- Business Partner required fields
  p_organizacion_id UUID,

  -- Empresa required fields
  p_razon_social TEXT,
  p_tipo_sociedad TEXT,
  p_nit TEXT,

  -- Business Partner optional fields
  p_codigo_bp TEXT DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb,

  -- Empresa optional name fields
  p_nombre_comercial TEXT DEFAULT NULL,
  p_sigla TEXT DEFAULT NULL,

  -- Empresa identification
  p_digito_verificacion INTEGER DEFAULT NULL,
  p_fecha_constitucion DATE DEFAULT NULL,
  p_numero_escritura TEXT DEFAULT NULL,
  p_notaria TEXT DEFAULT NULL,
  p_lugar_constitucion TEXT DEFAULT NULL,

  -- Empresa contact
  p_email TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL,
  p_fax TEXT DEFAULT NULL,
  p_sitio_web TEXT DEFAULT NULL,

  -- Empresa location
  p_direccion JSONB DEFAULT NULL,
  p_ciudad TEXT DEFAULT NULL,
  p_departamento TEXT DEFAULT NULL,
  p_pais TEXT DEFAULT 'Colombia',

  -- Empresa business
  p_actividad_economica TEXT DEFAULT NULL,
  p_codigo_ciiu TEXT DEFAULT NULL,
  p_numero_empleados INTEGER DEFAULT NULL,
  p_tamano_empresa TEXT DEFAULT NULL,

  -- Empresa financial
  p_ingresos_anuales NUMERIC(15,2) DEFAULT NULL,
  p_activos NUMERIC(15,2) DEFAULT NULL,
  p_pasivos NUMERIC(15,2) DEFAULT NULL,
  p_patrimonio NUMERIC(15,2) DEFAULT NULL,

  -- Empresa legal
  p_representante_legal JSONB DEFAULT NULL,
  p_junta_directiva JSONB DEFAULT NULL,
  p_accionistas JSONB DEFAULT NULL,

  -- Empresa banking
  p_informacion_bancaria JSONB DEFAULT NULL,

  -- Empresa compliance
  p_tipo_contribuyente TEXT DEFAULT NULL,
  p_regimen_tributario TEXT DEFAULT NULL,
  p_responsabilidades_fiscales JSONB DEFAULT NULL,
  p_certificaciones JSONB DEFAULT NULL,

  -- Empresa additional
  p_referencias_comerciales JSONB DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bp_id UUID;
  v_digito_verificacion INTEGER;
BEGIN
  -- Validate required organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'Organization with ID % does not exist', p_organizacion_id;
  END IF;

  -- Validate tipo_sociedad enum
  IF p_tipo_sociedad NOT IN (
    'sociedad_anonima',
    'sociedad_limitada',
    'sociedad_comandita_simple',
    'sociedad_comandita_acciones',
    'sociedad_colectiva',
    'sociedad_acciones_simplificada',
    'empresa_unipersonal',
    'empresa_asociativa_trabajo',
    'entidad_sin_animo_lucro',
    'cooperativa'
  ) THEN
    RAISE EXCEPTION 'Invalid tipo_sociedad: %. Must be one of the valid company types.', p_tipo_sociedad;
  END IF;

  -- Auto-calculate digito_verificacion if not provided
  IF p_digito_verificacion IS NULL THEN
    v_digito_verificacion := calcular_digito_verificacion_nit(p_nit);
  ELSE
    v_digito_verificacion := p_digito_verificacion;
  END IF;

  -- Validate NIT is unique for this organization
  IF EXISTS (
    SELECT 1 FROM empresas e
    JOIN business_partners bp ON e.id = bp.id
    WHERE bp.organizacion_id = p_organizacion_id
    AND e.nit = p_nit
    AND bp.eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'An empresa with NIT % already exists in this organization', p_nit;
  END IF;

  -- 1. Create business_partner base record
  INSERT INTO business_partners (
    organizacion_id,
    tipo_actor,
    codigo_bp,
    estado,
    atributos,
    creado_por
  )
  VALUES (
    p_organizacion_id,
    'empresa',
    COALESCE(p_codigo_bp, ''),
    'activo',
    p_atributos,
    auth.uid()
  )
  RETURNING id INTO v_bp_id;

  -- 2. Create empresa specialization record with same ID
  INSERT INTO empresas (
    id,
    razon_social,
    nombre_comercial,
    sigla,
    tipo_sociedad,
    nit,
    digito_verificacion,
    fecha_constitucion,
    numero_escritura,
    notaria,
    lugar_constitucion,
    email,
    telefono,
    fax,
    sitio_web,
    direccion,
    ciudad,
    departamento,
    pais,
    actividad_economica,
    codigo_ciiu,
    numero_empleados,
    tamano_empresa,
    ingresos_anuales,
    activos,
    pasivos,
    patrimonio,
    representante_legal,
    junta_directiva,
    accionistas,
    informacion_bancaria,
    tipo_contribuyente,
    regimen_tributario,
    responsabilidades_fiscales,
    certificaciones,
    referencias_comerciales,
    notas
  )
  VALUES (
    v_bp_id,
    p_razon_social,
    p_nombre_comercial,
    p_sigla,
    p_tipo_sociedad,
    p_nit,
    v_digito_verificacion,
    p_fecha_constitucion,
    p_numero_escritura,
    p_notaria,
    p_lugar_constitucion,
    p_email,
    p_telefono,
    p_fax,
    p_sitio_web,
    COALESCE(p_direccion, '{}'::jsonb),
    p_ciudad,
    p_departamento,
    p_pais,
    p_actividad_economica,
    p_codigo_ciiu,
    p_numero_empleados,
    p_tamano_empresa,
    p_ingresos_anuales,
    p_activos,
    p_pasivos,
    p_patrimonio,
    p_representante_legal,
    p_junta_directiva,
    p_accionistas,
    p_informacion_bancaria,
    p_tipo_contribuyente,
    p_regimen_tributario,
    p_responsabilidades_fiscales,
    p_certificaciones,
    p_referencias_comerciales,
    p_notas
  );

  -- 3. Return the created ID
  RETURN v_bp_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with context
    RAISE EXCEPTION 'Error creating empresa: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION crear_empresa TO authenticated;

-- Add function comment
COMMENT ON FUNCTION crear_empresa IS 'Creates a new empresa business partner with CTI pattern in atomic transaction. Auto-calculates digito_verificacion if not provided.';
