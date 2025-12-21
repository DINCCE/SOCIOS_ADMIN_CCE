# Plan de Pruebas: Sistema de Relaciones entre Business Partners

**Proyecto:** SOCIOS_ADMIN
**Módulo:** bp_relaciones
**Versión:** 1.0
**Fecha:** 2024-12-20
**Estado:** NO EJECUTADO (Plan de referencia)

---

## Objetivo

Este documento detalla 20 tests diseñados para validar la correcta implementación del sistema de relaciones entre Business Partners, incluyendo estructura de datos, reglas de negocio, validaciones automáticas, y funcionalidad avanzada.

**IMPORTANTE:** Este plan NO debe ejecutarse automáticamente. Es un documento de referencia para pruebas manuales o futuras automatizaciones.

---

## Índice de Tests

**Estructura (Tests 1-8):**
1. Validar valores del ENUM tipo_relacion_bp
2. Validar estructura de tabla bp_relaciones
3. Validar existencia de índices
4. Validar función invertir_rol()
5. Validar RLS habilitado
6. Validar existencia de policies
7. Validar existencia de triggers
8. Validar existencia de vista v_relaciones_bidireccionales

**CRUD Válido (Tests 9-10):**
9. INSERT: Crear relación familiar válida
10. INSERT: Crear relación laboral válida

**Validaciones (Tests 11-13):**
11. CONSTRAINT: Prevenir auto-relaciones
12. TRIGGER: Rechazar relación familiar empresa-persona
13. TRIGGER: Rechazar relación laboral con empresa como origen

**Automatización (Tests 14, 19):**
14. TRIGGER: Actualizar timestamp automáticamente
19. GENERATED COLUMN: es_actual se actualiza automáticamente

**Funcionalidad Avanzada (Tests 15-18, 20):**
15. VIEW: Vista bidireccional genera registros inversos
16. SOFT DELETE: Marcar relación como eliminada
17. MIGRACIÓN: Verificar contactos de emergencia migrados
18. UNIQUE CONSTRAINT: Prevenir relaciones duplicadas activas
20. QUERY: Historial laboral completo de una persona

---

## Tests Detallados

### Test 1: Validar Valores del ENUM tipo_relacion_bp

**Objetivo:** Verificar que el ENUM tipo_relacion_bp contiene los 6 valores esperados.

**Query:**
```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'tipo_relacion_bp'::regtype
ORDER BY enumsortorder;
```

**Criterios de Éxito:**
- Retorna exactamente 6 filas
- Valores: 'familiar', 'laboral', 'referencia', 'membresia', 'comercial', 'otra'

**Resultado Esperado:**
```
 enumlabel
------------
 familiar
 laboral
 referencia
 membresia
 comercial
 otra
(6 rows)
```

---

### Test 2: Validar Estructura de Tabla bp_relaciones

**Objetivo:** Verificar que la tabla bp_relaciones tiene las 16 columnas esperadas con tipos correctos.

**Query:**
```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bp_relaciones'
ORDER BY ordinal_position;
```

**Criterios de Éxito:**
- Retorna 16 filas
- Columnas esperadas: id, organizacion_id, bp_origen_id, bp_destino_id, tipo_relacion, rol_origen, rol_destino, atributos, fecha_inicio, fecha_fin, es_actual, es_bidireccional, notas, creado_en, actualizado_en, eliminado_en
- `es_actual` debe ser una columna GENERATED

**Resultado Esperado:**
```
    column_name     |           data_type            | is_nullable |      column_default
--------------------+--------------------------------+-------------+-------------------------
 id                 | uuid                           | NO          | gen_random_uuid()
 organizacion_id    | uuid                           | NO          |
 bp_origen_id       | uuid                           | NO          |
 bp_destino_id      | uuid                           | NO          |
 tipo_relacion      | USER-DEFINED                   | NO          |
 rol_origen         | text                           | NO          |
 rol_destino        | text                           | NO          |
 atributos          | jsonb                          | NO          | '{}'::jsonb
 fecha_inicio       | date                           | YES         |
 fecha_fin          | date                           | YES         |
 es_actual          | boolean                        | NO          | GENERATED ALWAYS
 es_bidireccional   | boolean                        | NO          | false
 notas              | text                           | YES         |
 creado_en          | timestamp with time zone       | NO          | now()
 actualizado_en     | timestamp with time zone       | NO          | now()
 eliminado_en       | timestamp with time zone       | YES         |
(16 rows)
```

---

### Test 3: Validar Existencia de Índices

**Objetivo:** Verificar que existen los 7 índices esperados en bp_relaciones.

**Query:**
```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'bp_relaciones'
ORDER BY indexname;
```

**Criterios de Éxito:**
- Retorna 7 filas
- Índices: bp_relaciones_pkey, idx_bp_relaciones_actual, idx_bp_relaciones_bidireccional, idx_bp_relaciones_destino, idx_bp_relaciones_org, idx_bp_relaciones_origen, idx_bp_relaciones_tipo, idx_bp_relaciones_unique_activa

**Resultado Esperado:**
```
            indexname            |                     indexdef
---------------------------------+--------------------------------------------------
 bp_relaciones_pkey              | PRIMARY KEY (id)
 idx_bp_relaciones_actual        | CREATE INDEX ... WHERE eliminado_en IS NULL AND es_actual = true
 idx_bp_relaciones_bidireccional | CREATE INDEX ... WHERE eliminado_en IS NULL
 idx_bp_relaciones_destino       | CREATE INDEX ... WHERE eliminado_en IS NULL
 idx_bp_relaciones_org           | CREATE INDEX ... WHERE eliminado_en IS NULL
 idx_bp_relaciones_origen        | CREATE INDEX ... WHERE eliminado_en IS NULL
 idx_bp_relaciones_tipo          | CREATE INDEX ... WHERE eliminado_en IS NULL
 idx_bp_relaciones_unique_activa | CREATE UNIQUE INDEX ... WHERE eliminado_en IS NULL AND es_actual = true
(7+ rows)
```

---

### Test 4: Validar Función invertir_rol()

**Objetivo:** Verificar que la función invertir_rol() mapea correctamente roles a sus inversos.

**Query:**
```sql
SELECT
  'Padre' AS rol,
  invertir_rol('Padre') AS inverso
UNION ALL
SELECT 'Empleado', invertir_rol('Empleado')
UNION ALL
SELECT 'Hermano', invertir_rol('Hermano')
UNION ALL
SELECT 'Proveedor', invertir_rol('Proveedor')
UNION ALL
SELECT 'Contacto de Emergencia', invertir_rol('Contacto de Emergencia');
```

**Criterios de Éxito:**
- Retorna 5 filas
- Mapeos correctos:
  - Padre → Hijo
  - Empleado → Empleador
  - Hermano → Hermano (simétrico)
  - Proveedor → Cliente
  - Contacto de Emergencia → Persona

**Resultado Esperado:**
```
          rol           |        inverso
------------------------+------------------------
 Padre                  | Hijo
 Empleado               | Empleador
 Hermano                | Hermano
 Proveedor              | Cliente
 Contacto de Emergencia | Persona
(5 rows)
```

---

### Test 5: Validar RLS Habilitado

**Objetivo:** Verificar que Row Level Security está habilitado en bp_relaciones.

**Query:**
```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'bp_relaciones';
```

**Criterios de Éxito:**
- Retorna 1 fila
- rowsecurity = true

**Resultado Esperado:**
```
  tablename    | rowsecurity
---------------+-------------
 bp_relaciones | t
(1 row)
```

---

### Test 6: Validar Existencia de Policies

**Objetivo:** Verificar que existen las 3 policies esperadas en bp_relaciones.

**Query:**
```sql
SELECT
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'bp_relaciones'
ORDER BY policyname;
```

**Criterios de Éxito:**
- Retorna 3 filas
- Policies para SELECT, INSERT, UPDATE

**Resultado Esperado:**
```
                       policyname                        | cmd
---------------------------------------------------------+--------
 Usuarios autenticados pueden insertar bp_relaciones    | INSERT
 Usuarios autenticados pueden actualizar bp_relaciones  | UPDATE
 Usuarios autenticados pueden ver bp_relaciones         | SELECT
(3 rows)
```

---

### Test 7: Validar Existencia de Triggers

**Objetivo:** Verificar que existen los 2 triggers esperados en bp_relaciones.

**Query:**
```sql
SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'bp_relaciones'
ORDER BY trigger_name;
```

**Criterios de Éxito:**
- Retorna 2 filas
- Triggers: actualizar_bp_relaciones_timestamp, validar_relacion_compatible
- Ambos son BEFORE triggers

**Resultado Esperado:**
```
           trigger_name            | event_manipulation | action_timing
-----------------------------------+--------------------+---------------
 actualizar_bp_relaciones_timestamp | UPDATE             | BEFORE
 validar_relacion_compatible        | INSERT             | BEFORE
 validar_relacion_compatible        | UPDATE             | BEFORE
(3 rows)
```

---

### Test 8: Validar Existencia de Vista v_relaciones_bidireccionales

**Objetivo:** Verificar que la vista v_relaciones_bidireccionales existe y tiene la columna 'direccion'.

**Query:**
```sql
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'v_relaciones_bidireccionales'
  AND column_name IN ('id', 'bp_origen_id', 'bp_destino_id', 'direccion')
ORDER BY column_name;
```

**Criterios de Éxito:**
- Retorna 4 filas
- Incluye columnas: id, bp_origen_id, bp_destino_id, direccion
- direccion debe ser tipo TEXT

**Resultado Esperado:**
```
   column_name   | data_type
-----------------+-----------
 bp_destino_id   | uuid
 bp_origen_id    | uuid
 direccion       | text
 id              | uuid
(4 rows)
```

---

### Test 9: INSERT - Crear Relación Familiar Válida

**Objetivo:** Verificar que se puede insertar una relación familiar entre dos personas.

**Prerrequisitos:**
- Crear organización de prueba
- Crear 2 personas (padre e hijo)

**Query:**
```sql
-- Setup: Crear datos de prueba
BEGIN;

-- Organización
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');

-- Padre
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('padre-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('padre-uuid', 'Juan', 'Pérez', 'CC', '111111');

-- Hijo
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('hijo-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('hijo-uuid', 'Carlos', 'Pérez', 'CC', '222222');

-- TEST: Crear relación familiar
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino, es_bidireccional
)
VALUES (
  'test-org-uuid', 'padre-uuid', 'hijo-uuid',
  'familiar', 'Padre', 'Hijo', true
)
RETURNING id, tipo_relacion, rol_origen, rol_destino;

ROLLBACK; -- No commit, solo prueba
```

**Criterios de Éxito:**
- INSERT exitoso
- RETURNING muestra los datos insertados
- No se lanza excepción

**Resultado Esperado:**
```
                  id                  | tipo_relacion | rol_origen | rol_destino
--------------------------------------+---------------+------------+-------------
 <uuid-generado>                      | familiar      | Padre      | Hijo
(1 row)

INSERT 0 1
```

---

### Test 10: INSERT - Crear Relación Laboral Válida

**Objetivo:** Verificar que se puede insertar una relación laboral persona→empresa.

**Prerrequisitos:**
- Crear organización de prueba
- Crear 1 persona (empleado)
- Crear 1 empresa (empleador)

**Query:**
```sql
BEGIN;

-- Organización
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');

-- Empleado (persona)
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empleado-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('empleado-uuid', 'Ana', 'Gómez', 'CC', '333333');

-- Empleador (empresa)
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empresa-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('empresa-uuid', 'Tech Corp S.A.S.', '900111222', '3');

-- TEST: Crear relación laboral
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  atributos, es_bidireccional
)
VALUES (
  'test-org-uuid', 'empleado-uuid', 'empresa-uuid',
  'laboral', 'Empleado', 'Empleador',
  '{"cargo": "Developer", "departamento": "IT"}'::jsonb, false
)
RETURNING id, tipo_relacion, rol_origen, rol_destino, atributos->>'cargo' AS cargo;

ROLLBACK;
```

**Criterios de Éxito:**
- INSERT exitoso
- RETURNING muestra datos correctos con JSONB extraído

**Resultado Esperado:**
```
                  id                  | tipo_relacion | rol_origen | rol_destino |   cargo
--------------------------------------+---------------+------------+-------------+-----------
 <uuid-generado>                      | laboral       | Empleado   | Empleador   | Developer
(1 row)

INSERT 0 1
```

---

### Test 11: CONSTRAINT - Prevenir Auto-relaciones

**Objetivo:** Verificar que el constraint impide que un BP tenga relación consigo mismo.

**Query:**
```sql
BEGIN;

-- Setup
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('persona-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('persona-uuid', 'Test', 'User', 'CC', '999999');

-- TEST: Intentar auto-relación (debe fallar)
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'test-org-uuid', 'persona-uuid', 'persona-uuid',  -- ¡MISMO UUID!
  'familiar', 'Persona', 'Persona'
);

ROLLBACK;
```

**Criterios de Éxito:**
- INSERT falla con ERROR
- Mensaje contiene: "bp_relaciones_no_auto_relacion" o "violates check constraint"

**Resultado Esperado:**
```
ERROR:  new row for relation "bp_relaciones" violates check constraint "bp_relaciones_no_auto_relacion"
DETAIL:  Failing row contains (...)
```

---

### Test 12: TRIGGER - Rechazar Relación Familiar Empresa-Persona

**Objetivo:** Verificar que el trigger impide relaciones familiares si uno de los BP es empresa.

**Query:**
```sql
BEGIN;

-- Setup
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');

-- Persona
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('persona-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('persona-uuid', 'Test', 'User', 'CC', '111111');

-- Empresa
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empresa-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('empresa-uuid', 'Test Corp', '900222333', '4');

-- TEST: Intentar relación familiar persona-empresa (debe fallar)
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'test-org-uuid', 'persona-uuid', 'empresa-uuid',  -- ¡Empresa!
  'familiar', 'Persona', 'Empresa'
);

ROLLBACK;
```

**Criterios de Éxito:**
- INSERT falla con ERROR
- Mensaje contiene: "Relaciones familiares solo pueden ser entre personas"

**Resultado Esperado:**
```
ERROR:  Relaciones familiares solo pueden ser entre personas
CONTEXT:  PL/pgSQL function validar_tipo_relacion_compatible()
```

---

### Test 13: TRIGGER - Rechazar Relación Laboral con Empresa como Origen

**Objetivo:** Verificar que el trigger impide relaciones laborales si el origen NO es persona.

**Query:**
```sql
BEGIN;

-- Setup
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');

-- Empresa 1 (origen - INCORRECTO)
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empresa1-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('empresa1-uuid', 'Empresa A', '900111222', '3');

-- Empresa 2 (destino)
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empresa2-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('empresa2-uuid', 'Empresa B', '900333444', '5');

-- TEST: Intentar relación laboral empresa→empresa (debe fallar)
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'test-org-uuid', 'empresa1-uuid', 'empresa2-uuid',  -- ¡Empresa como origen!
  'laboral', 'Socio', 'Empresa'
);

ROLLBACK;
```

**Criterios de Éxito:**
- INSERT falla con ERROR
- Mensaje contiene validación de relación laboral

**Resultado Esperado:**
```
ERROR:  Relaciones laborales requieren origen persona y destino empresa
CONTEXT:  PL/pgSQL function validar_tipo_relacion_compatible()
```

---

### Test 14: TRIGGER - Actualizar Timestamp Automáticamente

**Objetivo:** Verificar que el trigger actualiza `actualizado_en` automáticamente en UPDATE.

**Query:**
```sql
BEGIN;

-- Setup y crear relación
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('p1-uuid', 'test-org-uuid', 'persona', 'activo'),
       ('p2-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('p1-uuid', 'A', 'B', 'CC', '111'),
       ('p2-uuid', 'C', 'D', 'CC', '222');

INSERT INTO bp_relaciones (
  id, organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'relacion-uuid', 'test-org-uuid', 'p1-uuid', 'p2-uuid',
  'familiar', 'Hermano', 'Hermano'
);

-- Esperar 1 segundo
SELECT pg_sleep(1);

-- Guardar timestamp original
SELECT creado_en, actualizado_en
FROM bp_relaciones
WHERE id = 'relacion-uuid';

-- TEST: UPDATE debe cambiar actualizado_en
UPDATE bp_relaciones
SET notas = 'Test timestamp update'
WHERE id = 'relacion-uuid';

-- Verificar cambio
SELECT
  creado_en,
  actualizado_en,
  actualizado_en > creado_en AS timestamp_updated
FROM bp_relaciones
WHERE id = 'relacion-uuid';

ROLLBACK;
```

**Criterios de Éxito:**
- `actualizado_en` > `creado_en`
- `timestamp_updated` = true

**Resultado Esperado:**
```
        creado_en         |      actualizado_en       | timestamp_updated
--------------------------+---------------------------+-------------------
 2024-12-20 10:00:00+00   | 2024-12-20 10:00:01+00    | t
(1 row)
```

---

### Test 15: VIEW - Vista Bidireccional Genera Registros Inversos

**Objetivo:** Verificar que la vista genera automáticamente el registro inverso para relaciones bidireccionales.

**Query:**
```sql
BEGIN;

-- Setup
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('p1-uuid', 'test-org-uuid', 'persona', 'activo'),
       ('p2-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('p1-uuid', 'Pedro', 'López', 'CC', '111'),
       ('p2-uuid', 'Juan', 'López', 'CC', '222');

-- Insertar relación bidireccional
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino, es_bidireccional
)
VALUES (
  'test-org-uuid', 'p1-uuid', 'p2-uuid',
  'familiar', 'Hermano', 'Hermano', true  -- ¡Bidireccional!
);

-- TEST: Consultar vista (debe retornar 2 registros)
SELECT
  bp_origen_id,
  bp_destino_id,
  rol_origen,
  rol_destino,
  direccion
FROM v_relaciones_bidireccionales
WHERE bp_origen_id IN ('p1-uuid', 'p2-uuid')
ORDER BY direccion;

ROLLBACK;
```

**Criterios de Éxito:**
- Retorna 2 filas
- Primera fila: direccion = 'directo', p1→p2
- Segunda fila: direccion = 'inverso', p2→p1 (auto-generado)

**Resultado Esperado:**
```
 bp_origen_id | bp_destino_id | rol_origen | rol_destino | direccion
--------------+---------------+------------+-------------+-----------
 p1-uuid      | p2-uuid       | Hermano    | Hermano     | directo
 p2-uuid      | p1-uuid       | Hermano    | Hermano     | inverso
(2 rows)
```

---

### Test 16: SOFT DELETE - Marcar Relación como Eliminada

**Objetivo:** Verificar que el soft delete funciona correctamente y la relación no aparece en queries normales.

**Query:**
```sql
BEGIN;

-- Setup y crear relación
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('p1-uuid', 'test-org-uuid', 'persona', 'activo'),
       ('p2-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('p1-uuid', 'A', 'B', 'CC', '111'),
       ('p2-uuid', 'C', 'D', 'CC', '222');

INSERT INTO bp_relaciones (
  id, organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'relacion-uuid', 'test-org-uuid', 'p1-uuid', 'p2-uuid',
  'familiar', 'Padre', 'Hijo'
);

-- Verificar que existe
SELECT COUNT(*) AS antes_delete
FROM bp_relaciones
WHERE id = 'relacion-uuid' AND eliminado_en IS NULL;

-- TEST: Soft delete
UPDATE bp_relaciones
SET eliminado_en = NOW()
WHERE id = 'relacion-uuid';

-- Verificar que ya no aparece en queries normales
SELECT COUNT(*) AS despues_delete
FROM bp_relaciones
WHERE id = 'relacion-uuid' AND eliminado_en IS NULL;

-- Pero SÍ existe con eliminado_en NOT NULL
SELECT COUNT(*) AS existe_soft_deleted
FROM bp_relaciones
WHERE id = 'relacion-uuid' AND eliminado_en IS NOT NULL;

ROLLBACK;
```

**Criterios de Éxito:**
- antes_delete = 1
- despues_delete = 0
- existe_soft_deleted = 1

**Resultado Esperado:**
```
 antes_delete | despues_delete | existe_soft_deleted
--------------+----------------+---------------------
 1            | 0              | 1
(1 row)
```

---

### Test 17: MIGRACIÓN - Verificar Contactos de Emergencia Migrados

**Objetivo:** Verificar que la migración de contacto_emergencia_id funciona correctamente (si hubiera datos).

**Query:**
```sql
BEGIN;

-- Setup: Crear datos como si fueran pre-migración
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');

-- Contacto de emergencia
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('contacto-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('contacto-uuid', 'Emergency', 'Contact', 'CC', '999');

-- Persona principal con contacto
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('persona-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento, contacto_emergencia_id)
VALUES ('persona-uuid', 'Main', 'Person', 'CC', '111', 'contacto-uuid');

-- TEST: Ejecutar migración
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  atributos, es_bidireccional, fecha_inicio
)
SELECT
  bp.organizacion_id,
  p.id,
  p.contacto_emergencia_id,
  'referencia'::tipo_relacion_bp,
  'Persona',
  'Contacto de Emergencia',
  jsonb_build_object(
    'tipo', 'emergencia',
    'migrado_desde', 'personas.contacto_emergencia_id'
  ),
  false,
  p.creado_en::date
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
WHERE p.contacto_emergencia_id IS NOT NULL
  AND bp.eliminado_en IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM bp_relaciones r
    WHERE r.bp_origen_id = p.id
      AND r.bp_destino_id = p.contacto_emergencia_id
      AND r.tipo_relacion = 'referencia'
  );

-- Verificar migración
SELECT
  tipo_relacion,
  rol_destino,
  atributos->>'migrado_desde' AS origen_migracion
FROM bp_relaciones
WHERE bp_origen_id = 'persona-uuid'
  AND bp_destino_id = 'contacto-uuid';

ROLLBACK;
```

**Criterios de Éxito:**
- INSERT exitoso
- Retorna 1 fila
- tipo_relacion = 'referencia'
- rol_destino = 'Contacto de Emergencia'
- origen_migracion = 'personas.contacto_emergencia_id'

**Resultado Esperado:**
```
 tipo_relacion |      rol_destino       |         origen_migracion
---------------+------------------------+----------------------------------
 referencia    | Contacto de Emergencia | personas.contacto_emergencia_id
(1 row)

INSERT 0 1
```

---

### Test 18: UNIQUE CONSTRAINT - Prevenir Relaciones Duplicadas Activas

**Objetivo:** Verificar que el índice UNIQUE impide crear relaciones duplicadas activas.

**Query:**
```sql
BEGIN;

-- Setup
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('p1-uuid', 'test-org-uuid', 'persona', 'activo'),
       ('p2-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('p1-uuid', 'A', 'B', 'CC', '111'),
       ('p2-uuid', 'C', 'D', 'CC', '222');

-- Insertar primera relación
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'test-org-uuid', 'p1-uuid', 'p2-uuid',
  'familiar', 'Padre', 'Hijo'
);

-- TEST: Intentar insertar duplicado (debe fallar)
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino
)
VALUES (
  'test-org-uuid', 'p1-uuid', 'p2-uuid',  -- ¡MISMOS valores!
  'familiar', 'Hermano', 'Hermano'  -- Roles diferentes, pero tipo igual
);

ROLLBACK;
```

**Criterios de Éxito:**
- Primer INSERT exitoso
- Segundo INSERT falla con ERROR
- Mensaje contiene: "idx_bp_relaciones_unique_activa" o "duplicate key"

**Resultado Esperado:**
```
INSERT 0 1
ERROR:  duplicate key value violates unique constraint "idx_bp_relaciones_unique_activa"
DETAIL:  Key (bp_origen_id, bp_destino_id, tipo_relacion)=(p1-uuid, p2-uuid, familiar) already exists.
```

---

### Test 19: GENERATED COLUMN - es_actual se Actualiza Automáticamente

**Objetivo:** Verificar que la columna generada `es_actual` se actualiza automáticamente según `fecha_fin`.

**Query:**
```sql
BEGIN;

-- Setup y crear relación SIN fecha_fin (actual)
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('p-uuid', 'test-org-uuid', 'persona', 'activo'),
       ('e-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('p-uuid', 'Ana', 'Gómez', 'CC', '111');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('e-uuid', 'Tech Corp', '900111', '3');

INSERT INTO bp_relaciones (
  id, organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  fecha_inicio, fecha_fin
)
VALUES (
  'relacion-uuid', 'test-org-uuid', 'p-uuid', 'e-uuid',
  'laboral', 'Empleado', 'Empleador',
  '2020-01-01', NULL  -- Sin fecha_fin = actual
);

-- Verificar es_actual = true
SELECT es_actual AS antes_finalizar
FROM bp_relaciones
WHERE id = 'relacion-uuid';

-- TEST: Finalizar relación (agregar fecha_fin)
UPDATE bp_relaciones
SET fecha_fin = CURRENT_DATE
WHERE id = 'relacion-uuid';

-- Verificar es_actual = false
SELECT es_actual AS despues_finalizar
FROM bp_relaciones
WHERE id = 'relacion-uuid';

ROLLBACK;
```

**Criterios de Éxito:**
- antes_finalizar = true
- despues_finalizar = false

**Resultado Esperado:**
```
 antes_finalizar | despues_finalizar
-----------------+-------------------
 t               | f
(1 row)
```

---

### Test 20: QUERY - Historial Laboral Completo de una Persona

**Objetivo:** Verificar que se puede obtener el historial laboral completo con duración calculada.

**Query:**
```sql
BEGIN;

-- Setup
INSERT INTO organizations (id, nombre) VALUES ('test-org-uuid', 'Test Org');

-- Persona
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empleado-uuid', 'test-org-uuid', 'persona', 'activo');
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('empleado-uuid', 'Ana', 'Martínez', 'CC', '123456');

-- Empresa 1
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empresa1-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('empresa1-uuid', 'Tech Corp A', '900111', '3');

-- Empresa 2
INSERT INTO business_partners (id, organizacion_id, tipo_actor, estado)
VALUES ('empresa2-uuid', 'test-org-uuid', 'empresa', 'activo');
INSERT INTO empresas (id, razon_social, nit, digito_verificacion)
VALUES ('empresa2-uuid', 'Tech Corp B', '900222', '4');

-- Relación 1: Trabajo anterior (finalizado)
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  atributos, fecha_inicio, fecha_fin
)
VALUES (
  'test-org-uuid', 'empleado-uuid', 'empresa1-uuid',
  'laboral', 'Empleado', 'Empleador',
  '{"cargo": "Junior Dev", "departamento": "IT"}'::jsonb,
  '2018-01-01', '2020-12-31'
);

-- Relación 2: Trabajo actual
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  atributos, fecha_inicio, fecha_fin
)
VALUES (
  'test-org-uuid', 'empleado-uuid', 'empresa2-uuid',
  'laboral', 'Empleado', 'Empleador',
  '{"cargo": "Senior Dev", "departamento": "Engineering"}'::jsonb,
  '2021-01-01', NULL
);

-- TEST: Query historial laboral
SELECT
  e.razon_social AS empresa,
  e.nit,
  r.fecha_inicio,
  r.fecha_fin,
  r.es_actual,
  CASE
    WHEN r.fecha_fin IS NULL THEN 'Actual'
    ELSE EXTRACT(YEAR FROM AGE(r.fecha_fin, r.fecha_inicio))::TEXT || ' años'
  END AS duracion,
  r.atributos->>'cargo' AS cargo,
  r.atributos->>'departamento' AS departamento
FROM bp_relaciones r
INNER JOIN empresas e ON r.bp_destino_id = e.id
WHERE r.bp_origen_id = 'empleado-uuid'
  AND r.tipo_relacion = 'laboral'
  AND r.eliminado_en IS NULL
ORDER BY r.es_actual DESC, r.fecha_inicio DESC;

ROLLBACK;
```

**Criterios de Éxito:**
- Retorna 2 filas
- Primera fila: Tech Corp B, es_actual = true, duracion = 'Actual'
- Segunda fila: Tech Corp A, es_actual = false, duracion = '2 años' (aproximadamente)

**Resultado Esperado:**
```
   empresa    |   nit   | fecha_inicio | fecha_fin  | es_actual | duracion |   cargo    |  departamento
--------------+---------+--------------+------------+-----------+----------+------------+----------------
 Tech Corp B  | 900222  | 2021-01-01   |            | t         | Actual   | Senior Dev | Engineering
 Tech Corp A  | 900111  | 2018-01-01   | 2020-12-31 | f         | 2 años   | Junior Dev | IT
(2 rows)
```

---

## Resumen de Tests

**Total:** 20 tests

**Por Categoría:**
- Estructura: 8 tests (validación de schema, índices, funciones, triggers, vistas)
- CRUD Válido: 2 tests (INSERT familiar, INSERT laboral)
- Validaciones: 3 tests (constraints, triggers de validación)
- Automatización: 2 tests (timestamp auto-update, columna generada)
- Funcionalidad Avanzada: 5 tests (vista bidireccional, soft delete, migración, unique constraint, queries complejas)

**Resultado Esperado General:**
- ✅ Tests 1-10: Deben pasar (estructura correcta, INSERT válidos)
- ❌ Tests 11-13: Deben fallar con error esperado (validaciones funcionando)
- ✅ Tests 14-20: Deben pasar (automatizaciones y funcionalidad avanzada)

---

## Notas de Implementación

1. **No Ejecutar Automáticamente:** Este plan es para referencia. No crear scripts de ejecución automática sin supervisión.

2. **Transacciones:** Todos los tests usan `BEGIN`...`ROLLBACK` para no modificar datos reales.

3. **UUIDs de Prueba:** Los tests usan UUIDs predecibles ('test-org-uuid', 'p1-uuid', etc.) para facilitar lectura.

4. **Orden de Ejecución:** Los tests pueden ejecutarse en cualquier orden (cada uno es independiente con su propio setup).

5. **Cleanup:** Los ROLLBACK garantizan que no quedan datos de prueba en la base de datos.

6. **Extensibilidad:** Agregar más tests para casos edge:
   - Relaciones con atributos JSONB complejos
   - Queries recursivas (árboles genealógicos)
   - Performance con grandes volúmenes
   - Validaciones de fechas (fecha_fin < fecha_inicio)

---

**Fin del Plan de Pruebas**
