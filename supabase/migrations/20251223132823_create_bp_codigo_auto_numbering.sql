-- Paso 1: Crear la secuencia para generar números consecutivos
CREATE SEQUENCE IF NOT EXISTS business_partner_codigo_seq START WITH 1;

-- Paso 2: Inicializar la secuencia con el último número usado (si ya existen registros)
-- Esto evita duplicados si ya hay códigos BP en la base de datos
SELECT setval('business_partner_codigo_seq', 
  COALESCE(
    (SELECT MAX(CAST(SUBSTRING(codigo_bp FROM 4) AS INTEGER)) 
     FROM business_partners 
     WHERE codigo_bp ~ '^BP-[0-9]+$'),
    0
  )
);

-- Paso 3: Crear la función que genera el código automáticamente
CREATE OR REPLACE FUNCTION generar_codigo_bp()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar código si no fue proporcionado por el usuario
  IF NEW.codigo_bp IS NULL OR NEW.codigo_bp = '' THEN
    NEW.codigo_bp := 'BP-' || LPAD(nextval('business_partner_codigo_seq')::TEXT, 7, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear el trigger que ejecuta la función ANTES de insertar
DROP TRIGGER IF EXISTS trigger_generar_codigo_bp ON business_partners;
CREATE TRIGGER trigger_generar_codigo_bp
  BEFORE INSERT ON business_partners
  FOR EACH ROW
  EXECUTE FUNCTION generar_codigo_bp();

-- Comentarios para documentación
COMMENT ON SEQUENCE business_partner_codigo_seq IS 'Secuencia para generar códigos únicos de Business Partners (BP-XXXXXXX)';
COMMENT ON FUNCTION generar_codigo_bp() IS 'Genera automáticamente el código BP si no es proporcionado en el INSERT';
COMMENT ON TRIGGER trigger_generar_codigo_bp ON business_partners IS 'Trigger que asigna código BP automáticamente antes de insertar';
