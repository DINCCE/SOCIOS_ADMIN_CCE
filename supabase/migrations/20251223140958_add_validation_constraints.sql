-- ========================================
-- LIMPIEZA DE DATOS EXISTENTES
-- ========================================

-- Limpiar teléfonos (quitar caracteres no numéricos)
UPDATE business_partners
SET telefono_principal = regexp_replace(telefono_principal, '[^0-9]', '', 'g')
WHERE telefono_principal IS NOT NULL;

-- Quitar prefijo 57 si tiene 12 dígitos
UPDATE business_partners
SET telefono_principal = substring(telefono_principal from 3)
WHERE telefono_principal ~ '^57[0-9]{10}$';

-- Mismo proceso para personas
UPDATE personas
SET telefono_secundario = regexp_replace(telefono_secundario, '[^0-9]', '', 'g')
WHERE telefono_secundario IS NOT NULL;

UPDATE personas
SET telefono_secundario = substring(telefono_secundario from 3)
WHERE telefono_secundario ~ '^57[0-9]{10}$';

UPDATE personas
SET whatsapp = regexp_replace(whatsapp, '[^0-9]', '', 'g')
WHERE whatsapp IS NOT NULL;

UPDATE personas
SET whatsapp = substring(whatsapp from 3)
WHERE whatsapp ~ '^57[0-9]{10}$';

-- ========================================
-- ÍNDICES ÚNICOS
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_bp_email_principal_unique 
ON business_partners(email_principal) 
WHERE email_principal IS NOT NULL AND eliminado_en IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bp_telefono_principal_unique 
ON business_partners(telefono_principal) 
WHERE telefono_principal IS NOT NULL AND eliminado_en IS NULL;

COMMENT ON INDEX idx_bp_email_principal_unique IS 'Garantiza que el email principal sea único en el sistema (excluyendo eliminados)';
COMMENT ON INDEX idx_bp_telefono_principal_unique IS 'Garantiza que el teléfono principal sea único en el sistema (excluyendo eliminados)';

-- ========================================
-- CHECK CONSTRAINTS
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_principal_format') THEN
    ALTER TABLE business_partners
    ADD CONSTRAINT check_email_principal_format 
    CHECK (email_principal IS NULL OR email_principal ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_telefono_principal_format') THEN
    ALTER TABLE business_partners
    ADD CONSTRAINT check_telefono_principal_format 
    CHECK (telefono_principal IS NULL OR telefono_principal ~ '^[0-9]{10}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_numero_documento_format') THEN
    ALTER TABLE personas
    ADD CONSTRAINT check_numero_documento_format 
    CHECK (numero_documento ~ '^[0-9]{5,20}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_secundario_format') THEN
    ALTER TABLE personas
    ADD CONSTRAINT check_email_secundario_format 
    CHECK (email_secundario IS NULL OR email_secundario ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_telefono_secundario_format') THEN
    ALTER TABLE personas
    ADD CONSTRAINT check_telefono_secundario_format 
    CHECK (telefono_secundario IS NULL OR telefono_secundario ~ '^[0-9]{10}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_whatsapp_format') THEN
    ALTER TABLE personas
    ADD CONSTRAINT check_whatsapp_format 
    CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{10}$');
  END IF;
END $$;

COMMENT ON CONSTRAINT check_email_principal_format ON business_partners IS 'Valida formato de email principal';
COMMENT ON CONSTRAINT check_telefono_principal_format ON business_partners IS 'Valida teléfono principal: 10 dígitos numéricos (Colombia)';
COMMENT ON CONSTRAINT check_numero_documento_format ON personas IS 'Valida número de documento: solo números, 5-20 caracteres';
COMMENT ON CONSTRAINT check_email_secundario_format ON personas IS 'Valida formato de email secundario';
COMMENT ON CONSTRAINT check_telefono_secundario_format ON personas IS 'Valida teléfono secundario: 10 dígitos numéricos (Colombia)';
COMMENT ON CONSTRAINT check_whatsapp_format ON personas IS 'Valida WhatsApp: 10 dígitos numéricos (Colombia)';
