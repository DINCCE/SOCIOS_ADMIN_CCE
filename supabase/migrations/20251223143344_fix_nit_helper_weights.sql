-- ========================================
-- FIXED HELPER: calcular_digito_verificacion_nit
-- ========================================

CREATE OR REPLACE FUNCTION calcular_digito_verificacion_nit(p_nit TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_nit_limpio TEXT;
  -- Pesos oficiales de la DIAN para Módulo 11 (de derecha a izquierda)
  v_pesos INT[] := ARRAY[3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  v_suma INT := 0;
  v_dv INT;
  v_i INT;
  v_length INT;
BEGIN
  v_nit_limpio := regexp_replace(p_nit, '[^0-9]', '', 'g');
  v_length := length(v_nit_limpio);
  
  IF v_length = 0 THEN RETURN NULL; END IF;

  FOR v_i IN 1..v_length LOOP
    -- Multiplicar dígito (desde la derecha) por su peso correspondiente
    v_suma := v_suma + (substring(v_nit_limpio, v_length - v_i + 1, 1)::INT * v_pesos[v_i]);
  END LOOP;

  v_dv := v_suma % 11;
  
  IF v_dv >= 2 THEN
    v_dv := 11 - v_dv;
  END IF;

  RETURN v_dv::TEXT;
END;
$$;
