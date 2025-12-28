-- ==============================================================================
-- CREACIÓN DE TABLA MAESTRA DE ACCIONES
-- Definición de acciones/títulos de valor del club.
-- ==============================================================================

CREATE TABLE public.acciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    codigo_accion text UNIQUE NOT NULL,
    estado text NOT NULL DEFAULT 'disponible',
    
    -- Columnas de Auditoría Estandarizadas
    creado_en timestamptz DEFAULT now(),
    creado_por uuid REFERENCES auth.users(id),
    actualizado_en timestamptz DEFAULT now(),
    actualizado_por uuid REFERENCES auth.users(id),
    eliminado_en timestamptz,
    eliminado_por uuid REFERENCES auth.users(id),
    
    -- Restricciones
    CONSTRAINT acciones_codigo_formato_check CHECK (codigo_accion ~ '^[0-9]{4}$'),
    CONSTRAINT acciones_estado_check CHECK (estado IN ('disponible', 'asignada', 'arrendada', 'bloqueada', 'inactiva'))
);

-- Habilitar RLS
ALTER TABLE public.acciones ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS Básicas (Multi-tenancy)
CREATE POLICY "Usuarios pueden ver acciones de su organización" 
ON public.acciones FOR SELECT 
USING (organizacion_id IN (SELECT id FROM organizations));

-- Trigger para actualizado_en
CREATE TRIGGER actualizar_acciones_timestamp
    BEFORE UPDATE ON public.acciones
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_timestamp();

-- Comentarios de Metadatos
COMMENT ON TABLE public.acciones IS 'Tabla maestra de acciones del club (títulos de valor). No contiene dueños directamente.';
COMMENT ON COLUMN public.acciones.codigo_accion IS 'Código numérico único de 4 dígitos que identifica la acción.';
COMMENT ON COLUMN public.acciones.estado IS 'Estado actual de la acción: disponible, asignada, arrendada, bloqueada o inactiva.';

-- Datos de Ejemplo
-- Usando el ID de la organización encontrada: a283b421-8de7-4174-baa6-24c59c0e1c26
INSERT INTO public.acciones (organizacion_id, codigo_accion, estado)
VALUES 
    ('a283b421-8de7-4174-baa6-24c59c0e1c26', '1001', 'disponible'),
    ('a283b421-8de7-4174-baa6-24c59c0e1c26', '1002', 'disponible'),
    ('a283b421-8de7-4174-baa6-24c59c0e1c26', '1003', 'asignada'),
    ('a283b421-8de7-4174-baa6-24c59c0e1c26', '1004', 'bloqueada'),
    ('a283b421-8de7-4174-baa6-24c59c0e1c26', '1005', 'disponible');
