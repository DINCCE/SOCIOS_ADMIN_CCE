# Plan de Pruebas - Base de Datos Business Partners
## Sistema de Gestión de Socios - Club Social Privado
**Fecha:** 2024-12-19
**Versión:** 1.0

---

## OBJETIVO

Validar que la implementación de la base de datos de Business Partners funciona correctamente, incluyendo:
- Tablas y relaciones
- Constraints y validaciones
- Triggers automáticos
- Vistas de consulta
- RLS policies

---

## CONFIGURACIÓN INICIAL

### Pre-requisitos
- Conexión a Supabase establecida
- Migraciones ejecutadas (7 migraciones confirmadas)
- MCP Supabase server disponible

### Herramientas a usar
- `mcp__supabase__execute_sql` - Para ejecutar queries de prueba
- `mcp__supabase__list_tables` - Para verificar estructura

---

## SUITE DE PRUEBAS

---

## TEST 1: Verificar Estructura de Tablas

### Objetivo
Confirmar que todas las tablas fueron creadas con la estructura correcta.

### Pasos
1. Ejecutar `mcp__supabase__list_tables` con schema 'public'
2. Verificar que existen 4 tablas:
   - `organizations`
   - `business_partners`
   - `personas`
   - `empresas`
3. Verificar que RLS está habilitado en todas

### Criterios de Éxito
- ✅ 4 tablas creadas
- ✅ RLS habilitado (`rls_enabled: true`) en todas
- ✅ Todas las tablas tienen `rows: 0` (vacías)

### Query de Validación
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'business_partners', 'personas', 'empresas')
ORDER BY tablename;
```

**Resultado esperado:** 4 filas con `rls_enabled = true`

---

## TEST 2: Crear Organización de Prueba

### Objetivo
Validar inserción básica en tabla `organizations`.

### Query de Prueba
```sql
INSERT INTO organizations (
  nombre,
  slug,
  tipo,
  email,
  telefono,
  direccion,
  configuracion
)
VALUES (
  'Club Social Test',
  'club-social-test',
  'club',
  'test@clubtest.com',
  '+57 1 234 5678',
  '{"ciudad": "Bogotá", "pais": "CO"}'::jsonb,
  '{"modo_prueba": true}'::jsonb
)
RETURNING id, nombre, slug, creado_en, actualizado_en;
```

### Criterios de Éxito
- ✅ INSERT exitoso
- ✅ Retorna `id` (UUID válido)
- ✅ `creado_en` y `actualizado_en` tienen timestamp
- ✅ `creado_en = actualizado_en` (nuevo registro)

### Guardar para Tests Siguientes
```
organization_id = [ID retornado]
```

---

## TEST 3: Crear Persona Completa (Transacción)

### Objetivo
Validar:
- Inserción correcta en `business_partners` + `personas`
- Trigger `actualizar_timestamp()` funciona
- Constraint unique en `(tipo_documento, numero_documento)`
- Trigger `verificar_consistencia_tipo_actor` valida correctamente

### Query de Prueba
```sql
BEGIN;

-- Paso 1: Insertar business partner
INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id,
  estado,
  email_principal,
  telefono_principal,
  creado_por
)
VALUES (
  'BP-TEST-001',
  'persona',
  '[organization_id del TEST 2]',
  'activo',
  'juan.test@email.com',
  '+57 300 111 2222',
  NULL
)
RETURNING id;
-- Guardar como persona_id_1

-- Paso 2: Insertar en personas
INSERT INTO personas (
  id,
  tipo_documento,
  numero_documento,
  fecha_expedicion,
  lugar_expedicion,
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  genero,
  fecha_nacimiento,
  lugar_nacimiento,
  nacionalidad,
  estado_civil,
  ocupacion,
  profesion,
  nivel_educacion,
  tipo_sangre,
  email_secundario,
  telefono_secundario,
  whatsapp,
  linkedin_url,
  facebook_url,
  instagram_handle,
  twitter_handle,
  foto_url,
  atributos
)
VALUES (
  '[persona_id_1]',
  'CC',
  '12345678',
  '2005-03-10',
  'Bogotá',
  'Juan',
  'Carlos',
  'Pérez',
  'García',
  'masculino',
  '1990-05-15',
  'Bogotá',
  'CO',
  'casado',
  'Ingeniero de Software',
  'Ingeniero de Sistemas',
  'pregrado',
  'O+',
  'juan.personal@gmail.com',
  '+57 300 999 8888',
  '+57 300 111 2222',
  'https://linkedin.com/in/juanperez',
  'https://facebook.com/juanperez',
  '@juanperez',
  '@juanperez_tw',
  'https://example.com/foto-juan.jpg',
  '{
    "direccion": {
      "linea1": "Calle 123 #45-67",
      "linea2": "Apto 501",
      "ciudad": "Bogotá",
      "departamento": "Cundinamarca",
      "codigo_postal": "110111",
      "pais": "CO",
      "estrato": 4,
      "barrio": "Chicó"
    },
    "preferencias": {
      "dieta": "ninguna",
      "alergias": [],
      "talla_camisa": "L",
      "hobbies": ["golf", "tenis", "lectura"]
    },
    "informacion_adicional": {
      "referido_por": "María López",
      "notas": "Socio fundador"
    }
  }'::jsonb
)
RETURNING id, creado_en, actualizado_en;

COMMIT;
```

### Criterios de Éxito
- ✅ Transacción COMMIT exitoso
- ✅ Registro en `business_partners` creado
- ✅ Registro en `personas` creado con mismo ID
- ✅ `creado_en` y `actualizado_en` poblados automáticamente
- ✅ Datos JSONB en `atributos` almacenados correctamente

### Validación Post-Insert
```sql
-- Verificar que existe en ambas tablas
SELECT
  bp.id,
  bp.codigo,
  bp.tipo_actor,
  p.numero_documento,
  p.primer_nombre,
  p.primer_apellido
FROM business_partners bp
JOIN personas p ON bp.id = p.id
WHERE bp.codigo = 'BP-TEST-001';
```

**Resultado esperado:** 1 fila con datos coincidentes

---

## TEST 4: Validar Trigger de Consistencia (Actor Huérfano)

### Objetivo
Confirmar que el trigger `verificar_consistencia_tipo_actor` previene actores sin tabla especializada.

### Query de Prueba (Debe FALLAR)
```sql
BEGIN;

-- Intentar crear business partner sin crear persona
INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id
)
VALUES (
  'BP-TEST-FAIL',
  'persona',
  '[organization_id del TEST 2]'
);

-- NO insertar en tabla personas

COMMIT;
-- Esto DEBE fallar con error del trigger
```

### Criterios de Éxito
- ✅ INSERT FALLA con error
- ✅ Mensaje de error contiene: "debe tener un registro en la tabla personas"
- ✅ No se crea ningún registro (rollback automático)

### Validación
```sql
-- Verificar que NO existe el registro
SELECT COUNT(*) as debe_ser_cero
FROM business_partners
WHERE codigo = 'BP-TEST-FAIL';
```

**Resultado esperado:** `debe_ser_cero = 0`

---

## TEST 5: Crear Segunda Persona (Contacto Emergencia)

### Objetivo
Crear otra persona para probar la relación de contacto de emergencia.

### Query de Prueba
```sql
BEGIN;

INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id,
  email_principal,
  telefono_principal
)
VALUES (
  'BP-TEST-002',
  'persona',
  '[organization_id del TEST 2]',
  'maria.test@email.com',
  '+57 300 333 4444'
)
RETURNING id;
-- Guardar como persona_id_2

INSERT INTO personas (
  id,
  tipo_documento,
  numero_documento,
  primer_nombre,
  primer_apellido,
  genero,
  fecha_nacimiento,
  atributos
)
VALUES (
  '[persona_id_2]',
  'CC',
  '87654321',
  'María',
  'López',
  'femenino',
  '1992-08-20',
  '{
    "direccion": {
      "linea1": "Carrera 45 #67-89",
      "ciudad": "Bogotá",
      "pais": "CO"
    }
  }'::jsonb
)
RETURNING id;

COMMIT;
```

### Criterios de Éxito
- ✅ Persona creada exitosamente
- ✅ Documento único (CC 87654321 no duplicado)

---

## TEST 6: Vincular Contacto de Emergencia

### Objetivo
Validar FK `contacto_emergencia_id` en tabla `personas`.

### Query de Prueba
```sql
-- Actualizar persona_1 para agregar contacto emergencia (persona_2)
UPDATE personas
SET
  contacto_emergencia_id = '[persona_id_2]',
  relacion_emergencia = 'conyuge'
WHERE id = '[persona_id_1]'
RETURNING
  id,
  contacto_emergencia_id,
  relacion_emergencia,
  actualizado_en;
```

### Criterios de Éxito
- ✅ UPDATE exitoso
- ✅ `contacto_emergencia_id` apunta a persona_id_2
- ✅ `actualizado_en` cambió (trigger funcionó)

### Validación
```sql
-- Verificar la relación
SELECT
  p1.primer_nombre || ' ' || p1.primer_apellido as persona,
  p2.primer_nombre || ' ' || p2.primer_apellido as contacto_emergencia,
  p1.relacion_emergencia
FROM personas p1
LEFT JOIN personas p2 ON p1.contacto_emergencia_id = p2.id
WHERE p1.id = '[persona_id_1]';
```

**Resultado esperado:** `persona = "Juan Pérez", contacto_emergencia = "María López", relacion = "conyuge"`

---

## TEST 7: Crear Empresa con Representante Legal

### Objetivo
Validar:
- Inserción correcta de empresa
- Validación automática de dígito verificación NIT
- FK `representante_legal_id` a tabla `personas`

### Query de Prueba
```sql
BEGIN;

INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id,
  email_principal,
  telefono_principal
)
VALUES (
  'BP-TEST-003',
  'empresa',
  '[organization_id del TEST 2]',
  'info@techtest.com',
  '+57 1 555 6666'
)
RETURNING id;
-- Guardar como empresa_id_1

INSERT INTO empresas (
  id,
  nit,
  digito_verificacion,
  razon_social,
  nombre_comercial,
  tipo_sociedad,
  fecha_constitucion,
  ciudad_constitucion,
  pais_constitucion,
  numero_registro,
  codigo_ciiu,
  sector_industria,
  actividad_economica,
  tamano_empresa,
  representante_legal_id,
  cargo_representante,
  telefono_secundario,
  whatsapp,
  website,
  linkedin_url,
  facebook_url,
  instagram_handle,
  twitter_handle,
  logo_url,
  numero_empleados,
  ingresos_anuales,
  atributos
)
VALUES (
  '[empresa_id_1]',
  '900123456',
  '3',  -- Dígito correcto calculado
  'TECH TEST S.A.S.',
  'TechTest',
  'SAS',
  '2020-01-15',
  'Bogotá',
  'CO',
  '01234567',
  '6201',
  'Tecnología',
  'Desarrollo de software',
  'pequena',
  '[persona_id_1]',  -- Juan Pérez como representante
  'Gerente General',
  '+57 1 777 8888',
  '+57 300 555 6666',
  'https://www.techtest.com',
  'https://linkedin.com/company/techtest',
  'https://facebook.com/techtest',
  '@techtest',
  '@techtest_co',
  'https://example.com/logo-techtest.png',
  25,
  150000000.00,
  '{
    "direccion": {
      "linea1": "Carrera 7 #123-45",
      "linea2": "Oficina 1001",
      "ciudad": "Bogotá",
      "departamento": "Cundinamarca",
      "codigo_postal": "110111",
      "pais": "CO"
    },
    "certificaciones": [
      {
        "nombre": "ISO 9001:2015",
        "fecha_emision": "2023-01-15",
        "url_certificado": "https://storage.example.com/iso9001.pdf"
      }
    ],
    "informacion_tributaria": {
      "regimen": "comun",
      "responsable_iva": true,
      "autorretenedor": true,
      "gran_contribuyente": false
    },
    "sucursales": [
      {
        "ciudad": "Medellín",
        "direccion": "Calle 50 #45-20",
        "telefono": "+57 4 444 5555"
      }
    ]
  }'::jsonb
)
RETURNING id, nit, digito_verificacion, razon_social;

COMMIT;
```

### Criterios de Éxito
- ✅ Empresa creada exitosamente
- ✅ `nit = '900123456'` y `digito_verificacion = '3'`
- ✅ `representante_legal_id` apunta a persona_id_1 (Juan Pérez)
- ✅ Datos JSONB almacenados correctamente

---

## TEST 8: Validar Dígito de Verificación Incorrecto

### Objetivo
Confirmar que el constraint `check_digito_verificacion_nit` rechaza DV incorrectos.

### Query de Prueba (Debe FALLAR)
```sql
BEGIN;

INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id
)
VALUES (
  'BP-TEST-FAIL-2',
  'empresa',
  '[organization_id del TEST 2]'
)
RETURNING id;
-- Guardar como temp_empresa_id

INSERT INTO empresas (
  id,
  nit,
  digito_verificacion,  -- DV INCORRECTO
  razon_social,
  tipo_sociedad
)
VALUES (
  '[temp_empresa_id]',
  '900123456',
  '5',  -- ❌ INCORRECTO (debería ser '3')
  'EMPRESA FAIL TEST',
  'SAS'
);

COMMIT;
-- Esto DEBE fallar
```

### Criterios de Éxito
- ✅ INSERT FALLA con error de constraint
- ✅ Mensaje contiene: "check_digito_verificacion_nit"
- ✅ No se crea la empresa (rollback)

---

## TEST 9: Validar Constraint Unique en Documento

### Objetivo
Confirmar que no se pueden duplicar documentos (tipo_documento + numero_documento).

### Query de Prueba (Debe FALLAR)
```sql
BEGIN;

INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id
)
VALUES (
  'BP-TEST-DUPLICATE',
  'persona',
  '[organization_id del TEST 2]'
)
RETURNING id;
-- Guardar como temp_persona_id

-- Intentar insertar con mismo documento que persona_1
INSERT INTO personas (
  id,
  tipo_documento,
  numero_documento,  -- ❌ DUPLICADO
  primer_nombre,
  primer_apellido,
  genero,
  fecha_nacimiento
)
VALUES (
  '[temp_persona_id]',
  'CC',
  '12345678',  -- ❌ Ya existe (persona_1)
  'Pedro',
  'Rodríguez',
  'masculino',
  '1985-01-01'
);

COMMIT;
-- Esto DEBE fallar
```

### Criterios de Éxito
- ✅ INSERT FALLA con error de unique constraint
- ✅ Mensaje contiene: "idx_persona_documento" o "duplicate key"
- ✅ No se crea el duplicado

---

## TEST 10: Validar Constraint Unique en NIT

### Objetivo
Confirmar que no se pueden duplicar NITs.

### Query de Prueba (Debe FALLAR)
```sql
BEGIN;

INSERT INTO business_partners (
  codigo,
  tipo_actor,
  organizacion_id
)
VALUES (
  'BP-TEST-DUP-NIT',
  'empresa',
  '[organization_id del TEST 2]'
)
RETURNING id;

INSERT INTO empresas (
  id,
  nit,  -- ❌ DUPLICADO
  digito_verificacion,
  razon_social,
  tipo_sociedad
)
VALUES (
  '[id anterior]',
  '900123456',  -- ❌ Ya existe (empresa del TEST 7)
  '3',
  'EMPRESA DUPLICADA',
  'SAS'
);

COMMIT;
-- Esto DEBE fallar
```

### Criterios de Éxito
- ✅ INSERT FALLA con error de unique constraint
- ✅ Mensaje contiene: "idx_empresa_nit" o "duplicate key"

---

## TEST 11: Probar Vista v_personas_completa

### Objetivo
Validar que la vista retorna datos correctos y campos calculados.

### Query de Prueba
```sql
SELECT
  codigo,
  nombre_completo,
  tipo_documento,
  numero_documento,
  edad,
  genero,
  email_principal,
  telefono_principal,
  whatsapp,
  linkedin_url,
  ocupacion,
  nombre_contacto_emergencia,
  relacion_emergencia,
  atributos->>'direccion' as direccion_json
FROM v_personas_completa
WHERE organizacion_id = '[organization_id del TEST 2]'
ORDER BY nombre_completo;
```

### Criterios de Éxito
- ✅ Retorna 2 filas (Juan Pérez y María López)
- ✅ `nombre_completo` calculado correctamente:
  - "Juan Carlos Pérez García"
  - "María López"
- ✅ `edad` calculada correctamente (años desde fecha_nacimiento)
- ✅ `nombre_contacto_emergencia` para Juan = "María López"
- ✅ Campo JSONB `direccion` accesible

### Resultado Esperado
```
codigo        | nombre_completo          | edad | nombre_contacto_emergencia | relacion_emergencia
--------------|-------------------------|------|---------------------------|--------------------
BP-TEST-001   | Juan Carlos Pérez García | 34   | María López               | conyuge
BP-TEST-002   | María López              | 32   | NULL                      | NULL
```

---

## TEST 12: Probar Vista v_empresas_completa

### Objetivo
Validar vista de empresas con NIT completo y representante legal.

### Query de Prueba
```sql
SELECT
  codigo,
  nit_completo,
  razon_social,
  nombre_comercial,
  tipo_sociedad,
  nombre_representante_legal,
  cargo_representante,
  email_principal,
  numero_empleados,
  ingresos_anuales,
  atributos->'certificaciones' as certificaciones_json
FROM v_empresas_completa
WHERE organizacion_id = '[organization_id del TEST 2]'
ORDER BY razon_social;
```

### Criterios de Éxito
- ✅ Retorna 1 fila (TECH TEST S.A.S.)
- ✅ `nit_completo = "900123456-3"` (concatenado)
- ✅ `nombre_representante_legal = "Juan Pérez"`
- ✅ `cargo_representante = "Gerente General"`
- ✅ Campo JSONB `certificaciones` accesible

### Resultado Esperado
```
nit_completo   | razon_social       | nombre_representante_legal | cargo_representante | numero_empleados
---------------|-------------------|---------------------------|---------------------|------------------
900123456-3    | TECH TEST S.A.S.  | Juan Pérez                | Gerente General     | 25
```

---

## TEST 13: Probar Vista v_actores_unificados

### Objetivo
Validar vista unificada de personas y empresas.

### Query de Prueba
```sql
SELECT
  codigo,
  tipo_actor,
  nombre_display,
  identificacion,
  email_principal,
  telefono_principal
FROM v_actores_unificados
WHERE organizacion_id = '[organization_id del TEST 2]'
ORDER BY tipo_actor, nombre_display;
```

### Criterios de Éxito
- ✅ Retorna 3 filas (2 personas + 1 empresa)
- ✅ `nombre_display` correcto para cada tipo:
  - Personas: "Juan Pérez", "María López"
  - Empresa: "TECH TEST S.A.S."
- ✅ `identificacion` formateada correctamente:
  - Personas: "CC 12345678", "CC 87654321"
  - Empresa: "NIT 900123456-3"

### Resultado Esperado
```
tipo_actor | nombre_display       | identificacion      | email_principal
-----------|---------------------|---------------------|----------------------
empresa    | TECH TEST S.A.S.    | NIT 900123456-3     | info@techtest.com
persona    | Juan Pérez          | CC 12345678         | juan.test@email.com
persona    | María López         | CC 87654321         | maria.test@email.com
```

---

## TEST 14: Soft Delete de Actor

### Objetivo
Validar soft delete en `business_partners` y filtrado automático en vistas.

### Query de Prueba
```sql
-- Marcar persona_2 (María) como eliminada
UPDATE business_partners
SET
  eliminado_en = now(),
  eliminado_por = NULL  -- Simular eliminación sin usuario
WHERE id = '[persona_id_2]'
RETURNING id, codigo, eliminado_en;
```

### Criterios de Éxito
- ✅ UPDATE exitoso
- ✅ `eliminado_en` tiene timestamp

### Validación en Vista
```sql
-- María NO debe aparecer en la vista
SELECT COUNT(*) as debe_ser_2
FROM v_actores_unificados
WHERE organizacion_id = '[organization_id del TEST 2]';

-- Solo Juan y la empresa deben estar visibles
SELECT nombre_display
FROM v_actores_unificados
WHERE organizacion_id = '[organization_id del TEST 2]'
ORDER BY nombre_display;
```

**Resultado esperado:**
- `debe_ser_2 = 2` (solo Juan y empresa)
- Nombres: "Juan Pérez", "TECH TEST S.A.S."

---

## TEST 15: Actualizar Persona y Validar Trigger de Timestamp

### Objetivo
Confirmar que el trigger `actualizar_timestamp()` funciona en UPDATE.

### Query de Prueba
```sql
-- Guardar timestamp actual
SELECT actualizado_en as timestamp_antes
FROM personas
WHERE id = '[persona_id_1]';

-- Esperar 1 segundo (simular paso de tiempo)
SELECT pg_sleep(1);

-- Actualizar dato
UPDATE personas
SET
  ocupacion = 'Senior Software Engineer',
  email_secundario = 'juan.nuevo@gmail.com',
  atributos = atributos || '{"preferencias": {"dieta": "vegetariana"}}'::jsonb
WHERE id = '[persona_id_1]'
RETURNING actualizado_en as timestamp_despues;
```

### Criterios de Éxito
- ✅ UPDATE exitoso
- ✅ `timestamp_despues > timestamp_antes` (cambió automáticamente)
- ✅ Campo `ocupacion` actualizado
- ✅ JSONB `atributos` merged correctamente

### Validación
```sql
SELECT
  ocupacion,
  email_secundario,
  atributos->'preferencias'->>'dieta' as dieta,
  actualizado_en > creado_en as timestamp_cambiado
FROM personas
WHERE id = '[persona_id_1]';
```

**Resultado esperado:**
```
ocupacion                  | email_secundario        | dieta       | timestamp_cambiado
--------------------------|------------------------|-------------|-------------------
Senior Software Engineer  | juan.nuevo@gmail.com   | vegetariana | true
```

---

## TEST 16: Validar Enums y Constraints CHECK

### Objetivo
Confirmar que los valores ENUM están funcionando correctamente.

### Query de Prueba (Debe FALLAR)
```sql
-- Intentar insertar género inválido
BEGIN;

INSERT INTO business_partners (codigo, tipo_actor, organizacion_id)
VALUES ('BP-TEST-ENUM', 'persona', '[organization_id del TEST 2]')
RETURNING id;

INSERT INTO personas (
  id,
  tipo_documento,
  numero_documento,
  primer_nombre,
  primer_apellido,
  genero,  -- ❌ Valor inválido
  fecha_nacimiento
)
VALUES (
  '[id anterior]',
  'CC',
  '99999999',
  'Test',
  'Enum',
  'invalido',  -- ❌ No está en el CHECK constraint
  '2000-01-01'
);

COMMIT;
```

### Criterios de Éxito
- ✅ INSERT FALLA con error de CHECK constraint
- ✅ Mensaje contiene valores permitidos: 'masculino', 'femenino', 'otro', 'no_especifica'

### Repetir para Otros Enums
Probar valores inválidos en:
- `business_partners.tipo_actor` → Intentar 'otro' (debe fallar)
- `business_partners.estado` → Intentar 'eliminado' (debe fallar)
- `personas.tipo_documento` → Intentar 'XXX' (debe fallar)
- `personas.estado_civil` → Intentar 'comprometido' (debe fallar)
- `empresas.tipo_sociedad` → Intentar 'C.A.' (debe fallar)
- `empresas.tamano_empresa` → Intentar 'xlarge' (debe fallar)

---

## TEST 17: Probar Query de Búsqueda por Documento

### Objetivo
Validar índice único y búsqueda eficiente.

### Query de Prueba
```sql
-- Buscar persona por documento
SELECT
  nombre_completo,
  tipo_documento,
  numero_documento,
  email_principal,
  telefono_principal,
  ocupacion
FROM v_personas_completa
WHERE numero_documento = '12345678'
  AND tipo_documento = 'CC';
```

### Criterios de Éxito
- ✅ Retorna exactamente 1 fila (Juan Pérez)
- ✅ Búsqueda rápida (usa índice `idx_persona_documento`)

---

## TEST 18: Probar Agregaciones y Estadísticas

### Objetivo
Validar cálculos sobre vistas.

### Queries de Prueba
```sql
-- Edad promedio de personas
SELECT
  AVG(edad) as edad_promedio,
  MIN(edad) as edad_minima,
  MAX(edad) as edad_maxima,
  COUNT(*) as total_personas
FROM v_personas_completa
WHERE organizacion_id = '[organization_id del TEST 2]';

-- Distribución por género
SELECT
  genero,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM v_personas_completa
WHERE organizacion_id = '[organization_id del TEST 2]'
GROUP BY genero
ORDER BY cantidad DESC;

-- Total empleados en empresas
SELECT
  COUNT(*) as total_empresas,
  SUM(numero_empleados) as total_empleados,
  SUM(ingresos_anuales) as ingresos_totales
FROM v_empresas_completa
WHERE organizacion_id = '[organization_id del TEST 2]';
```

### Criterios de Éxito
- ✅ Todas las queries ejecutan sin error
- ✅ Resultados numéricos coherentes

---

## TEST 19: Validar RLS Policies Básicas

### Objetivo
Confirmar que RLS está activo (aunque las policies sean básicas).

### Query de Validación
```sql
-- Verificar que RLS está habilitado
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'business_partners', 'personas', 'empresas');

-- Listar políticas activas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Criterios de Éxito
- ✅ Las 4 tablas tienen `rls_enabled = true`
- ✅ Existen políticas para cada tabla
- ✅ Políticas incluyen SELECT, INSERT, UPDATE

---

## TEST 20: Cleanup - Eliminar Datos de Prueba

### Objetivo
Limpiar todos los datos de prueba creados.

### Queries de Cleanup
```sql
BEGIN;

-- Eliminar empresas (cascada elimina de business_partners)
DELETE FROM empresas
WHERE id IN (
  SELECT id FROM business_partners
  WHERE organizacion_id IN (
    SELECT id FROM organizations WHERE slug = 'club-social-test'
  )
);

-- Eliminar personas (cascada elimina de business_partners)
DELETE FROM personas
WHERE id IN (
  SELECT id FROM business_partners
  WHERE organizacion_id IN (
    SELECT id FROM organizations WHERE slug = 'club-social-test'
  )
);

-- Eliminar business_partners huérfanos (si quedaron)
DELETE FROM business_partners
WHERE organizacion_id IN (
  SELECT id FROM organizations WHERE slug = 'club-social-test'
);

-- Eliminar organización de prueba
DELETE FROM organizations
WHERE slug = 'club-social-test';

COMMIT;
```

### Verificación Final
```sql
-- Verificar que todas las tablas están vacías
SELECT
  'organizations' as tabla,
  COUNT(*) as registros
FROM organizations
UNION ALL
SELECT 'business_partners', COUNT(*) FROM business_partners
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'empresas', COUNT(*) FROM empresas;
```

### Criterios de Éxito
- ✅ Todas las tablas tienen `registros = 0`
- ✅ No quedan datos de prueba

---

## RESUMEN DE RESULTADOS ESPERADOS

### Tests que DEBEN pasar (✅):
1. TEST 1 - Estructura de tablas
2. TEST 2 - Crear organización
3. TEST 3 - Crear persona completa
5. TEST 5 - Crear segunda persona
6. TEST 6 - Vincular contacto emergencia
7. TEST 7 - Crear empresa
11. TEST 11 - Vista personas completa
12. TEST 12 - Vista empresas completa
13. TEST 13 - Vista actores unificados
14. TEST 14 - Soft delete
15. TEST 15 - Trigger timestamp
17. TEST 17 - Búsqueda por documento
18. TEST 18 - Agregaciones
19. TEST 19 - RLS policies activas
20. TEST 20 - Cleanup

### Tests que DEBEN fallar (❌):
4. TEST 4 - Actor huérfano (trigger previene)
8. TEST 8 - DV incorrecto (constraint rechaza)
9. TEST 9 - Documento duplicado (unique constraint)
10. TEST 10 - NIT duplicado (unique constraint)
16. TEST 16 - Valores enum inválidos (check constraint)

---

## EJECUCIÓN DEL PLAN

### Instrucciones para AI:

1. **Ejecutar tests secuencialmente** (mantener orden 1-20)

2. **Guardar IDs entre tests:**
   - `organization_id` del TEST 2
   - `persona_id_1` del TEST 3
   - `persona_id_2` del TEST 5
   - `empresa_id_1` del TEST 7

3. **Reemplazar placeholders:**
   - `[organization_id del TEST 2]` → UUID real guardado
   - `[persona_id_1]` → UUID real guardado
   - etc.

4. **Para cada test:**
   - Ejecutar query usando `mcp__supabase__execute_sql`
   - Capturar resultado
   - Verificar contra "Criterios de Éxito"
   - Documentar: ✅ PASS o ❌ FAIL con razón

5. **Para tests que deben fallar:**
   - Confirmar que SÍ fallan con el error esperado
   - Si pasan cuando deberían fallar = ❌ FAIL del test

6. **Generar reporte final:**
   - Total tests ejecutados: 20
   - Tests pasados: X/20
   - Tests fallados: Y/20
   - Detalles de cada fallo

---

## FORMATO DE REPORTE ESPERADO

```markdown
# REPORTE DE PRUEBAS - Base de Datos Business Partners
Fecha: [timestamp]
Ejecutado por: [AI name]

## RESUMEN
- Total Tests: 20
- ✅ Pasados: X
- ❌ Fallados: Y
- 🔄 Omitidos: Z

## DETALLES

### TEST 1: Verificar Estructura de Tablas
**Estado:** ✅ PASS
**Tiempo:** 0.5s
**Resultado:** 4 tablas creadas, RLS habilitado en todas

### TEST 2: Crear Organización de Prueba
**Estado:** ✅ PASS
**Tiempo:** 0.3s
**ID generado:** abc-123-org-uuid
**Resultado:** Organización creada exitosamente

[... continuar para cada test ...]

## CONCLUSIONES
[Resumen general del estado de la base de datos]

## RECOMENDACIONES
[Cualquier issue encontrado o mejora sugerida]
```

---

**FIN DEL PLAN DE PRUEBAS**
