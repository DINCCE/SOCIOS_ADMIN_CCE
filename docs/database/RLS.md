# Row Level Security (RLS) - Políticas de Seguridad

Este documento describe las políticas de Row Level Security (RLS) implementadas en la base de datos para controlar el acceso a los datos a nivel de fila.

## Índice

- [Conceptos Fundamentales](#conceptos-fundamentales)
- [Estado Actual de RLS](#estado-actual-de-rls)
- [Políticas Implementadas](#políticas-implementadas)
- [Patrones Comunes](#patrones-comunes)
- [Multi-Tenancy](#multi-tenancy)
- [Testing de RLS](#testing-de-rls)
- [Troubleshooting](#troubleshooting)
- [Roadmap Futuro](#roadmap-futuro)

---

## Conceptos Fundamentales

### ¿Qué es Row Level Security (RLS)?

Row Level Security es una característica de PostgreSQL que permite controlar **a nivel de fila** qué usuarios pueden ver o modificar cada registro de una tabla.

**Ventajas:**
- **Seguridad a nivel de BD:** No depende del código de aplicación
- **Multi-tenancy:** Aislamiento automático de datos entre organizaciones
- **Simplicidad:** Una vez configurado, funciona transparentemente
- **Imposible de saltarse:** No hay forma de bypassear desde la aplicación

### Funciones de Supabase Auth

Las políticas RLS utilizan funciones de Supabase para identificar al usuario autenticado:

- **`auth.uid()`** - Retorna el UUID del usuario autenticado
- **`auth.role()`** - Retorna el rol del usuario ('authenticated', 'anon', 'service_role')
- **`auth.jwt()`** - Retorna el JWT del usuario con claims personalizados
- **`auth.email()`** - Retorna el email del usuario autenticado

### Tipos de Políticas

PostgreSQL soporta políticas para cada operación CRUD:

- **SELECT** (FOR SELECT) - Controla qué filas se pueden leer
- **INSERT** (FOR INSERT) - Controla qué filas se pueden crear
- **UPDATE** (FOR UPDATE) - Controla qué filas se pueden modificar
- **DELETE** (FOR DELETE) - Controla qué filas se pueden eliminar

### Sintaxis Básica

```sql
-- Habilitar RLS en una tabla
ALTER TABLE tabla_name ENABLE ROW LEVEL SECURITY;

-- Crear una política
CREATE POLICY "nombre_descriptivo"
  ON tabla_name
  FOR SELECT | INSERT | UPDATE | DELETE
  USING (condicion_booleana)
  WITH CHECK (condicion_booleana_para_nuevos_datos);
```

---

## Estado Actual de RLS

### Tablas con RLS Habilitado

✅ **RLS está habilitado en todas las tablas:**

- `organizations` - RLS enabled ✅
- `business_partners` - RLS enabled ✅
- `personas` - RLS enabled ✅
- `empresas` - RLS enabled ✅
- `bp_relaciones` - RLS enabled ✅

### Estado de las Políticas

✅ **Estado Actual:** Todas las tablas tienen políticas básicas implementadas.

**Nivel de Seguridad:**
- **Políticas implementadas:** Básicas (requiere usuario autenticado)
- **Multi-tenancy:** NO implementado aún (todas las organizaciones son visibles para usuarios autenticados)
- **Control de acceso:** Por autenticación (authenticated vs anon)
- **Soft delete:** Respetado en SELECT (solo muestra registros no eliminados)

**⚠️ IMPORTANTE:** Las políticas actuales permiten a **cualquier usuario autenticado** acceder a **todas las organizaciones**. Para implementar verdadero multi-tenancy, se debe:
1. Crear tabla `profiles` con `organizacion_id`
2. Actualizar políticas para filtrar por `organizacion_id`
3. Ver sección [Roadmap Futuro](#roadmap-futuro) para detalles

---

## Políticas Implementadas

### `organizations`

**Objetivo actual:** Permitir acceso completo a usuarios autenticados.

#### Políticas Activas

```sql
-- SELECT: Ver todas las organizaciones (si estás autenticado)
CREATE POLICY "usuarios_autenticados_pueden_ver_organizaciones"
  ON organizations
  FOR SELECT
  TO public
  USING (auth.role() = 'authenticated');

-- INSERT: Crear organizaciones (si estás autenticado)
CREATE POLICY "usuarios_autenticados_pueden_crear_organizaciones"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Actualizar organizaciones (si estás autenticado)
CREATE POLICY "usuarios_autenticados_pueden_actualizar_organizaciones"
  ON organizations
  FOR UPDATE
  TO public
  USING (auth.role() = 'authenticated');
```

**Comportamiento:**
- ✅ Usuarios autenticados pueden ver todas las organizaciones
- ✅ Usuarios autenticados pueden crear organizaciones
- ✅ Usuarios autenticados pueden actualizar organizaciones
- ❌ No hay DELETE policy (hard delete bloqueado)
- ⚠️ No hay filtrado por organización del usuario (multi-tenancy pendiente)

---

### `business_partners`

**Objetivo actual:** Permitir acceso a usuarios autenticados, respetando soft delete.

#### Políticas Activas

```sql
-- SELECT: Ver business partners no eliminados
CREATE POLICY "usuarios_pueden_ver_actores"
  ON business_partners
  FOR SELECT
  TO public
  USING (
    auth.role() = 'authenticated'
    AND eliminado_en IS NULL
  );

-- INSERT: Crear business partners
CREATE POLICY "usuarios_pueden_insertar_actores"
  ON business_partners
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Actualizar business partners no eliminados
CREATE POLICY "usuarios_pueden_actualizar_actores"
  ON business_partners
  FOR UPDATE
  TO public
  USING (
    auth.role() = 'authenticated'
    AND eliminado_en IS NULL
  );

-- UPDATE (soft delete): Permitir marcar como eliminado
CREATE POLICY "usuarios_pueden_eliminar_actores"
  ON business_partners
  FOR UPDATE
  TO public
  USING (
    auth.role() = 'authenticated'
    AND eliminado_en IS NULL
  );
```

**Comportamiento:**
- ✅ SELECT solo muestra registros no eliminados (`eliminado_en IS NULL`)
- ✅ UPDATE solo permite modificar registros no eliminados
- ✅ Soft delete permitido vía UPDATE (marcando `eliminado_en`)
- ❌ No hay DELETE policy (hard delete bloqueado completamente)
- ⚠️ No filtra por `organizacion_id` (todos los usuarios ven todo)

---

### `personas`

**Objetivo actual:** Permitir acceso si el business_partner asociado existe y está autenticado.

#### Políticas Activas

```sql
-- SELECT: Ver personas cuyo business_partner no está eliminado
CREATE POLICY "usuarios_pueden_ver_personas"
  ON personas
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = personas.id
        AND business_partners.eliminado_en IS NULL
        AND auth.role() = 'authenticated'
    )
  );

-- INSERT: Crear personas si existe business_partner correspondiente
CREATE POLICY "usuarios_pueden_insertar_personas"
  ON personas
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = personas.id
        AND auth.role() = 'authenticated'
    )
  );

-- UPDATE: Actualizar personas si business_partner existe
CREATE POLICY "usuarios_pueden_actualizar_personas"
  ON personas
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = personas.id
        AND auth.role() = 'authenticated'
    )
  );
```

**Comportamiento:**
- ✅ SELECT solo muestra personas cuyo `business_partners.eliminado_en IS NULL`
- ✅ INSERT/UPDATE requiere existencia de business_partner correspondiente
- ✅ Respeta Class Table Inheritance (CTI) pattern
- ❌ No hay DELETE policy (hard delete bloqueado)
- ⚠️ No filtra por organización (depende de business_partners)

---

### `empresas`

**Objetivo actual:** Permitir acceso si el business_partner asociado existe y está autenticado.

#### Políticas Activas

```sql
-- SELECT: Ver empresas cuyo business_partner no está eliminado
CREATE POLICY "usuarios_pueden_ver_empresas"
  ON empresas
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = empresas.id
        AND business_partners.eliminado_en IS NULL
        AND auth.role() = 'authenticated'
    )
  );

-- INSERT: Crear empresas si existe business_partner correspondiente
CREATE POLICY "usuarios_pueden_insertar_empresas"
  ON empresas
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = empresas.id
        AND auth.role() = 'authenticated'
    )
  );

-- UPDATE: Actualizar empresas si business_partner existe
CREATE POLICY "usuarios_pueden_actualizar_empresas"
  ON empresas
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = empresas.id
        AND auth.role() = 'authenticated'
    )
  );
```

**Comportamiento:**
- ✅ SELECT solo muestra empresas cuyo `business_partners.eliminado_en IS NULL`
- ✅ INSERT/UPDATE requiere existencia de business_partner correspondiente
- ✅ Respeta Class Table Inheritance (CTI) pattern
- ❌ No hay DELETE policy (hard delete bloqueado)
- ⚠️ No filtra por organización (depende de business_partners)

---

### `bp_relaciones`

**Objetivo actual:** Permitir acceso completo a usuarios autenticados.

#### Políticas Activas

```sql
-- SELECT: Ver todas las relaciones
CREATE POLICY "Usuarios autenticados pueden ver bp_relaciones"
  ON bp_relaciones
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Crear relaciones
CREATE POLICY "Usuarios autenticados pueden insertar bp_relaciones"
  ON bp_relaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Actualizar relaciones
CREATE POLICY "Usuarios autenticados pueden actualizar bp_relaciones"
  ON bp_relaciones
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Comportamiento:**
- ✅ Usuarios autenticados tienen acceso completo (SELECT, INSERT, UPDATE)
- ✅ No hay restricciones adicionales (`USING (true)`)
- ❌ No hay DELETE policy (hard delete bloqueado)
- ⚠️ No filtra por organización (todos pueden ver/modificar todas las relaciones)

---

## Patrones Comunes

### Patrón de Autenticación Básica

**Estructura actual en todas las tablas:**
```sql
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Explicación:**
1. `auth.role()` verifica si el usuario está autenticado
2. Retorna `'authenticated'` para usuarios logueados
3. Retorna `'anon'` para usuarios no autenticados
4. Solo usuarios autenticados pasan la política

### Patrón de Soft Delete en SELECT

**Estructura en business_partners, personas, empresas:**
```sql
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND eliminado_en IS NULL  -- Solo registros no eliminados
  );
```

**Comportamiento:**
- SELECT automáticamente filtra registros eliminados
- Mantiene historial completo en la base de datos
- No permite ver registros marcados como eliminados

### Patrón de Class Table Inheritance (CTI)

**Estructura en personas y empresas:**
```sql
CREATE POLICY "policy_name"
  ON personas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM business_partners
      WHERE business_partners.id = personas.id
        AND business_partners.eliminado_en IS NULL
        AND auth.role() = 'authenticated'
    )
  );
```

**Explicación:**
1. Verifica existencia en tabla padre (`business_partners`)
2. Respeta soft delete del padre
3. Mantiene integridad del patrón CTI
4. Solo permite ver especializaciones si el padre es válido

### Patrón de Prevención de Hard Delete

**Implementado en TODAS las tablas:**
- No hay políticas FOR DELETE
- Hard delete está completamente bloqueado
- Solo soft delete es posible (UPDATE `eliminado_en`)

```sql
-- No hay CREATE POLICY ... FOR DELETE
-- Por lo tanto, DELETE está prohibido para todos
```

---

## Multi-Tenancy

### Estado Actual: NO Implementado

⚠️ **IMPORTANTE:** El sistema NO tiene multi-tenancy implementado actualmente.

**Situación Actual:**
- Todos los usuarios autenticados pueden ver **todas las organizaciones**
- Todos los usuarios autenticados pueden ver **todos los business partners**
- No hay filtrado por `organizacion_id` del usuario
- No existe tabla `profiles` para asociar usuarios con organizaciones

### Arquitectura Necesaria para Multi-Tenancy

Para implementar multi-tenancy se requiere:

```sql
-- 1. Crear tabla profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacion_id UUID REFERENCES organizations(id) NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política para profiles
CREATE POLICY "usuarios_pueden_ver_su_perfil"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);
```

### Ejemplo de Política Multi-Tenancy (Futuro)

```sql
-- Política para business_partners con multi-tenancy
CREATE POLICY "usuarios_solo_ven_su_organizacion"
  ON business_partners
  FOR SELECT
  USING (
    organizacion_id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
    )
    AND eliminado_en IS NULL
  );
```

**Flujo de Aislamiento (Futuro):**
```
Usuario autenticado
       ↓
   auth.uid()
       ↓
   profiles → organizacion_id
       ↓
   Filtro RLS
       ↓
Solo datos de esa organización
```

---

## Testing de RLS

### Verificar Políticas Aplicadas

```sql
-- Ver todas las políticas de una tabla
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
WHERE tablename = 'business_partners'
ORDER BY cmd, policyname;
```

### Probar como Usuario Autenticado

**Desde Supabase Client (aplica RLS):**

```typescript
// Client-side (usa anon key - RLS aplicado)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Usuario debe estar autenticado
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Ahora RLS permitirá acceso
const { data: personas } = await supabase.from('personas').select()
// Retorna todas las personas (no filtrado por organización aún)
```

**Desde Server (bypasses RLS con service_role):**

```typescript
// Server-side con service_role bypasses RLS
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ⚠️ Bypasses RLS
)

const { data } = await supabase.from('personas').select()
// ⚠️ RLS NO se aplica - acceso completo
```

### Verificar Soft Delete

```sql
-- Crear una persona
INSERT INTO business_partners (organizacion_id, tipo_actor, estado)
VALUES ('org-uuid', 'persona', 'activo')
RETURNING id;
-- Resultado: 'bp-uuid-123'

INSERT INTO personas (id, primer_nombre, primer_apellido, tipo_documento, numero_documento)
VALUES ('bp-uuid-123', 'Juan', 'Pérez', 'cedula_ciudadania', '123456789');

-- Verificar que se ve (como usuario autenticado)
SELECT * FROM personas WHERE id = 'bp-uuid-123';
-- Retorna la persona ✅

-- Soft delete
UPDATE business_partners SET eliminado_en = NOW() WHERE id = 'bp-uuid-123';

-- Verificar que ya NO se ve
SELECT * FROM personas WHERE id = 'bp-uuid-123';
-- No retorna nada (filtrada por RLS) ✅
```

### Verificar Bloqueo de Hard Delete

```sql
-- Intentar hard delete (debe fallar)
DELETE FROM personas WHERE id = 'bp-uuid-123';
-- ERROR: permission denied for table personas ✅

DELETE FROM business_partners WHERE id = 'bp-uuid-123';
-- ERROR: permission denied for table business_partners ✅
```

---

## Troubleshooting

### Problema: "No rows returned" siendo usuario autenticado

**Causa 1:** No estás autenticado correctamente

**Diagnóstico:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Usuario:', user)  // Debe retornar objeto, no null
```

**Solución:**
```typescript
// Asegurarse de autenticar primero
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

**Causa 2:** El registro está marcado como eliminado

**Diagnóstico:**
```sql
-- Con service_role (bypasses RLS)
SELECT id, eliminado_en FROM business_partners WHERE id = 'bp-uuid';
```

**Solución:**
```sql
-- Recuperar registro
UPDATE business_partners SET eliminado_en = NULL WHERE id = 'bp-uuid';
```

### Problema: "Permission denied" en DELETE

**Causa:** DELETE está bloqueado por RLS (no hay políticas DELETE)

**Solución:** Usar soft delete
```sql
-- ❌ No funciona
DELETE FROM business_partners WHERE id = 'bp-uuid';

-- ✅ Funciona (soft delete)
UPDATE business_partners SET eliminado_en = NOW() WHERE id = 'bp-uuid';
```

### Problema: Queries lentas con RLS

**Causa:** Subqueries en políticas RLS (especialmente personas/empresas)

**Diagnóstico:**
```sql
EXPLAIN ANALYZE
SELECT * FROM personas;
```

**Optimización:** Ya existe índice en business_partners(id)
```sql
-- Verificar índices existentes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('business_partners', 'personas', 'empresas');
```

### Problema: Bypass accidental de RLS

**Causa:** Usando service_role key en lugar de anon key

**Diagnóstico:**
```typescript
// Verificar qué key se está usando
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Using service_role?', supabaseClient.supabaseKey.startsWith('eyJ'))
```

**Solución:**
```typescript
// ❌ Mal - bypasses RLS
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ Bien - aplica RLS
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

---

## Roadmap Futuro

### Fase 1: Multi-Tenancy (Próximo Paso)

**Objetivo:** Aislar datos por organización

**Tareas:**
1. Crear tabla `profiles`
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     organizacion_id UUID REFERENCES organizations(id) NOT NULL,
     role TEXT DEFAULT 'viewer',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Actualizar políticas de `business_partners`:
   ```sql
   -- Reemplazar política actual
   DROP POLICY "usuarios_pueden_ver_actores" ON business_partners;

   CREATE POLICY "usuarios_ven_actores_de_su_org"
     ON business_partners
     FOR SELECT
     USING (
       organizacion_id IN (
         SELECT organizacion_id FROM profiles WHERE id = auth.uid()
       )
       AND eliminado_en IS NULL
     );
   ```

3. Actualizar políticas de personas, empresas, bp_relaciones similarmente

4. Testing exhaustivo con múltiples organizaciones

**Beneficio:** Seguridad real de multi-tenancy

---

### Fase 2: Roles y Permisos

**Objetivo:** Control granular por rol de usuario

**Roles propuestos:**
- `admin` - Acceso completo a su organización
- `manager` - Lectura/escritura, sin eliminar
- `viewer` - Solo lectura

**Ejemplo de política con roles:**
```sql
-- Solo admins pueden crear business partners
CREATE POLICY "solo_admins_crean_actores"
  ON business_partners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND organizacion_id = business_partners.organizacion_id
    )
  );
```

---

### Fase 3: Auditoría

**Objetivo:** Tracking completo de cambios

**Tabla de auditoría:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Solo lectura, nunca modificar
CREATE POLICY "audit_read_only"
  ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Trigger de auditoría:**
```sql
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Checklist de Implementación

Estado actual del sistema:

- [x] **1. Habilitar RLS en todas las tablas**
  - organizations ✅
  - business_partners ✅
  - personas ✅
  - empresas ✅
  - bp_relaciones ✅

- [x] **2. Crear políticas básicas de SELECT**
  - Requiere autenticación ✅
  - Respeta soft delete ✅

- [x] **3. Crear políticas de INSERT**
  - Requiere autenticación ✅
  - Valida CTI pattern (personas/empresas) ✅

- [x] **4. Crear políticas de UPDATE**
  - Requiere autenticación ✅
  - Respeta soft delete ✅

- [x] **5. Bloquear DELETE (forzar soft delete)**
  - No hay políticas DELETE ✅
  - Hard delete bloqueado ✅

- [ ] **6. Implementar multi-tenancy**
  - Crear tabla profiles ❌
  - Filtrar por organizacion_id ❌
  - Testing de aislamiento ❌

- [x] **7. Documentar políticas**
  - Actualizado este archivo ✅

- [ ] **8. Implementar roles**
  - Campo role en profiles ❌
  - Políticas diferenciadas ❌

- [ ] **9. Implementar auditoría**
  - Tabla audit_log ❌
  - Triggers de auditoría ❌

---

**Ver también:**
- [SCHEMA.md](./SCHEMA.md) - Arquitectura de tablas
- [TABLES.md](./TABLES.md) - Diccionario de datos
- [QUERIES.md](./QUERIES.md) - Ejemplos de queries
