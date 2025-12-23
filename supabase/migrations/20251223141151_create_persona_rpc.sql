-- ========================================
-- FUNCIÓN RPC: crear_persona
-- ========================================
-- Crea una persona de forma atómica con todas las validaciones necesarias
-- Retorna JSON con resultado, código BP generado, y warnings si aplican

CREATE OR REPLACE FUNCTION crear_persona(
  -- Campos obligatorios
  p_organizacion_id UUID,
  p_primer_nombre TEXT,
  p_primer_apellido TEXT,
  p_tipo_documento TEXT,
  p_numero_documento TEXT,
  p_genero TEXT,
  p_fecha_nacimiento DATE,
  p_email_principal TEXT,
  p_telefono_principal TEXT,
  
  -- Campos opcionales
  p_segundo_nombre TEXT DEFAULT NULL,
  p_segundo_apellido TEXT DEFAULT NULL,
  p_email_secundario TEXT DEFAULT NULL,
  p_telefono_secundario TEXT DEFAULT NULL,
  p_whatsapp TEXT DEFAULT NULL,
  p_nacionalidad TEXT DEFAULT 'CO',
  p_estado_civil TEXT DEFAULT NULL,
  p_ocupacion TEXT DEFAULT NULL,
  p_profesion TEXT DEFAULT NULL,
  p_nivel_educacion TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bp_id UUID;
  v_codigo_bp TEXT;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- ========================================
  -- VALIDACIONES CRÍTICAS (ERRORES)
  -- ========================================
  
  -- 1. Validar organización existe
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'La organización especificada no existe';
  END IF;
  
  -- 2. Validar formato de teléfono principal (10 dígitos Colombia)
  IF p_telefono_principal !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'El teléfono principal debe tener exactamente 10 dígitos numéricos';
  END IF;
  
  -- 3. Validar formato de email principal
  IF p_email_principal !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'El formato del email principal es inválido';
  END IF;
  
  -- 4. Validar formato de número de documento (solo números, 5-20 dígitos)
  IF p_numero_documento !~ '^[0-9]{5,20}$' THEN
    RAISE EXCEPTION 'El número de documento debe contener solo números (5-20 dígitos)';
  END IF;
  
  -- 5. Validar email principal NO duplicado
  IF EXISTS (
    SELECT 1 FROM business_partners 
    WHERE email_principal = p_email_principal 
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El email principal ya está registrado en el sistema';
  END IF;
  
  -- 6. Validar teléfono principal NO duplicado
  IF EXISTS (
    SELECT 1 FROM business_partners 
    WHERE telefono_principal = p_telefono_principal 
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El teléfono principal ya está registrado en el sistema';
  END IF;
  
  -- 7. Validar documento NO duplicado en la organización
  IF EXISTS (
    SELECT 1 FROM personas p
    JOIN business_partners bp ON p.id = bp.id
    WHERE p.tipo_documento = p_tipo_documento 
      AND p.numero_documento = p_numero_documento
      AND bp.organizacion_id = p_organizacion_id
      AND bp.eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'Ya existe una persona con este documento en la organización';
  END IF;
  
  -- 8. Validar fecha de nacimiento no futura
  IF p_fecha_nacimiento > CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha de nacimiento no puede ser futura';
  END IF;
  
  -- 9. Validar edad mínima (18 años)
  IF p_fecha_nacimiento > CURRENT_DATE - INTERVAL '18 years' THEN
    RAISE EXCEPTION 'La persona debe ser mayor de 18 años';
  END IF;
  
  -- ========================================
  -- VALIDACIONES DE WARNING (NO BLOQUEAN)
  -- ========================================
  
  -- 10. Warning: Email secundario duplicado
  IF p_email_secundario IS NOT NULL AND EXISTS (
    SELECT 1 FROM personas 
    WHERE email_secundario = p_email_secundario
  ) THEN
    v_warnings := array_append(v_warnings, 'El email secundario ya existe en otra persona');
  END IF;
  
  -- 11. Warning: Teléfono secundario duplicado
  IF p_telefono_secundario IS NOT NULL AND EXISTS (
    SELECT 1 FROM personas 
    WHERE telefono_secundario = p_telefono_secundario
  ) THEN
    v_warnings := array_append(v_warnings, 'El teléfono secundario ya existe en otra persona');
  END IF;
  
  -- ========================================
  -- CREACIÓN DE REGISTROS (TRANSACCIÓN ATÓMICA)
  -- ========================================
  
  -- Paso 1: Crear Business Partner
  INSERT INTO business_partners (
    organizacion_id, 
    tipo_actor,
    email_principal,
    telefono_principal,
    estado
  )
  VALUES (
    p_organizacion_id, 
    'persona',
    p_email_principal,
    p_telefono_principal,
    'activo'
  )
  RETURNING id, codigo_bp INTO v_bp_id, v_codigo_bp;
  
  -- Paso 2: Crear Persona (mismo ID que business_partner)
  INSERT INTO personas (
    id,
    primer_nombre,
    primer_apellido,
    segundo_nombre,
    segundo_apellido,
    tipo_documento,
    numero_documento,
    genero,
    fecha_nacimiento,
    nacionalidad,
    estado_civil,
    ocupacion,
    profesion,
    nivel_educacion,
    email_secundario,
    telefono_secundario,
    whatsapp
  ) VALUES (
    v_bp_id,
    p_primer_nombre,
    p_primer_apellido,
    p_segundo_nombre,
    p_segundo_apellido,
    p_tipo_documento,
    p_numero_documento,
    p_genero,
    p_fecha_nacimiento,
    p_nacionalidad,
    p_estado_civil,
    p_ocupacion,
    p_profesion,
    p_nivel_educacion,
    p_email_secundario,
    p_telefono_secundario,
    p_whatsapp
  );
  
  -- ========================================
  -- RETORNAR RESULTADO
  -- ========================================
  
  RETURN jsonb_build_object(
    'success', true,
    'bp_id', v_bp_id,
    'codigo_bp', v_codigo_bp,
    'message', 'Persona creada exitosamente con código ' || v_codigo_bp,
    'warnings', v_warnings
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Capturar cualquier error y retornar en formato JSON
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'bp_id', NULL,
      'codigo_bp', NULL,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION crear_persona IS 'Crea una persona de forma atómica con validaciones completas. Retorna JSON con {success, bp_id, codigo_bp, message, warnings}';
