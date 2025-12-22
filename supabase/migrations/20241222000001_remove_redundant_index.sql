-- =====================================================
-- Migration: Remove redundant index on codigo_bp
-- Date: 2024-12-22
-- Description:
--   Elimina el índice redundante idx_bp_codigo ya que
--   el constraint UNIQUE business_partners_codigo_key
--   ya provee un índice B-tree optimizado para búsquedas.
--
--   Beneficios:
--   - Reduce espacio en disco
--   - Mejora performance de INSERT/UPDATE/DELETE
--   - Sin impacto en performance de SELECT (el índice UNIQUE lo cubre)
-- =====================================================

-- Verificar índices existentes antes de eliminar
DO $$
BEGIN
  RAISE NOTICE '📊 Índices actuales en business_partners:';
  RAISE NOTICE '   - business_partners_pkey (PRIMARY KEY on id)';
  RAISE NOTICE '   - business_partners_codigo_key (UNIQUE on codigo_bp) ✅ Necesario';
  RAISE NOTICE '   - idx_bp_codigo (INDEX on codigo_bp) ❌ Redundante - Se eliminará';
END $$;

-- Eliminar índice redundante
DROP INDEX IF EXISTS idx_bp_codigo;

-- Verificación post-eliminación
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Contar índices restantes sobre codigo_bp
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE tablename = 'business_partners'
    AND indexdef LIKE '%codigo_bp%';

  RAISE NOTICE '✅ Índice redundante eliminado exitosamente';
  RAISE NOTICE '📊 Índices restantes sobre codigo_bp: %', index_count;
  RAISE NOTICE '💾 El constraint UNIQUE (business_partners_codigo_key) mantiene la optimización de búsquedas';
END $$;
