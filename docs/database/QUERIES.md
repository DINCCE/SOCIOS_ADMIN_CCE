# Database Queries - Ejemplos y Patrones

Este documento contiene ejemplos de queries SQL comunes organizados por caso de uso.

## Índice

- [Inserción de Datos](#inserción-de-datos)
- [Consultas Básicas](#consultas-básicas)
- [Consultas Avanzadas](#consultas-avanzadas)
- [Relaciones entre Business Partners](#relaciones-entre-business-partners)
- [Soft Delete](#soft-delete)
- [Búsquedas JSONB](#búsquedas-jsonb)
- [Agregaciones y Estadísticas](#agregaciones-y-estadísticas)
- [Validaciones](#validaciones)
- [Transacciones Complejas](#transacciones-complejas)

---

## Inserción de Datos

### Crear una Persona

```sql
-- Transacción completa para crear persona
BEGIN;

-- 1. Insertar en business_partners
INSERT INTO business_partners (
  organizacion_id,
  tipo_actor,
  codigo_interno,
  estado,
  atributos
)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- UUID de la organización
  'persona',
  'BP-2024-001',
  'activo',
  '{"tags": ["nuevo", "cliente"]}'::jsonb
)
RETURNING id;
-- Resultado: e.g., 'bp-uuid-12345'

-- 2. Insertar en personas (usar el UUID del paso anterior)
INSERT INTO personas (
  id,
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  fecha_nacimiento,
  genero,
  telefono,
  email,
  direccion,
  atributos
)
VALUES (
  'bp-uuid-12345',  -- Mismo UUID del business_partner
  'Juan Carlos',
  'Pérez González',
  'CC',
  '1234567890',
  '1990-05-15',
  'masculino',
  '+57 300 123 4567',
  'juan.perez@example.com',
  'Calle 123 # 45-67, Bogotá',
  '{"profesion": "Ingeniero", "estado_civil": "soltero"}'::jsonb
);

COMMIT;
```

### Crear una Persona con Contacto de Emergencia

```sql
BEGIN;

-- 1. Primero crear la persona que será el contacto de emergencia
-- (repetir pasos de "Crear una Persona")

-- 2. Crear la persona principal con referencia al contacto
INSERT INTO business_partners (organizacion_id, tipo_actor, estado)
VALUES ('org-uuid', 'persona', 'activo')
RETURNING id;
-- Guardar este id como 'persona_principal_id'

INSERT INTO personas (
  id,
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  contacto_emergencia_id  -- ← Referencia al contacto
)
VALUES (
  'persona_principal_id',
  'María',
  'López',
  'CC',
  '9876543210',
  'persona_contacto_id'  -- UUID de la persona contacto de emergencia
);

COMMIT;
```

### Crear una Empresa

```sql
BEGIN;

-- 1. Insertar en business_partners
INSERT INTO business_partners (
  organizacion_id,
  tipo_actor,
  codigo_interno,
  estado
)
VALUES (
  'org-uuid',
  'empresa',
  'EMP-2024-001',
  'activo'
)
RETURNING id;
-- Resultado: 'empresa-bp-uuid'

-- 2. Calcular dígito de verificación del NIT
SELECT calcular_digito_verificacion_nit('900123456');
-- Resultado: '8'

-- 3. Insertar en empresas
INSERT INTO empresas (
  id,
  razon_social,
  nombre_comercial,
  nit,
  digito_verificacion,
  tipo_empresa,
  fecha_constitucion,
  telefono,
  email,
  direccion,
  representante_legal_id,
  atributos
)
VALUES (
  'empresa-bp-uuid',
  'Tecnología Avanzada S.A.S.',
  'TechAdvance',
  '900123456',
  '8',  -- DV calculado
  'SAS',
  '2020-01-15',
  '+57 1 234 5678',
  'info@techadvance.com',
  'Carrera 7 # 71-21, Bogotá',
  'persona-uuid-representante',  -- UUID de una persona existente
  '{"sector": "Tecnología", "empleados": 50}'::jsonb
);

COMMIT;
```

---

## Consultas Básicas

### Buscar Persona por Documento

```sql
-- Usando la vista completa (recomendado)
SELECT * FROM v_personas_completa
WHERE numero_documento = '1234567890'
  AND bp_eliminado_en IS NULL;

-- Sin vista (manual)
SELECT
  p.*,
  bp.estado,
  bp.codigo_interno,
  o.nombre AS organizacion_nombre
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
WHERE p.numero_documento = '1234567890'
  AND p.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;
```

### Buscar Empresa por NIT

```sql
-- Usando la vista completa (recomendado)
SELECT * FROM v_empresas_completa
WHERE nit = '900123456'
  AND bp_eliminado_en IS NULL;

-- Sin vista
SELECT
  e.*,
  bp.estado,
  bp.codigo_interno,
  o.nombre AS organizacion_nombre,
  (p.nombres || ' ' || p.apellidos) AS nombre_representante
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas p ON e.representante_legal_id = p.id
WHERE e.nit = '900123456'
  AND e.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;
```

### Listar Todas las Personas de una Organización

```sql
SELECT
  p.numero_documento,
  p.nombres || ' ' || p.apellidos AS nombre_completo,
  p.email,
  p.telefono,
  bp.estado,
  bp.codigo_interno
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
WHERE bp.organizacion_id = 'org-uuid'
  AND p.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL
ORDER BY p.apellidos, p.nombres;
```

### Listar Todas las Empresas de una Organización

```sql
SELECT
  e.nit || '-' || e.digito_verificacion AS nit_completo,
  e.razon_social,
  e.nombre_comercial,
  e.email,
  bp.estado,
  bp.codigo_interno
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
WHERE bp.organizacion_id = 'org-uuid'
  AND e.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL
ORDER BY e.razon_social;
```

### Buscar Personas por Nombre (case-insensitive)

```sql
SELECT
  numero_documento,
  nombre_completo,
  email,
  telefono,
  estado
FROM v_personas_completa
WHERE nombre_completo ILIKE '%juan%'
  AND bp_eliminado_en IS NULL
ORDER BY apellidos, nombres;
```

### Buscar Cualquier Actor (Persona o Empresa)

```sql
-- Usando la vista unificada
SELECT
  tipo_actor,
  nombre,
  identificacion,
  email,
  telefono,
  estado
FROM v_actores_unificados
WHERE nombre ILIKE '%tech%'
   OR identificacion = '1234567890'
  AND eliminado_en IS NULL
ORDER BY nombre;
```

---

## Consultas Avanzadas

### Personas con sus Contactos de Emergencia

```sql
SELECT
  p.numero_documento,
  p.nombres || ' ' || p.apellidos AS nombre_persona,
  p.telefono AS telefono_persona,
  ce.numero_documento AS doc_contacto,
  ce.nombres || ' ' || ce.apellidos AS nombre_contacto,
  ce.telefono AS telefono_contacto
FROM personas p
LEFT JOIN personas ce ON p.contacto_emergencia_id = ce.id
WHERE p.eliminado_en IS NULL
  AND bp.organizacion_id = 'org-uuid'
ORDER BY p.apellidos;
```

### Empresas con sus Representantes Legales

```sql
SELECT
  e.nit || '-' || e.digito_verificacion AS nit_completo,
  e.razon_social,
  e.email AS email_empresa,
  p.numero_documento AS doc_representante,
  p.nombres || ' ' || p.apellidos AS nombre_representante,
  p.email AS email_representante,
  p.telefono AS telefono_representante
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
LEFT JOIN personas p ON e.representante_legal_id = p.id
WHERE e.eliminado_en IS NULL
  AND bp.organizacion_id = 'org-uuid'
ORDER BY e.razon_social;
```

### Actores por Estado (Activos, Inactivos, Suspendidos)

```sql
-- Contar actores por estado
SELECT
  bp.estado,
  bp.tipo_actor,
  COUNT(*) AS total
FROM business_partners bp
WHERE bp.organizacion_id = 'org-uuid'
  AND bp.eliminado_en IS NULL
GROUP BY bp.estado, bp.tipo_actor
ORDER BY bp.estado, bp.tipo_actor;
```

### Personas sin Contacto de Emergencia

```sql
SELECT
  p.numero_documento,
  p.nombres || ' ' || p.apellidos AS nombre_completo,
  p.telefono,
  p.email
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
WHERE p.contacto_emergencia_id IS NULL
  AND p.eliminado_en IS NULL
  AND bp.organizacion_id = 'org-uuid'
ORDER BY p.apellidos;
```

### Empresas sin Representante Legal

```sql
SELECT
  e.nit || '-' || e.digito_verificacion AS nit_completo,
  e.razon_social,
  e.email,
  e.telefono
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
WHERE e.representante_legal_id IS NULL
  AND e.eliminado_en IS NULL
  AND bp.organizacion_id = 'org-uuid'
ORDER BY e.razon_social;
```

---

## Relaciones entre Business Partners

### Inserción de Relaciones

#### Crear Relación Familiar (Padre-Hijo)

```sql
INSERT INTO bp_relaciones (
  organizacion_id,
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  rol_origen,
  rol_destino,
  atributos,
  fecha_inicio,
  es_bidireccional,
  notas
)
VALUES (
  'org-uuid',
  'persona-padre-uuid',
  'persona-hijo-uuid',
  'familiar',
  'Padre',
  'Hijo',
  jsonb_build_object(
    'parentesco', 'Padre',
    'linea', 'paterna',
    'convive', true
  ),
  '1990-05-15',  -- Fecha de nacimiento del hijo
  true,  -- Bidireccional: permite consultar desde ambos lados
  'Relación padre-hijo, conviven en la misma ciudad'
);
```

#### Crear Relación Laboral (Empleado-Empresa)

```sql
INSERT INTO bp_relaciones (
  organizacion_id,
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  rol_origen,
  rol_destino,
  atributos,
  fecha_inicio,
  es_bidireccional
)
VALUES (
  'org-uuid',
  'persona-empleado-uuid',
  'empresa-empleador-uuid',
  'laboral',
  'Empleado',
  'Empleador',
  jsonb_build_object(
    'cargo', 'Desarrollador Senior',
    'departamento', 'Ingeniería',
    'tipo_contrato', 'indefinido',
    'salario_rango', 'alto',
    'activo', true
  ),
  '2020-01-15',
  false  -- No bidireccional: la empresa no es "empleado" de la persona
);
```

#### Crear Relación Bidireccional (Hermanos)

```sql
-- Solo se inserta UNA vez, la vista genera la relación inversa automáticamente
INSERT INTO bp_relaciones (
  organizacion_id,
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  rol_origen,
  rol_destino,
  atributos,
  fecha_inicio,
  es_bidireccional
)
VALUES (
  'org-uuid',
  'persona-a-uuid',
  'persona-b-uuid',
  'familiar',
  'Hermano',
  'Hermano',
  jsonb_build_object(
    'parentesco', 'Hermano',
    'linea', 'paterna'
  ),
  NULL,  -- Fecha inicio opcional
  true   -- ¡IMPORTANTE! Genera registro inverso automático en la vista
);
```

### Consultas de Relaciones

#### Ver Todas las Relaciones de un Business Partner

```sql
-- Opción 1: Solo relaciones donde es ORIGEN
SELECT
  r.id,
  r.tipo_relacion,
  r.rol_origen,
  r.rol_destino,
  r.fecha_inicio,
  r.fecha_fin,
  r.es_actual,
  -- Datos del BP destino
  bp_dest.tipo_actor AS tipo_destino,
  CASE
    WHEN bp_dest.tipo_actor = 'persona' THEN p.nombres || ' ' || p.apellidos
    WHEN bp_dest.tipo_actor = 'empresa' THEN e.razon_social
  END AS nombre_destino
FROM bp_relaciones r
INNER JOIN business_partners bp_dest ON r.bp_destino_id = bp_dest.id
LEFT JOIN personas p ON bp_dest.id = p.id
LEFT JOIN empresas e ON bp_dest.id = e.id
WHERE r.bp_origen_id = 'bp-uuid'
  AND r.eliminado_en IS NULL
ORDER BY r.es_actual DESC, r.fecha_inicio DESC;

-- Opción 2: TODAS las relaciones (dirección agnóstica) usando vista bidireccional
SELECT
  vr.tipo_relacion,
  vr.rol_origen,
  vr.rol_destino,
  vr.fecha_inicio,
  vr.fecha_fin,
  vr.es_actual,
  vr.direccion,  -- 'directo' o 'inverso'
  -- Datos del BP destino
  bp_dest.tipo_actor AS tipo_destino,
  CASE
    WHEN bp_dest.tipo_actor = 'persona' THEN p.nombres || ' ' || p.apellidos
    WHEN bp_dest.tipo_actor = 'empresa' THEN e.razon_social
  END AS nombre_destino
FROM v_relaciones_bidireccionales vr
INNER JOIN business_partners bp_dest ON vr.bp_destino_id = bp_dest.id
LEFT JOIN personas p ON bp_dest.id = p.id
LEFT JOIN empresas e ON bp_dest.id = e.id
WHERE vr.bp_origen_id = 'bp-uuid'
ORDER BY vr.es_actual DESC, vr.fecha_inicio DESC;
```

#### Ver Relaciones Familiares de una Persona

```sql
SELECT
  r.rol_origen,
  r.rol_destino,
  r.atributos->>'parentesco' AS parentesco,
  r.atributos->>'linea' AS linea,
  r.fecha_inicio,
  r.es_actual,
  -- Datos del familiar
  p_dest.numero_documento,
  p_dest.nombres || ' ' || p_dest.apellidos AS nombre_familiar,
  p_dest.telefono,
  p_dest.email
FROM bp_relaciones r
INNER JOIN personas p_dest ON r.bp_destino_id = p_dest.id
WHERE r.bp_origen_id = 'persona-uuid'
  AND r.tipo_relacion = 'familiar'
  AND r.eliminado_en IS NULL
ORDER BY
  CASE r.rol_destino
    WHEN 'Cónyuge' THEN 1
    WHEN 'Hijo' THEN 2
    WHEN 'Hija' THEN 3
    WHEN 'Padre' THEN 4
    WHEN 'Madre' THEN 5
    ELSE 6
  END;
```

#### Ver Empleados de una Empresa

```sql
SELECT
  r.fecha_inicio,
  r.fecha_fin,
  r.es_actual,
  r.atributos->>'cargo' AS cargo,
  r.atributos->>'departamento' AS departamento,
  r.atributos->>'tipo_contrato' AS tipo_contrato,
  -- Datos del empleado
  p.numero_documento,
  p.nombres || ' ' || p.apellidos AS nombre_empleado,
  p.telefono,
  p.email
FROM bp_relaciones r
INNER JOIN personas p ON r.bp_origen_id = p.id
WHERE r.bp_destino_id = 'empresa-uuid'
  AND r.tipo_relacion = 'laboral'
  AND r.rol_destino = 'Empleador'
  AND r.eliminado_en IS NULL
ORDER BY r.es_actual DESC, r.fecha_inicio DESC;
```

#### Historial Laboral Completo de una Persona

```sql
SELECT
  e.razon_social AS empresa,
  e.nit || '-' || e.digito_verificacion AS nit_empresa,
  r.fecha_inicio,
  r.fecha_fin,
  r.es_actual,
  CASE
    WHEN r.fecha_fin IS NULL THEN 'Actual'
    ELSE EXTRACT(YEAR FROM AGE(r.fecha_fin, r.fecha_inicio))::TEXT || ' años ' ||
         EXTRACT(MONTH FROM AGE(r.fecha_fin, r.fecha_inicio))::TEXT || ' meses'
  END AS duracion,
  r.atributos->>'cargo' AS cargo,
  r.atributos->>'departamento' AS departamento,
  r.atributos->>'tipo_contrato' AS tipo_contrato
FROM bp_relaciones r
INNER JOIN empresas e ON r.bp_destino_id = e.id
WHERE r.bp_origen_id = 'persona-uuid'
  AND r.tipo_relacion = 'laboral'
  AND r.eliminado_en IS NULL
ORDER BY
  r.es_actual DESC,
  r.fecha_inicio DESC;
```

#### Ver Relaciones Bidireccionales (Hermanos, Cónyuges, etc.)

```sql
-- Esta query aprovecha la vista v_relaciones_bidireccionales
-- para mostrar relaciones simétricas como "Hermano ↔ Hermano"

SELECT
  vr.direccion,  -- 'directo' o 'inverso'
  CASE
    WHEN vr.direccion = 'directo' THEN 'Persona A → Persona B'
    ELSE 'Persona B → Persona A (auto-generado)'
  END AS tipo_registro,
  p_origen.nombres || ' ' || p_origen.apellidos AS persona_origen,
  vr.rol_origen,
  p_destino.nombres || ' ' || p_destino.apellidos AS persona_destino,
  vr.rol_destino,
  vr.atributos->>'parentesco' AS parentesco
FROM v_relaciones_bidireccionales vr
INNER JOIN personas p_origen ON vr.bp_origen_id = p_origen.id
INNER JOIN personas p_destino ON vr.bp_destino_id = p_destino.id
WHERE vr.es_bidireccional = true
  AND vr.tipo_relacion = 'familiar'
  AND vr.bp_origen_id = 'persona-a-uuid'
ORDER BY vr.direccion;

-- Resultado esperado (2 filas):
-- directo  | Persona A → Persona B                | Juan Pérez    | Hermano | Pedro Pérez   | Hermano | Hermano
-- inverso  | Persona B → Persona A (auto-generado)| Pedro Pérez   | Hermano | Juan Pérez    | Hermano | Hermano
```

### Modificación de Relaciones

#### Finalizar Relación Laboral (Mantener Historial)

```sql
-- NO eliminar, sino marcar fecha_fin para mantener historial
UPDATE bp_relaciones
SET
  fecha_fin = CURRENT_DATE,
  atributos = atributos || jsonb_build_object('activo', false),
  notas = COALESCE(notas, '') || E'\n' || 'Finalizada el ' || CURRENT_DATE::TEXT,
  actualizado_en = NOW()
WHERE id = 'relacion-uuid'
  AND eliminado_en IS NULL;

-- La columna GENERATED 'es_actual' se actualiza automáticamente a FALSE
```

#### Soft Delete de una Relación

```sql
-- Soft delete: marcar como eliminado sin borrar datos
UPDATE bp_relaciones
SET
  eliminado_en = NOW(),
  actualizado_en = NOW()
WHERE id = 'relacion-uuid';

-- Para recuperar:
UPDATE bp_relaciones
SET
  eliminado_en = NULL,
  actualizado_en = NOW()
WHERE id = 'relacion-uuid';
```

### Consultas Avanzadas de Relaciones

#### Árbol Genealógico (Padres → Hijos)

```sql
WITH RECURSIVE arbol_familiar AS (
  -- Caso base: persona raíz
  SELECT
    r.bp_origen_id,
    r.bp_destino_id,
    r.rol_origen,
    r.rol_destino,
    p.nombres || ' ' || p.apellidos AS nombre,
    1 AS nivel
  FROM bp_relaciones r
  INNER JOIN personas p ON r.bp_origen_id = p.id
  WHERE r.bp_origen_id = 'persona-raiz-uuid'
    AND r.tipo_relacion = 'familiar'
    AND r.rol_destino IN ('Hijo', 'Hija')
    AND r.eliminado_en IS NULL

  UNION ALL

  -- Caso recursivo: hijos de cada nivel
  SELECT
    r.bp_origen_id,
    r.bp_destino_id,
    r.rol_origen,
    r.rol_destino,
    p.nombres || ' ' || p.apellidos AS nombre,
    af.nivel + 1
  FROM bp_relaciones r
  INNER JOIN arbol_familiar af ON r.bp_origen_id = af.bp_destino_id
  INNER JOIN personas p ON r.bp_destino_id = p.id
  WHERE r.tipo_relacion = 'familiar'
    AND r.rol_destino IN ('Hijo', 'Hija')
    AND r.eliminado_en IS NULL
)
SELECT
  nivel,
  REPEAT('  ', nivel - 1) || '└─ ' || nombre AS arbol,
  rol_origen,
  rol_destino
FROM arbol_familiar
ORDER BY nivel, nombre;
```

#### Empresas donde Trabajan Miembros de una Familia

```sql
-- Encontrar todas las empresas donde trabajan personas relacionadas familiarmente
SELECT DISTINCT
  e.razon_social AS empresa,
  e.nit,
  p.nombres || ' ' || p.apellidos AS empleado,
  rel_lab.atributos->>'cargo' AS cargo,
  rel_fam.rol_origen AS parentesco_con_referencia
FROM bp_relaciones rel_fam
-- Join para obtener relaciones laborales de familiares
INNER JOIN bp_relaciones rel_lab ON rel_fam.bp_destino_id = rel_lab.bp_origen_id
INNER JOIN empresas e ON rel_lab.bp_destino_id = e.id
INNER JOIN personas p ON rel_lab.bp_origen_id = p.id
WHERE rel_fam.bp_origen_id = 'persona-referencia-uuid'
  AND rel_fam.tipo_relacion = 'familiar'
  AND rel_lab.tipo_relacion = 'laboral'
  AND rel_lab.es_actual = true
  AND rel_fam.eliminado_en IS NULL
  AND rel_lab.eliminado_en IS NULL
ORDER BY e.razon_social, p.apellidos;
```

#### Estadísticas de Relaciones por Tipo

```sql
SELECT
  tipo_relacion,
  COUNT(*) AS total_relaciones,
  COUNT(*) FILTER (WHERE es_actual = true) AS relaciones_activas,
  COUNT(*) FILTER (WHERE es_actual = false) AS relaciones_finalizadas,
  COUNT(*) FILTER (WHERE es_bidireccional = true) AS bidireccionales,
  ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(fecha_fin, NOW()) - fecha_inicio)) / 86400), 0)::INTEGER AS duracion_promedio_dias
FROM bp_relaciones
WHERE eliminado_en IS NULL
  AND fecha_inicio IS NOT NULL
GROUP BY tipo_relacion
ORDER BY total_relaciones DESC;
```

#### Validar Integridad: Relaciones Familiares Solo Entre Personas

```sql
-- Query de validación: Detectar violaciones (no debería retornar filas)
SELECT
  r.id,
  r.tipo_relacion,
  bp_origen.tipo_actor AS tipo_origen,
  bp_destino.tipo_actor AS tipo_destino,
  'ERROR: Relación familiar con empresa' AS problema
FROM bp_relaciones r
INNER JOIN business_partners bp_origen ON r.bp_origen_id = bp_origen.id
INNER JOIN business_partners bp_destino ON r.bp_destino_id = bp_destino.id
WHERE r.tipo_relacion = 'familiar'
  AND (bp_origen.tipo_actor != 'persona' OR bp_destino.tipo_actor != 'persona')
  AND r.eliminado_en IS NULL;
```

#### Validar Integridad: Relaciones Laborales Persona → Empresa

```sql
-- Query de validación: Detectar violaciones
SELECT
  r.id,
  r.tipo_relacion,
  bp_origen.tipo_actor AS tipo_origen,
  bp_destino.tipo_actor AS tipo_destino,
  CASE
    WHEN bp_origen.tipo_actor != 'persona' THEN 'ERROR: Origen debe ser persona'
    WHEN bp_destino.tipo_actor != 'empresa' THEN 'ERROR: Destino debe ser empresa'
  END AS problema
FROM bp_relaciones r
INNER JOIN business_partners bp_origen ON r.bp_origen_id = bp_origen.id
INNER JOIN business_partners bp_destino ON r.bp_destino_id = bp_destino.id
WHERE r.tipo_relacion = 'laboral'
  AND (bp_origen.tipo_actor != 'persona' OR bp_destino.tipo_actor != 'empresa')
  AND r.eliminado_en IS NULL;
```

#### Detectar Relaciones Duplicadas Activas

```sql
-- No debería retornar filas gracias al índice UNIQUE
SELECT
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  COUNT(*) AS duplicados,
  ARRAY_AGG(id) AS ids_duplicados
FROM bp_relaciones
WHERE eliminado_en IS NULL
  AND es_actual = true
GROUP BY bp_origen_id, bp_destino_id, tipo_relacion
HAVING COUNT(*) > 1;
```

### Ejemplo de Uso desde Frontend

#### Server Action: Crear Relación Laboral

```typescript
// app/actions/relaciones.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function crearRelacionLaboral(data: {
  organizacion_id: string
  empleado_id: string
  empresa_id: string
  cargo: string
  departamento: string
  fecha_inicio: string
}) {
  const supabase = await createClient()

  const { data: relacion, error } = await supabase
    .from('bp_relaciones')
    .insert({
      organizacion_id: data.organizacion_id,
      bp_origen_id: data.empleado_id,
      bp_destino_id: data.empresa_id,
      tipo_relacion: 'laboral',
      rol_origen: 'Empleado',
      rol_destino: 'Empleador',
      atributos: {
        cargo: data.cargo,
        departamento: data.departamento,
        tipo_contrato: 'indefinido',
        activo: true,
      },
      fecha_inicio: data.fecha_inicio,
      es_bidireccional: false,
    })
    .select()
    .single()

  if (error) throw error
  return relacion
}
```

#### Client Component: Listar Empleados

```typescript
// components/lista-empleados.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

export function ListaEmpleados({ empresaId }: { empresaId: string }) {
  const { data: empleados, isLoading } = useQuery({
    queryKey: ['empleados', empresaId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bp_relaciones')
        .select(`
          id,
          fecha_inicio,
          fecha_fin,
          es_actual,
          atributos,
          personas:bp_origen_id (
            numero_documento,
            nombres,
            apellidos,
            telefono,
            email
          )
        `)
        .eq('bp_destino_id', empresaId)
        .eq('tipo_relacion', 'laboral')
        .is('eliminado_en', null)
        .order('es_actual', { ascending: false })
        .order('fecha_inicio', { ascending: false })

      if (error) throw error
      return data
    },
  })

  // ... render UI
}
```

---

## Soft Delete

### Eliminar (Soft Delete) una Persona

```sql
-- El soft delete se hace en ambas tablas (personas y business_partners)
BEGIN;

UPDATE personas
SET eliminado_en = NOW()
WHERE id = 'persona-uuid';

UPDATE business_partners
SET eliminado_en = NOW()
WHERE id = 'persona-uuid';

COMMIT;
```

### Eliminar (Soft Delete) una Empresa

```sql
BEGIN;

UPDATE empresas
SET eliminado_en = NOW()
WHERE id = 'empresa-uuid';

UPDATE business_partners
SET eliminado_en = NOW()
WHERE id = 'empresa-uuid';

COMMIT;
```

### Recuperar Registro Eliminado

```sql
-- Recuperar persona eliminada
BEGIN;

UPDATE personas
SET eliminado_en = NULL
WHERE id = 'persona-uuid';

UPDATE business_partners
SET eliminado_en = NULL
WHERE id = 'persona-uuid';

COMMIT;
```

### Listar Registros Eliminados

```sql
-- Personas eliminadas
SELECT
  p.numero_documento,
  p.nombres || ' ' || p.apellidos AS nombre_completo,
  bp.eliminado_en,
  bp.estado AS estado_anterior
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
WHERE bp.eliminado_en IS NOT NULL
  AND bp.organizacion_id = 'org-uuid'
ORDER BY bp.eliminado_en DESC;
```

### Purgar Registros Eliminados (Hard Delete)

⚠️ **PRECAUCIÓN:** Esto elimina permanentemente los datos.

```sql
-- Eliminar permanentemente registros soft-deleted hace más de 1 año
BEGIN;

-- Primero eliminar las especializaciones (por CASCADE se eliminará business_partners)
DELETE FROM personas
WHERE eliminado_en < NOW() - INTERVAL '1 year';

DELETE FROM empresas
WHERE eliminado_en < NOW() - INTERVAL '1 year';

COMMIT;
```

---

## Búsquedas JSONB

### Buscar por Tag en Atributos de Business Partner

```sql
SELECT
  bp.id,
  bp.tipo_actor,
  bp.codigo_interno,
  bp.atributos
FROM business_partners bp
WHERE bp.atributos @> '{"tags": ["vip"]}'::jsonb
  AND bp.eliminado_en IS NULL;
```

### Buscar Personas por Profesión

```sql
SELECT
  p.numero_documento,
  p.nombres || ' ' || p.apellidos AS nombre_completo,
  p.atributos->>'profesion' AS profesion
FROM personas p
WHERE p.atributos->>'profesion' = 'Ingeniero'
  AND p.eliminado_en IS NULL;
```

### Buscar Empresas por Sector Económico

```sql
SELECT
  e.razon_social,
  e.nit,
  e.atributos->>'sector_economico' AS sector
FROM empresas e
WHERE e.atributos->>'sector_economico' = 'Tecnología'
  AND e.eliminado_en IS NULL;
```

### Buscar por Campo Anidado en JSONB

```sql
-- Buscar empresas con certificación ISO 9001
SELECT
  e.razon_social,
  e.atributos->'certificaciones' AS certificaciones
FROM empresas e
WHERE e.atributos->'certificaciones' @> '["ISO 9001"]'::jsonb
  AND e.eliminado_en IS NULL;
```

### Actualizar Campo JSONB (Preservando Otros Campos)

```sql
-- Agregar nuevo campo sin perder los existentes
UPDATE personas
SET atributos = atributos || '{"nivel_educativo": "Universitario"}'::jsonb
WHERE id = 'persona-uuid';

-- Agregar elemento a un array en JSONB
UPDATE business_partners
SET atributos = jsonb_set(
  atributos,
  '{tags}',
  (atributos->'tags') || '["preferencial"]'::jsonb
)
WHERE id = 'bp-uuid';
```

---

## Agregaciones y Estadísticas

### Contar Actores por Tipo y Estado

```sql
SELECT
  tipo_actor,
  estado,
  COUNT(*) AS total
FROM business_partners
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
GROUP BY tipo_actor, estado
ORDER BY tipo_actor, estado;
```

### Distribución por Tipo de Documento

```sql
SELECT
  tipo_documento,
  COUNT(*) AS total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS porcentaje
FROM personas
WHERE eliminado_en IS NULL
GROUP BY tipo_documento
ORDER BY total DESC;
```

### Distribución por Tipo de Empresa

```sql
SELECT
  tipo_empresa,
  COUNT(*) AS total
FROM empresas
WHERE eliminado_en IS NULL
GROUP BY tipo_empresa
ORDER BY total DESC;
```

### Edad Promedio de Personas (si hay fecha de nacimiento)

```sql
SELECT
  AVG(EXTRACT(YEAR FROM AGE(fecha_nacimiento)))::INTEGER AS edad_promedio,
  MIN(EXTRACT(YEAR FROM AGE(fecha_nacimiento)))::INTEGER AS edad_minima,
  MAX(EXTRACT(YEAR FROM AGE(fecha_nacimiento)))::INTEGER AS edad_maxima
FROM personas
WHERE fecha_nacimiento IS NOT NULL
  AND eliminado_en IS NULL;
```

### Top 10 Empresas Más Antiguas

```sql
SELECT
  razon_social,
  nit || '-' || digito_verificacion AS nit_completo,
  fecha_constitucion,
  EXTRACT(YEAR FROM AGE(fecha_constitucion))::INTEGER AS antiguedad_anos
FROM empresas
WHERE fecha_constitucion IS NOT NULL
  AND eliminado_en IS NULL
ORDER BY fecha_constitucion ASC
LIMIT 10;
```

### Resumen General de la Organización

```sql
SELECT
  (SELECT COUNT(*) FROM business_partners WHERE organizacion_id = 'org-uuid' AND eliminado_en IS NULL) AS total_actores,
  (SELECT COUNT(*) FROM personas p INNER JOIN business_partners bp ON p.id = bp.id WHERE bp.organizacion_id = 'org-uuid' AND p.eliminado_en IS NULL) AS total_personas,
  (SELECT COUNT(*) FROM empresas e INNER JOIN business_partners bp ON e.id = bp.id WHERE bp.organizacion_id = 'org-uuid' AND e.eliminado_en IS NULL) AS total_empresas,
  (SELECT COUNT(*) FROM business_partners WHERE organizacion_id = 'org-uuid' AND estado = 'activo' AND eliminado_en IS NULL) AS activos,
  (SELECT COUNT(*) FROM business_partners WHERE organizacion_id = 'org-uuid' AND estado = 'inactivo' AND eliminado_en IS NULL) AS inactivos;
```

---

## Validaciones

### Validar Consistencia de Tipo Actor

```sql
-- Verificar que todos los business_partners tengan su especialización
SELECT
  bp.id,
  bp.tipo_actor,
  CASE
    WHEN bp.tipo_actor = 'persona' AND p.id IS NULL THEN 'FALTA PERSONA'
    WHEN bp.tipo_actor = 'empresa' AND e.id IS NULL THEN 'FALTA EMPRESA'
    ELSE 'OK'
  END AS validacion
FROM business_partners bp
LEFT JOIN personas p ON bp.id = p.id AND bp.tipo_actor = 'persona'
LEFT JOIN empresas e ON bp.id = e.id AND bp.tipo_actor = 'empresa'
WHERE bp.eliminado_en IS NULL
  AND (
    (bp.tipo_actor = 'persona' AND p.id IS NULL) OR
    (bp.tipo_actor = 'empresa' AND e.id IS NULL)
  );
```

### Validar NITs con Dígito Verificador Incorrecto

```sql
SELECT
  nit,
  digito_verificacion AS dv_actual,
  calcular_digito_verificacion_nit(nit) AS dv_correcto,
  CASE
    WHEN digito_verificacion = calcular_digito_verificacion_nit(nit)
    THEN 'VÁLIDO'
    ELSE 'INVÁLIDO'
  END AS estado
FROM empresas
WHERE eliminado_en IS NULL
  AND digito_verificacion != calcular_digito_verificacion_nit(nit);
```

### Validar Documentos Duplicados

```sql
-- Verificar si hay documentos duplicados (no debería haber por el UNIQUE constraint)
SELECT
  numero_documento,
  COUNT(*) AS veces_usado,
  ARRAY_AGG(id) AS ids
FROM personas
WHERE eliminado_en IS NULL
GROUP BY numero_documento
HAVING COUNT(*) > 1;
```

### Validar NITs Duplicados

```sql
SELECT
  nit,
  COUNT(*) AS veces_usado,
  ARRAY_AGG(id) AS ids
FROM empresas
WHERE eliminado_en IS NULL
GROUP BY nit
HAVING COUNT(*) > 1;
```

### Validar Contactos de Emergencia Circulares

```sql
-- Detectar si una persona es su propio contacto de emergencia
SELECT
  id,
  nombres || ' ' || apellidos AS nombre,
  contacto_emergencia_id
FROM personas
WHERE id = contacto_emergencia_id
  AND eliminado_en IS NULL;
```

---

## Transacciones Complejas

### Transferir Representante Legal de una Empresa a Otra

```sql
BEGIN;

-- Cambiar representante legal de una empresa
UPDATE empresas
SET
  representante_legal_id = 'nueva-persona-uuid',
  actualizado_en = NOW()
WHERE id = 'empresa-uuid';

COMMIT;
```

### Cambiar Estado de Múltiples Actores

```sql
BEGIN;

-- Cambiar a inactivo todos los actores de una organización
UPDATE business_partners
SET
  estado = 'inactivo',
  actualizado_en = NOW()
WHERE organizacion_id = 'org-uuid'
  AND estado = 'activo'
  AND eliminado_en IS NULL;

COMMIT;
```

### Migrar Actor de una Organización a Otra

⚠️ **PRECAUCIÓN:** Esto cambia la organización del actor.

```sql
BEGIN;

-- Cambiar organización de un business partner y su especialización
UPDATE business_partners
SET
  organizacion_id = 'nueva-org-uuid',
  actualizado_en = NOW()
WHERE id = 'actor-uuid';

-- El cambio se propaga automáticamente a personas/empresas por las FK

COMMIT;
```

### Crear Empresa con Representante Legal en una Sola Transacción

```sql
BEGIN;

-- 1. Crear representante legal (persona)
INSERT INTO business_partners (organizacion_id, tipo_actor, estado)
VALUES ('org-uuid', 'persona', 'activo')
RETURNING id INTO representante_id;

INSERT INTO personas (
  id, nombres, apellidos, tipo_documento, numero_documento
)
VALUES (
  representante_id,
  'Carlos',
  'Ramírez',
  'CC',
  '7777777777'
);

-- 2. Crear empresa
INSERT INTO business_partners (organizacion_id, tipo_actor, estado)
VALUES ('org-uuid', 'empresa', 'activo')
RETURNING id INTO empresa_id;

INSERT INTO empresas (
  id,
  razon_social,
  nit,
  digito_verificacion,
  representante_legal_id
)
VALUES (
  empresa_id,
  'Nueva Empresa S.A.S.',
  '900999888',
  calcular_digito_verificacion_nit('900999888'),
  representante_id  -- Referencia al representante creado
);

COMMIT;
```

---

## Patrones de Uso con TanStack Query (Frontend)

### Server Action para Buscar Persona

```typescript
// app/actions/personas.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function buscarPersonaPorDocumento(documento: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_personas_completa')
    .select('*')
    .eq('numero_documento', documento)
    .is('bp_eliminado_en', null)
    .single()

  if (error) throw error
  return data
}
```

### Client Component con TanStack Query

```typescript
// components/buscar-persona-form.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { buscarPersonaPorDocumento } from '@/app/actions/personas'

export function BuscarPersonaForm() {
  const [documento, setDocumento] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['persona', documento],
    queryFn: () => buscarPersonaPorDocumento(documento),
    enabled: documento.length > 0,
  })

  // ... render UI
}
```

### Mutation para Crear Persona

```typescript
// app/actions/personas.ts
'use server'

export async function crearPersona(data: PersonaInput) {
  const supabase = await createClient()

  // Iniciar transacción usando RPC o múltiples queries
  const { data: bp, error: bpError } = await supabase
    .from('business_partners')
    .insert({
      organizacion_id: data.organizacion_id,
      tipo_actor: 'persona',
      estado: 'activo',
    })
    .select('id')
    .single()

  if (bpError) throw bpError

  const { data: persona, error: personaError } = await supabase
    .from('personas')
    .insert({
      id: bp.id,
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
    })
    .select()
    .single()

  if (personaError) throw personaError
  return persona
}
```

```typescript
// Client component
const mutation = useMutation({
  mutationFn: crearPersona,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['personas'] })
  },
})
```

---

**Ver también:**
- [SCHEMA.md](./SCHEMA.md) - Arquitectura de tablas
- [TABLES.md](./TABLES.md) - Diccionario de datos
- [RLS.md](./RLS.md) - Políticas de seguridad
