# Row Level Security (RLS) - Políticas de Seguridad

Este documento describe las políticas de Row Level Security (RLS) implementadas en la base de datos para controlar el acceso a los datos a nivel de fila.

## Índice

- [Conceptos Fundamentales](#conceptos-fundamentales)
- [Estado Actual de RLS](#estado-actual-de-rls)
- [Políticas por Tabla](#políticas-por-tabla)
- [Patrones Comunes](#patrones-comunes)
- [Multi-Tenancy](#multi-tenancy)
- [Testing de RLS](#testing-de-rls)
- [Troubleshooting](#troubleshooting)

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

- `organizations` - RLS enabled
- `business_partners` - RLS enabled
- `personas` - RLS enabled
- `empresas` - RLS enabled

### Estado de las Políticas

⚠️ **Estado Actual:** Las tablas tienen RLS habilitado pero **sin políticas definidas**.

**Implicación:**
- Con RLS habilitado pero sin políticas, **ningún usuario puede acceder a los datos** (por defecto niega todo)
- Actualmente el acceso funciona porque se usa el **service_role key** (bypasses RLS)
- Para producción, se deben crear políticas que permitan acceso controlado

### Roadmap de Implementación

**Fase 1: Políticas Básicas (Pendiente)**
- Permitir SELECT/INSERT/UPDATE/DELETE a usuarios autenticados de la misma organización
- Implementar filtrado automático por `organizacion_id`

**Fase 2: Políticas Basadas en Roles (Futuro)**
- Tabla `user_roles` (admin, manager, viewer)
- Políticas diferenciadas por rol
- Restricciones de operaciones según rol

**Fase 3: Auditoría (Futuro)**
- Tabla `audit_log` para tracking de cambios
- Políticas de solo lectura para auditoría

---

## Políticas por Tabla

### `organizations`

**Objetivo:** Cada usuario solo puede ver/modificar las organizaciones a las que pertenece.

#### Políticas Recomendadas

```sql
-- SELECT: Ver solo las organizaciones del usuario
CREATE POLICY "Users can view their own organization"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT: Solo admins pueden crear organizaciones (a implementar con roles)
CREATE POLICY "Only admins can create organizations"
  ON organizations
  FOR INSERT
  WITH CHECK (false);  -- Deshabilitar hasta implementar roles

-- UPDATE: Solo admins de la organización pueden actualizarla
CREATE POLICY "Only org admins can update"
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'  -- Campo a agregar en profiles
    )
  );

-- DELETE: Solo superadmins pueden eliminar organizaciones
CREATE POLICY "Only superadmins can delete organizations"
  ON organizations
  FOR DELETE
  USING (false);  -- Deshabilitar completamente (usar soft delete)
```

---

### `business_partners`

**Objetivo:** Usuarios solo pueden ver/modificar business partners de su organización.

#### Políticas Recomendadas

```sql
-- SELECT: Ver business partners de la organización del usuario
CREATE POLICY "Users can view business partners from their organization"
  ON business_partners
  FOR SELECT
  USING (
    organizacion_id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- INSERT: Crear business partners en la organización del usuario
CREATE POLICY "Users can create business partners in their organization"
  ON business_partners
  FOR INSERT
  WITH CHECK (
    organizacion_id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- UPDATE: Modificar business partners de la organización del usuario
CREATE POLICY "Users can update business partners from their organization"
  ON business_partners
  FOR UPDATE
  USING (
    organizacion_id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- DELETE: Prevenir hard delete (usar soft delete)
CREATE POLICY "Prevent hard delete of business partners"
  ON business_partners
  FOR DELETE
  USING (false);  -- Forzar uso de soft delete (UPDATE eliminado_en)
```

---

### `personas`

**Objetivo:** Usuarios solo pueden ver/modificar personas de su organización (vía business_partners).

#### Políticas Recomendadas

```sql
-- SELECT: Ver personas de la organización del usuario
CREATE POLICY "Users can view personas from their organization"
  ON personas
  FOR SELECT
  USING (
    id IN (
      SELECT bp.id
      FROM business_partners bp
      INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
      WHERE p.id = auth.uid()
    )
  );

-- INSERT: Crear personas en la organización del usuario
CREATE POLICY "Users can create personas in their organization"
  ON personas
  FOR INSERT
  WITH CHECK (
    id IN (
      SELECT bp.id
      FROM business_partners bp
      INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
      WHERE p.id = auth.uid()
    )
  );

-- UPDATE: Modificar personas de la organización del usuario
CREATE POLICY "Users can update personas from their organization"
  ON personas
  FOR UPDATE
  USING (
    id IN (
      SELECT bp.id
      FROM business_partners bp
      INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
      WHERE p.id = auth.uid()
    )
  );

-- DELETE: Prevenir hard delete
CREATE POLICY "Prevent hard delete of personas"
  ON personas
  FOR DELETE
  USING (false);
```

---

### `empresas`

**Objetivo:** Usuarios solo pueden ver/modificar empresas de su organización (vía business_partners).

#### Políticas Recomendadas

```sql
-- SELECT: Ver empresas de la organización del usuario
CREATE POLICY "Users can view empresas from their organization"
  ON empresas
  FOR SELECT
  USING (
    id IN (
      SELECT bp.id
      FROM business_partners bp
      INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
      WHERE p.id = auth.uid()
    )
  );

-- INSERT: Crear empresas en la organización del usuario
CREATE POLICY "Users can create empresas in their organization"
  ON empresas
  FOR INSERT
  WITH CHECK (
    id IN (
      SELECT bp.id
      FROM business_partners bp
      INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
      WHERE p.id = auth.uid()
    )
  );

-- UPDATE: Modificar empresas de la organización del usuario
CREATE POLICY "Users can update empresas from their organization"
  ON empresas
  FOR UPDATE
  USING (
    id IN (
      SELECT bp.id
      FROM business_partners bp
      INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
      WHERE p.id = auth.uid()
    )
  );

-- DELETE: Prevenir hard delete
CREATE POLICY "Prevent hard delete of empresas"
  ON empresas
  FOR DELETE
  USING (false);
```

---

## Patrones Comunes

### Patrón Multi-Tenancy

**Estructura:**
```sql
-- Política típica de multi-tenancy
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (
    organizacion_id IN (
      SELECT organizacion_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );
```

**Explicación:**
1. `auth.uid()` obtiene el ID del usuario autenticado
2. Se busca el `organizacion_id` del usuario en `profiles`
3. Solo se permiten filas donde `organizacion_id` coincida

### Patrón de Prevención de Hard Delete

**Uso:** Forzar soft delete en todas las tablas

```sql
CREATE POLICY "prevent_hard_delete"
  ON table_name
  FOR DELETE
  USING (false);  -- Niega todas las operaciones DELETE
```

**Alternativa (permitir solo a superadmins):**
```sql
CREATE POLICY "only_superadmin_delete"
  ON table_name
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'superadmin'
    )
  );
```

### Patrón Basado en Roles

**Estructura (a implementar en el futuro):**
```sql
-- Verificar rol del usuario
CREATE POLICY "admin_only_update"
  ON table_name
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );
```

### Patrón de Propietario (Owner)

**Uso:** Solo el creador puede modificar

```sql
-- Agregar columna created_by UUID a la tabla
ALTER TABLE table_name ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Política: Solo el propietario puede actualizar
CREATE POLICY "owner_can_update"
  ON table_name
  FOR UPDATE
  USING (created_by = auth.uid());
```

---

## Multi-Tenancy

### Arquitectura de Multi-Tenancy

El sistema implementa multi-tenancy a nivel de **organización** mediante:

1. **Tabla `organizations`:** Define las organizaciones
2. **Tabla `profiles`:** Usuario pertenece a una organización
3. **Campo `organizacion_id`:** En todas las tablas de negocio
4. **RLS Policies:** Filtran automáticamente por organización

### Flujo de Aislamiento

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

### Ejemplo Completo de Multi-Tenancy

```sql
-- 1. Usuario se autentica
-- Supabase Auth retorna JWT con auth.uid() = 'user-uuid-123'

-- 2. Query del usuario
SELECT * FROM personas;

-- 3. RLS aplica automáticamente:
SELECT * FROM personas
WHERE id IN (
  SELECT bp.id
  FROM business_partners bp
  INNER JOIN profiles p ON bp.organizacion_id = p.organizacion_id
  WHERE p.id = 'user-uuid-123'  -- auth.uid()
);

-- Resultado: Solo personas de la organización del usuario
```

### Ventajas del Enfoque

✅ **Transparente:** Desarrolladores no escriben filtros manualmente
✅ **Seguro:** Imposible acceder datos de otra organización
✅ **Escalable:** Agregar organizaciones no requiere cambios en código
✅ **Auditable:** PostgreSQL logs registran todos los accesos

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
WHERE tablename = 'business_partners';
```

### Probar Políticas como Usuario

**Opción 1: Usando `SET LOCAL`**

```sql
-- Simular ser un usuario específico
BEGIN;

-- Setear el usuario de la sesión
SET LOCAL request.jwt.claim.sub = 'user-uuid-aqui';

-- Ejecutar queries (RLS aplicará)
SELECT * FROM business_partners;

ROLLBACK;
```

**Opción 2: Usando Supabase Client**

```typescript
// Client-side (usa anon key - RLS aplicado)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('personas').select()
// RLS se aplica automáticamente
```

```typescript
// Server-side (usa service_role - bypasses RLS)
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('personas').select()
// ⚠️ RLS NO se aplica (admin access)
```

### Verificar Aislamiento de Organizaciones

```sql
-- Crear 2 usuarios en diferentes organizaciones
INSERT INTO auth.users (id, email) VALUES
  ('user-1', 'user1@org1.com'),
  ('user-2', 'user2@org2.com');

INSERT INTO profiles (id, organizacion_id) VALUES
  ('user-1', 'org-1'),
  ('user-2', 'org-2');

-- Crear business partners en cada organización
INSERT INTO business_partners (organizacion_id, tipo_actor) VALUES
  ('org-1', 'persona'),  -- bp-1
  ('org-2', 'persona');  -- bp-2

-- Probar como user-1 (solo debe ver bp-1)
BEGIN;
SET LOCAL request.jwt.claim.sub = 'user-1';
SELECT * FROM business_partners;  -- Solo retorna bp-1
ROLLBACK;

-- Probar como user-2 (solo debe ver bp-2)
BEGIN;
SET LOCAL request.jwt.claim.sub = 'user-2';
SELECT * FROM business_partners;  -- Solo retorna bp-2
ROLLBACK;
```

---

## Troubleshooting

### Problema: "No rows returned" pero hay datos

**Causa:** RLS habilitado sin políticas = niega todo por defecto

**Solución temporal (desarrollo):**
```sql
-- Deshabilitar RLS temporalmente
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- O crear política permisiva temporal
CREATE POLICY "temp_allow_all"
  ON table_name
  FOR ALL
  USING (true);
```

**Solución permanente:**
```sql
-- Implementar políticas correctas (ver secciones anteriores)
```

### Problema: Queries muy lentas con RLS

**Causa:** Subqueries complejas en políticas RLS

**Diagnóstico:**
```sql
-- Ver plan de ejecución
EXPLAIN ANALYZE
SELECT * FROM personas;
```

**Optimización:**
```sql
-- Opción 1: Agregar índices
CREATE INDEX idx_profiles_organizacion
  ON profiles(organizacion_id)
  WHERE deleted_at IS NULL;

-- Opción 2: Simplificar política con función
CREATE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organizacion_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE POLICY "simplified_policy"
  ON business_partners
  FOR SELECT
  USING (organizacion_id = get_user_org_id());
```

### Problema: "Permission denied" en operación válida

**Causa:** Política tiene condición muy restrictiva

**Diagnóstico:**
```sql
-- Ver políticas aplicadas
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Probar condición manualmente
SELECT
  id,
  organizacion_id IN (
    SELECT organizacion_id FROM profiles WHERE id = auth.uid()
  ) AS pasaria_rls
FROM business_partners;
```

**Solución:** Ajustar la condición de la política

### Problema: Bypass de RLS en Server Actions

**Causa:** Usando `service_role` key que bypasses RLS

**Solución:**
```typescript
// ❌ Mal - bypasses RLS
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ Bien - aplica RLS
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // Usa anon key con user JWT
```

### Problema: Usuario no puede ver sus propios datos

**Causa:** `profiles.organizacion_id` es NULL o no coincide

**Diagnóstico:**
```sql
-- Verificar profile del usuario
SELECT id, organizacion_id FROM profiles WHERE id = 'user-uuid';

-- Verificar business_partners de esa org
SELECT id, organizacion_id FROM business_partners
WHERE organizacion_id = (SELECT organizacion_id FROM profiles WHERE id = 'user-uuid');
```

**Solución:** Asignar organización al usuario
```sql
UPDATE profiles
SET organizacion_id = 'org-uuid'
WHERE id = 'user-uuid';
```

---

## Checklist de Implementación

Al implementar RLS en producción, seguir estos pasos:

- [ ] **1. Habilitar RLS en todas las tablas**
  ```sql
  ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **2. Crear políticas de SELECT**
  - Permitir usuarios ver datos de su organización

- [ ] **3. Crear políticas de INSERT**
  - Permitir crear solo en organización del usuario

- [ ] **4. Crear políticas de UPDATE**
  - Permitir modificar solo datos de su organización

- [ ] **5. Deshabilitar DELETE (forzar soft delete)**
  ```sql
  CREATE POLICY "prevent_delete" ON table_name FOR DELETE USING (false);
  ```

- [ ] **6. Testing exhaustivo**
  - Probar como usuarios de diferentes organizaciones
  - Verificar aislamiento correcto
  - Medir performance

- [ ] **7. Documentar políticas**
  - Actualizar este archivo con políticas implementadas
  - Documentar excepciones o casos especiales

- [ ] **8. Monitoreo**
  - Logs de acceso denegado
  - Performance de queries con RLS
  - Alertas de intentos de acceso no autorizado

---

## Próximos Pasos

**Fase 1: Implementación Básica**
1. Crear políticas de multi-tenancy para todas las tablas
2. Testing con múltiples organizaciones
3. Documentar políticas creadas

**Fase 2: Roles y Permisos**
1. Agregar columna `role` a `profiles`
2. Crear políticas diferenciadas por rol
3. Implementar roles: admin, manager, viewer

**Fase 3: Auditoría**
1. Tabla `audit_log` para tracking
2. Trigger para registrar cambios
3. RLS de solo lectura para auditoría

---

**Ver también:**
- [SCHEMA.md](./SCHEMA.md) - Arquitectura de tablas
- [TABLES.md](./TABLES.md) - Diccionario de datos
- [QUERIES.md](./QUERIES.md) - Ejemplos de queries
