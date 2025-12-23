-- ========================================
-- HELPER: calcular_digito_verificacion_nit
-- ========================================
-- Algoritmo Módulo 11 para NIT en Colombia

CREATE OR REPLACE FUNCTION calcular_digito_verificacion_nit(p_nit TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_nit_limpio TEXT;
  v_pesos INT[] := ARRAY[71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  v_suma INT := 0;
  v_dv INT;
  v_i INT;
  v_length INT;
BEGIN
  -- 1. Limpiar el NIT (solo números)
  v_nit_limpio := regexp_replace(p_nit, '[^0-9]', '', 'g');
  v_length := length(v_nit_limpio);
  
  -- 2. Validar longitud mínima
  IF v_length = 0 THEN RETURN NULL; END IF;

  -- 3. Calcular suma ponderada
  FOR v_i IN 1..v_length LOOP
    v_suma := v_suma + (substring(v_nit_limpio, v_length - v_i + 1, 1)::INT * v_pesos[v_i]);
  END LOOP;

  -- 4. Cálculo final Módulo 11
  v_dv := v_suma % 11;
  
  IF v_dv >= 2 THEN
    v_dv := 11 - v_dv;
  END IF;

  RETURN v_dv::TEXT;
END;
$$;

-- ========================================
-- CONSTRAINTS PARA EMPRESAS
-- ========================================

-- Validar formato de NIT (Solo números, 7-12 dígitos)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_nit_format') THEN
    ALTER TABLE empresas
    ADD CONSTRAINT check_nit_format 
    CHECK (nit ~ '^[0-9]{7,12}$');
  END IF;
END $$;

-- Validar formato de teléfono secundario (10 dígitos)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_empresa_telefono_secundario_format') THEN
    ALTER TABLE empresas
    ADD CONSTRAINT check_empresa_telefono_secundario_format 
    CHECK (telefono_secundario IS NULL OR telefono_secundario ~ '^[0-9]{10}$');
  END IF;
END $$;

-- Validar formato de WhatsApp (10 dígitos)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_empresa_whatsapp_format') THEN
    ALTER TABLE empresas
    ADD CONSTRAINT check_empresa_whatsapp_format 
    CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{10}$');
  END IF;
END $$;

-- ========================================
-- API RPC: crear_empresa
-- ========================================

CREATE OR REPLACE FUNCTION crear_empresa(
  -- Campos obligatorios
  p_organizacion_id UUID,
  p_razon_social TEXT,
  p_nit TEXT,
  p_tipo_sociedad TEXT,
  p_email_principal TEXT,
  p_telefono_principal TEXT,
  
  -- Campos opcionales
  p_nombre_comercial TEXT DEFAULT NULL,
  p_digito_verificacion TEXT DEFAULT NULL,
  p_fecha_constitucion DATE DEFAULT NULL,
  p_ciudad_constitucion TEXT DEFAULT NULL,
  p_sector_industria TEXT DEFAULT NULL,
  p_actividad_economica TEXT DEFAULT NULL,
  p_tamano_empresa TEXT DEFAULT NULL,
  p_email_secundario TEXT DEFAULT NULL,
  p_telefono_secundario TEXT DEFAULT NULL,
  p_whatsapp TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_representante_legal_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bp_id UUID;
  v_codigo_bp TEXT;
  v_dv_calculado TEXT;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- ========================================
  -- VALIDACIONES CRÍTICAS (ERRORES)
  -- ========================================
  
  -- 1. Validar organización existe
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'La organización especificada no existe';
  END IF;

  -- 2. Validar formatos básicos (limpieza previa se asume que se hace o se valida aquí)
  IF p_telefono_principal !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'El teléfono principal debe tener exactamente 10 dígitos numéricos';
  END IF;
  
  IF p_email_principal !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'El formato del email principal es inválido';
  END IF;

  IF p_nit !~ '^[0-9]{7,12}$' THEN
    RAISE EXCEPTION 'El NIT debe contener solo números (7-12 dígitos)';
  END IF;

  -- 3. Validar unicidad de NIT en la organización (excluyendo eliminados)
  IF EXISTS (
    SELECT 1 FROM empresas e
    JOIN business_partners bp ON e.id = bp.id
    WHERE e.nit = p_nit 
      AND bp.organizacion_id = p_organizacion_id
      AND bp.eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El NIT ya está registrado para esta organización';
  END IF;

  -- 4. Validar unicidad de contactos principales en el sistema
  IF EXISTS (
    SELECT 1 FROM business_partners 
    WHERE email_principal = p_email_principal 
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El email principal ya está registrado en el sistema';
  END IF;

  IF EXISTS (
    SELECT 1 FROM business_partners 
    WHERE telefono_principal = p_telefono_principal 
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El teléfono principal ya está registrado en el sistema';
  END IF;

  -- ========================================
  -- LÓGICA DE DÍGITO DE VERIFICACIÓN
  -- ========================================
  
  v_dv_calculado := calcular_digito_verificacion_nit(p_nit);
  
  IF p_digito_verificacion IS NOT NULL AND p_digito_verificacion <> v_dv_calculado THEN
    v_warnings := array_append(v_warnings, 'El dígito de verificación proporcionado (' || p_digito_verificacion || ') no coincide con el calculado (' || v_dv_calculado || ')');
  END IF;

  -- ========================================
  -- VALIDACIONES DE WARNING (NO BLOQUEAN)
  -- ========================================
  
  -- Warning: Contactos secundarios duplicados
  IF p_email_secundario IS NOT NULL AND EXISTS (
    SELECT 1 FROM business_partners WHERE email_principal = p_email_secundario AND eliminado_en IS NULL
  ) THEN
    v_warnings := array_append(v_warnings, 'El email secundario ya existe como principal en otro registro');
  END IF;

  -- ========================================
  -- CREACIÓN DE REGISTROS
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
    'empresa',
    p_email_principal,
    p_telefono_principal,
    'activo'
  )
  RETURNING id, codigo_bp INTO v_bp_id, v_codigo_bp;
  
  -- Paso 2: Crear Empresa
  INSERT INTO empresas (
    id,
    nit,
    digito_verificacion,
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
    representante_legal_id
  ) VALUES (
    v_bp_id,
    p_nit,
    COALESCE(p_digito_verificacion, v_dv_calculado),
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
    p_representante_legal_id
  );
  
  -- ========================================
  -- RETORNAR RESULTADO
  -- ========================================
  
  RETURN jsonb_build_object(
    'success', true,
    'bp_id', v_bp_id,
    'codigo_bp', v_codigo_bp,
    'message', 'Empresa creada exitosamente con código ' || v_codigo_bp,
    'warnings', v_warnings
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'bp_id', NULL,
      'codigo_bp', NULL,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

-- Comentarios
COMMENT ON FUNCTION crear_empresa IS 'Crea una empresa de forma atómica con validaciones. Autocalcula el DV del NIT si no se proporciona.';
COMMENT ON FUNCTION calcular_digito_verificacion_nit IS 'Calcula el dígito de verificación para un NIT colombiano usando el algoritmo Módulo 11.';
