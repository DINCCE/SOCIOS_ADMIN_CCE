-- ============================================================================
-- Migración: Creación de tabla asignaciones_acciones
-- Descripción: Tabla para asignar acciones (títulos de valor) a business
--              partners con roles: dueño, titular, y beneficiarios
-- Autor: Sistema
-- Fecha: 2025-12-26
-- ============================================================================

-- 1. CREAR TABLA
-- ============================================================================
CREATE TABLE public.asignaciones_acciones (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accion_id UUID NOT NULL REFERENCES public.acciones(id) ON DELETE CASCADE,
  business_partner_id UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,

  -- Tipo de asignación
  tipo_asignacion TEXT NOT NULL
    CHECK (tipo_asignacion IN ('dueño', 'titular', 'beneficiario')),
  subtipo_beneficiario TEXT
    CHECK (subtipo_beneficiario IN ('conyuge', 'hijo/a', 'padre', 'madre', 'hermano/a', 'otro')),

  -- Códigos (00=dueño, 01=titular, 02+=beneficiarios)
  subcodigo TEXT NOT NULL CHECK (subcodigo ~ '^[0-9]{2}$'),
  codigo_completo TEXT NOT NULL,

  -- Vigencia temporal
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  es_vigente BOOLEAN GENERATED ALWAYS AS (fecha_fin IS NULL) STORED,

  -- Metadata
  precio_transaccion NUMERIC(15,2),
  organizacion_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  notas TEXT,
  atributos JSONB DEFAULT '{}'::jsonb,

  -- Auditoría estándar (patrón del proyecto)
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID REFERENCES auth.users(id),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por UUID REFERENCES auth.users(id),
  eliminado_en TIMESTAMPTZ,
  eliminado_por UUID REFERENCES auth.users(id),

  -- Validaciones
  CHECK (tipo_asignacion != 'beneficiario' OR subtipo_beneficiario IS NOT NULL),
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);


-- 2. COMENTARIOS EN TABLA Y COLUMNAS
-- ============================================================================
COMMENT ON TABLE public.asignaciones_acciones IS
  'Asignaciones de acciones a business partners con historial temporal. Soporta dueños, titulares y beneficiarios.';

COMMENT ON COLUMN public.asignaciones_acciones.codigo_completo IS
  'Código completo: codigo_accion + subcodigo (ej: 439801). Será mantenido automáticamente por trigger (pendiente).';

COMMENT ON COLUMN public.asignaciones_acciones.subcodigo IS
  'Subcódigo de 2 dígitos: 00=dueño, 01=titular, 02+=beneficiarios';

COMMENT ON COLUMN public.asignaciones_acciones.tipo_asignacion IS
  'Tipo de relación con la acción: dueño (00), titular (01), o beneficiario (02+)';

COMMENT ON COLUMN public.asignaciones_acciones.es_vigente IS
  'Columna generada: true si fecha_fin IS NULL';

COMMENT ON COLUMN public.asignaciones_acciones.subtipo_beneficiario IS
  'Clasificación de beneficiarios: conyuge, hijo/a, padre, madre, hermano/a, otro. Requerido si tipo_asignacion = beneficiario';


-- 3. ÍNDICES
-- ============================================================================

-- Índice 1: Unicidad de asignaciones vigentes (previene duplicados)
CREATE UNIQUE INDEX idx_asignaciones_unico_vigente
  ON asignaciones_acciones (accion_id, subcodigo, organizacion_id)
  WHERE eliminado_en IS NULL AND fecha_fin IS NULL;

-- Índice 2: Búsqueda por acción (query más frecuente)
CREATE INDEX idx_asignaciones_accion_vigente
  ON asignaciones_acciones (accion_id, es_vigente)
  WHERE eliminado_en IS NULL;

-- Índice 3: Búsqueda por business partner
CREATE INDEX idx_asignaciones_bp_vigente
  ON asignaciones_acciones (business_partner_id, tipo_asignacion)
  WHERE eliminado_en IS NULL;

-- Índice 4: Multi-tenancy (filtrado por organización)
CREATE INDEX idx_asignaciones_org
  ON asignaciones_acciones (organizacion_id)
  WHERE eliminado_en IS NULL;

-- Índice 5: Búsqueda por código completo (lookups directos)
CREATE INDEX idx_asignaciones_codigo
  ON asignaciones_acciones (codigo_completo)
  WHERE eliminado_en IS NULL;

-- Índice 6: Reportes y auditoría por fechas
CREATE INDEX idx_asignaciones_fechas
  ON asignaciones_acciones (fecha_inicio, fecha_fin)
  WHERE eliminado_en IS NULL;


-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.asignaciones_acciones ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden ver asignaciones
CREATE POLICY "Usuarios pueden ver asignaciones"
  ON public.asignaciones_acciones FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: usuarios autenticados pueden crear asignaciones
CREATE POLICY "Usuarios pueden crear asignaciones"
  ON public.asignaciones_acciones FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: usuarios autenticados pueden actualizar asignaciones
CREATE POLICY "Usuarios pueden actualizar asignaciones"
  ON public.asignaciones_acciones FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- NOTA: DELETE está bloqueado (usar soft delete con eliminado_en)


-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
-- Tabla creada: asignaciones_acciones
-- Índices creados: 6
-- RLS policies creadas: 3
--
-- PENDIENTE PARA PRÓXIMAS MIGRACIONES:
-- - Triggers (codigo_completo, validaciones, actualizar_timestamp)
-- - Funciones RPC (crear_asignacion_accion, transferir_accion, etc.)
-- - Vistas (v_asignaciones_vigentes, v_acciones_asignadas)
-- ============================================================================
