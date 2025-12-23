-- 1. SOLUCIÓN AL TRIGGER: Hacerlo DEFERRABLE (Diferido)
-- Esto permite que la validación ocurra AL FINAL de la transacción, no en cada insert.
-- Así podemos insertar BP -> Insertar Persona -> COMMIT -> Trigger valida OK.

BEGIN;

-- Eliminar el trigger anterior (que era BEFORE INSERT)
DROP TRIGGER IF EXISTS tr_validar_consistencia_tipo_actor ON business_partners;
DROP TRIGGER IF EXISTS validar_consistencia_tipo_actor ON business_partners;

-- Recrear como CONSTRAINT TRIGGER (AFTER INSERT DEFERRABLE)
CREATE CONSTRAINT TRIGGER tr_validar_consistencia_tipo_actor
AFTER INSERT ON business_partners
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validar_consistencia_tipo_actor();

COMMIT;

-- 2. FUNCIÓN RPC PARA TRANSACCIÓN ATÓMICA
-- Esta función inserta ambos registros en una sola transacción de BD.
-- Recibe un objeto JSON con todos los datos para flexibilidad.

CREATE OR REPLACE FUNCTION create_new_person(
    p_organizacion_id UUID,
    p_datos_persona JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_bp_id UUID;
    v_codigo_bp TEXT;
BEGIN
    -- 1. Insertar Business Partner
    INSERT INTO business_partners (
        organizacion_id,
        tipo_actor,
        estado,
        email_principal,
        telefono_principal
    )
    VALUES (
        p_organizacion_id,
        'persona',
        'activo',
        (p_datos_persona->>'email_principal'),
        (p_datos_persona->>'telefono_principal')
    )
    RETURNING id, codigo_bp INTO v_bp_id, v_codigo_bp;

    -- 2. Insertar Persona (Usando el mismo ID)
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
        fecha_expedicion,
        lugar_expedicion,
        nacionalidad,
        estado_civil
    )
    VALUES (
        v_bp_id,
        (p_datos_persona->>'tipo_documento'),
        (p_datos_persona->>'numero_documento'),
        (p_datos_persona->>'primer_nombre'),
        (p_datos_persona->>'segundo_nombre'), -- puede ser null
        (p_datos_persona->>'primer_apellido'),
        (p_datos_persona->>'segundo_apellido'), -- puede ser null
        (p_datos_persona->>'genero'),
        (p_datos_persona->>'fecha_nacimiento')::date,
        (p_datos_persona->>'fecha_expedicion')::date, -- puede ser null
        (p_datos_persona->>'lugar_expedicion'), -- puede ser null
        COALESCE((p_datos_persona->>'nacionalidad'), 'CO'),
        (p_datos_persona->>'estado_civil')
    );

    -- 3. Retornar éxito
    RETURN jsonb_build_object(
        'success', true,
        'id', v_bp_id,
        'codigo_bp', v_codigo_bp,
        'message', 'Persona creada correctamente'
    );

EXCEPTION WHEN OTHERS THEN
    -- En caso de error, la transacción se revierte automáticamente
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;
