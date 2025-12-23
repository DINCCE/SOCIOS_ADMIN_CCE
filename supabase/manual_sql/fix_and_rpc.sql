-- =====================================================
-- SOLUCIÓN INTEGRAL: FIX TRIGGER + CREATE OFFICIAL RPCS
-- =====================================================

BEGIN;

-- 1. ARREGLAR EL TRIGGER (El "Policía")
DROP TRIGGER IF EXISTS tr_validar_consistencia_tipo_actor ON business_partners;
DROP TRIGGER IF EXISTS validar_consistencia_tipo_actor ON business_partners;

CREATE CONSTRAINT TRIGGER tr_validar_consistencia_tipo_actor
AFTER INSERT ON business_partners
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validar_consistencia_tipo_actor();


-- 2. INSTALAR RPC OFICIAL: crear_persona
-- CORREGIDO: Parámetros requeridos PRIMERO, opcionales (con DEFAULT) DESPUÉS.

CREATE OR REPLACE FUNCTION crear_persona(
  -- REQUIRED Business Partner fields
  p_organizacion_id UUID,
  p_codigo_bp TEXT,

  -- REQUIRED Persona fields
  p_primer_nombre TEXT,
  p_primer_apellido TEXT,
  p_tipo_documento TEXT,
  p_numero_documento TEXT,

  -- OPTIONAL Fields (Must come after required ones)
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
    p_codigo_bp,
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
    RAISE EXCEPTION 'Error creating persona: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION crear_persona TO authenticated;
COMMENT ON FUNCTION crear_persona IS 'Creates a new persona business partner with CTI pattern in atomic transaction';

COMMIT;
