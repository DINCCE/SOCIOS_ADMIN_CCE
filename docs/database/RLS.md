# Seguridad y RBAC - SOCIOS_ADMIN

## Documentación de Roles, Permisos y Políticas RLS

Este documento describe el modelo de control de acceso basado en roles (RBAC), las políticas de seguridad a nivel de fila (RLS) y cómo se implementan en la base de datos.

---

## Índice

1. [Visión General](#1-visión-general)
2. [Roles del Sistema](#2-roles-del-sistema)
3. [Matriz de Permisos](#3-matriz-de-permisos)
4. [Funciones RBAC](#4-funciones-rbac)
5. [Políticas RLS por Tabla](#5-políticas-rls-por-tabla)
6. [Flujo de Autorización](#6-flujo-de-autorización)
7. [Buenas Prácticas](#7-buenas-prácticas)

---

## 1. Visión General

### Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                        Capa de Aplicación                       │
│                    (JWT con auth.uid())                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Capa de Base de Datos                      │
│                                                                  │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────┐  │
│  │ config_roles │ ───▶ │ config_roles_    │ ───▶ │   RLS    │  │
│  │              │      │ permisos         │      │ Policies │  │
│  └──────────────┘      └──────────────────┘      └──────────┘  │
│         │                      │                                │
│         │                      ▼                                │
│         │              ┌──────────────┐                        │
│         └─────────────▶│ can_user_v2 │                        │
│                        │ (función)    │                        │
│                        └──────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes del Modelo RBAC

1. **config_roles**: Define los roles del sistema
2. **config_roles_permisos**: Matriz de permisos (role × resource × action)
3. **config_organizacion_miembros**: Asigna usuarios a organizaciones con roles
4. **Funciones RBAC**: Verifican permisos y membresía
5. **Políticas RLS**: Aplican restricciones a nivel de fila

---

## 2. Roles del Sistema

### Tabla: config_roles

| Role | Descripción | Acceso a config_* | Acceso a negocio |
|------|-------------|-------------------|------------------|
| **owner** | Propietario de la organización | ✅ Total | ✅ Total |
| **admin** | Administrador de la organización | ❌ Ninguno | ✅ Total |
| **analyst** | Analista de datos | ❌ Ninguno | ✅ Lectura/Escritura* |
| **auditor** | Auditor de sistema | ❌ Ninguno | ✅ Solo lectura |

*\* Analyst puede insert/update pero NO delete*

### Matriz de Acceso por Recurso

| Recurso | owner | admin | analyst | auditor |
|---------|-------|-------|---------|---------|
| **config_organizaciones** | ✅ CRUD | ❌ | ❌ | ❌ |
| **config_organizacion_miembros** | ✅ CRUD | ❌ | ❌ | ❌ |
| **config_roles** | ✅ CRUD | ❌ | ❌ | ❌ |
| **config_roles_permisos** | ✅ CRUD | ❌ | ❌ | ❌ |
| **config_ciudades** | ✅ CRUD | ❌ | ❌ | ❌ |
| **dm_actores** | ✅ CRUD | ✅ CRUD | ✅ CRU | ✅ R |
| **dm_acciones** | ✅ CRUD | ✅ CRUD | ✅ CRU | ✅ R |
| **vn_asociados** | ✅ CRUD | ✅ CRUD | ✅ CRU | ✅ R |
| **vn_relaciones_actores** | ✅ CRUD | ✅ CRUD | ✅ CRU | ✅ R |
| **tr_doc_comercial** | ✅ CRUD | ✅ CRUD | ✅ CRU | ✅ R |
| **tr_tareas** | ✅ CRUD | ✅ CRUD | ✅ CRU | ✅ R |

**Leyenda**: C=Create, R=Read, U=Update, D=Delete

---

## 3. Matriz de Permisos

### Tabla: config_roles_permisos

**Total de permisos configurados**: 92

**Estructura**:
```sql
(role, resource, action, allow)
```

### Permisos por Rol

#### owner (53 permisos)

Acceso completo a todos los recursos:

| Resource | Acciones |
|----------|----------|
| config_organizaciones | select, insert, update, delete |
| config_organizacion_miembros | select, insert, update, delete |
| config_roles | select, insert, update, delete |
| config_roles_permisos | select, insert, update, delete |
| config_ciudades | select, insert, update, delete |
| dm_actores | select, insert, update, delete |
| dm_acciones | select, insert, update, delete |
| tr_doc_comercial | select, insert, update, delete |
| tr_tareas | select, insert, update, delete |
| vn_asociados | select, insert, update, delete |
| vn_relaciones_actores | select, insert, update, delete |

#### admin (24 permisos)

Acceso completo solo a tablas de negocio:

| Resource | Acciones |
|----------|----------|
| dm_actores | select, insert, update, delete |
| dm_acciones | select, insert, update, delete |
| tr_doc_comercial | select, insert, update, delete |
| tr_tareas | select, insert, update, delete |
| vn_asociados | select, insert, update, delete |
| vn_relaciones_actores | select, insert, update, delete |

#### analyst (18 permisos)

Acceso limitado (sin delete):

| Resource | Acciones |
|----------|----------|
| dm_actores | select, insert, update |
| dm_acciones | select, insert, update |
| tr_doc_comercial | select, insert, update |
| tr_tareas | select, insert, update |
| vn_asociados | select, insert, update |
| vn_relaciones_actores | select, insert, update |

#### auditor (6 permisos)

Solo lectura:

| Resource | Acciones |
|----------|----------|
| dm_actores | select |
| dm_acciones | select |
| tr_doc_comercial | select |
| tr_tareas | select |
| vn_asociados | select |
| vn_relaciones_actores | select |

---

## 4. Funciones RBAC

### Funciones Principales

#### is_org_member()

Verifica si un usuario es miembro de una organización.

```sql
is_org_member(p_org_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS boolean
```

**Uso típico**:
```sql
SELECT * FROM dm_actores
WHERE is_org_member(organizacion_id, auth.uid());
```

**Lógica**:
```sql
EXISTS (
  SELECT 1 FROM config_organizacion_miembros om
  WHERE om.organization_id = p_org_id
    AND om.user_id = COALESCE(p_user_id, auth.uid())
    AND om.eliminado_en IS NULL
)
```

---

#### is_org_admin_v2()

Verifica si un usuario tiene rol de owner o admin en una organización.

```sql
is_org_admin_v2(p_org_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS boolean
```

**Lógica**:
```sql
EXISTS (
  SELECT 1 FROM config_organizacion_miembros om
  WHERE om.organization_id = p_org_id
    AND om.user_id = COALESCE(p_user_id, auth.uid())
    AND om.eliminado_en IS NULL
    AND om.role IN ('owner', 'admin')
)
```

---

#### is_org_owner_v2()

Verifica si un usuario es owner de una organización.

```sql
is_org_owner_v2(org_id uuid)
RETURNS boolean
```

**Lógica**:
```sql
EXISTS (
  SELECT 1 FROM config_organizacion_miembros om
  WHERE om.organization_id = org_id
    AND om.user_id = auth.uid()
    AND om.eliminado_en IS NULL
    AND om.role = 'owner'
)
```

---

#### can_user_v2()

**Función central de autorización**. Verifica si un usuario tiene permiso para una acción sobre un recurso en una organización.

```sql
can_user_v2(p_resource text, p_action text, p_org uuid)
RETURNS boolean
```

**Lógica**:
```sql
COALESCE(EXISTS (
  SELECT 1
  FROM config_organizacion_miembros om
  JOIN config_roles_permisos rp ON rp.role = om.role
  WHERE om.user_id = auth.uid()
    AND om.organization_id = p_org
    AND rp.resource = p_resource
    AND rp.action = p_action
    AND rp.allow = true
), false)
```

**Uso en políticas RLS**:
```sql
-- Solo SELECT si tiene permiso
CREATE POLICY dm_actores_select ON dm_actores
  FOR SELECT TO authenticated
  USING (can_user_v2('dm_actores', 'select', organizacion_id));
```

---

#### can_view_org_membership_v2()

Verifica si un usuario puede ver la membresía de una organización (para visibility de miembros).

```sql
can_view_org_membership_v2(p_org uuid)
RETURNS boolean
```

---

#### org_has_other_owner_v2()

Verifica si existe otro owner en la organización (útil al cambiar rol del último owner).

```sql
org_has_other_owner_v2(p_org_id uuid, p_excluded_user_id uuid DEFAULT NULL)
RETURNS boolean
```

---

#### get_user_orgs()

Retorna todas las organizaciones a las que pertenece el usuario actual.

```sql
get_user_orgs()
RETURNS SETOF uuid
```

---

#### user_role_in_org_v2()

Retorna el rol de un usuario en una organización específica.

```sql
user_role_in_org_v2(p_org uuid)
RETURNS text
```

---

### Funciones SECURITY DEFINER

Las siguientes funciones usan `SECURITY DEFINER` para ejecutarse con privilegios elevados y acceder a datos跨 esquema:

- `can_user_v2()` - Verifica permisos跨 esquema
- `is_org_member()` - Accede a config_organizacion_miembros
- `is_org_admin_v2()` - Accede a config_organizacion_miembros
- `can_view_org_membership_v2()` - Visibility control

---

## 5. Políticas RLS por Tabla

### Patrones de Políticas

Todas las tablas siguen estos patrones:

1. **Multi-tenancy**: Filtrar por `organizacion_id` del usuario
2. **Soft Delete**: Excluir registros con `eliminado_en IS NOT NULL`
3. **Autorización**: Verificar permisos via `can_user_v2()`
4. **Membresía**: Verificar que el usuario pertenezca a la organización

---

### Tablas de Configuración

#### config_organizaciones

**Políticas**:

| Política | Comando | Rol | Condición |
|----------|---------|-----|-----------|
| config_organizaciones_select | SELECT | authenticated | Soft delete + can_user_v2 |
| config_organizaciones_insert | INSERT | authenticated | can_user_v2 |
| config_organizaciones_update | UPDATE | authenticated | Soft delete + can_user_v2 |
| config_organizaciones_delete | DELETE | authenticated | can_user_v2 |

**Ejemplo de política SELECT**:
```sql
CREATE POLICY config_organizaciones_select ON config_organizaciones
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('config_organizaciones', 'select', id)
  );
```

**Nota**: Todas las políticas de config_organizaciones usan `can_user_v2()` para verificar permisos desde [config_roles_permisos](config_roles_permisos), manteniendo consistencia con las tablas de negocio.

---

#### config_organizacion_miembros

**Políticas**:

| Política | Comando | Rol | Condición |
|----------|---------|-----|-----------|
| config_organizacion_miembros_select | SELECT | authenticated | Soft delete + can_user_v2 |
| config_organizacion_miembros_insert | INSERT | authenticated | can_user_v2 |
| config_organizacion_miembros_update | UPDATE | authenticated | Soft delete + can_user_v2 |
| config_organizacion_miembros_delete | DELETE | authenticated | Soft delete + can_user_v2 |

**Ejemplo de política SELECT**:

```sql
CREATE POLICY config_organizacion_miembros_select ON config_organizacion_miembros
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('config_organizacion_miembros', 'select', organization_id)
  );
```

**Nota**: Todas las políticas usan `can_user_v2()` para verificar permisos desde [config_roles_permisos](config_roles_permisos).

---

#### config_roles y config_roles_permisos

**Restricción**: Solo owners y admins pueden modificar estas tablas (según permisos en config_roles_permisos).

**Políticas config_roles**:

| Política | Comando | Rol | Condición |
|----------|---------|-----|-----------|
| config_roles_select | SELECT | authenticated | Soft delete + permiso basado en rol |
| config_roles_insert | INSERT | authenticated | Permiso basado en rol |
| config_roles_update | UPDATE | authenticated | Soft delete + permiso basado en rol |
| config_roles_delete | DELETE | authenticated | Permiso basado en rol |

**Políticas config_roles_permisos**:

| Política | Comando | Rol | Condición |
|----------|---------|-----|-----------|
| config_roles_permisos_select | SELECT | authenticated | Soft delete + permiso basado en rol |
| config_roles_permisos_insert | INSERT | authenticated | Permiso basado en rol |
| config_roles_permisos_update | UPDATE | authenticated | Soft delete + permiso basado en rol |
| config_roles_permisos_delete | DELETE | authenticated | Permiso basado en rol |

**Nota**: Estas tablas no tienen `organizacion_id`. Las políticas verifican si el usuario tiene el permiso requerido en CUALQUIER organización usando una subquery sobre [config_roles_permisos](config_roles_permisos).

---

#### config_ciudades

**Políticas**:

| Política                       | Comando | Rol           | Condición                     |
|--------------------------------|---------|---------------|-------------------------------|
| config_ciudades_select         | SELECT  | authenticated | Soft delete filter            |
| config_ciudades_insert         | INSERT  | authenticated | Owner de cualquier org         |
| config_ciudades_update         | UPDATE  | authenticated | Owner de cualquier org         |
| config_ciudades_delete         | DELETE  | authenticated | Owner de cualquier org         |

**Modelo RBAC**: Configuración global sin `organizacion_id`. Según [config_roles_permisos](#3-matriz-de-permisos), SOLO usuarios con rol de `owner` en cualquier organización pueden modificar ciudades. Los roles `admin`, `analyst` y `auditor` NO tienen permisos para esta tabla.

```sql
-- SELECT: Solo soft delete (acceso público)
CREATE POLICY config_ciudades_select ON config_ciudades
  FOR SELECT TO authenticated
  USING (eliminado_en IS NULL);

-- INSERT/UPDATE/DELETE: Solo owners
CREATE POLICY config_ciudades_insert ON config_ciudades
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );
```

**Nota**: Corregido en migración `202501151_fix_config_rls_policies.sql`. Anteriormente permitía `admin` y `owner`, ahora solo `owner` según config_roles_permisos.

---

### Tablas de Negocio

#### dm_actores

**Políticas**:

| Política | Comando | Condición |
|----------|---------|-----------|
| dm_actores_select | SELECT | Soft delete + permiso via can_user_v2 |

```sql
CREATE POLICY dm_actores_select ON dm_actores
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('dm_actores', 'select', organizacion_id)
  );
```

---

#### dm_acciones

**Políticas**:

| Política | Comando | Condición |
|----------|---------|-----------|
| dm_acciones_select | SELECT | can_user_v2('dm_acciones', 'select', org) |
| dm_acciones_insert | INSERT | true (con validación en app) |
| dm_acciones_update | UPDATE | can_user_v2('dm_acciones', 'update', org) |
| dm_acciones_delete | DELETE | can_user_v2('dm_acciones', 'delete', org) |

---

#### vn_asociados

**Recurso**: `asignaciones_acciones`

**Políticas**:

| Política | Comando | Condición |
|----------|---------|-----------|
| vn_asociados_select | SELECT | can_user_v2('asignaciones_acciones', 'select', org) |
| vn_asociados_insert | INSERT | can_user_v2('asignaciones_acciones', 'insert', org) |
| vn_asociados_update | UPDATE | can_user_v2('asignaciones_acciones', 'update', org) |
| vn_asociados_delete | DELETE | can_user_v2('asignaciones_acciones', 'delete', org) |

**Nota**: Todas las políticas usan `can_user_v2()` con el recurso `asignaciones_acciones`.

---

#### vn_relaciones_actores

**Recurso**: `vn_relaciones_actores`

**Políticas**:

| Política | Comando | Condición |
|----------|---------|-----------|
| vn_relaciones_actores_select | SELECT | Soft delete + can_user_v2 |
| vn_relaciones_actores_insert | INSERT | can_user_v2 |
| vn_relaciones_actores_update | UPDATE | can_user_v2 |
| vn_relaciones_actores_delete | DELETE | can_user_v2 |

```sql
CREATE POLICY vn_relaciones_actores_select ON vn_relaciones_actores
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('vn_relaciones_actores', 'select', organizacion_id)
  );
```

---

#### tr_doc_comercial

**Políticas**:

| Política | Comando | Condición |
|----------|---------|-----------|
| tr_doc_comercial_select | SELECT | Soft delete + can_user_v2 |

```sql
CREATE POLICY tr_doc_comercial_select ON tr_doc_comercial
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('tr_doc_comercial', 'select', organizacion_id)
  );
```

---

#### tr_tareas

**Políticas**: Similar a tr_doc_comercial

```sql
CREATE POLICY tr_tareas_select ON tr_tareas
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('tr_tareas', 'select', organizacion_id)
  );
```

---

## 6. Flujo de Autorización

### Proceso de Verificación

```
┌─────────────────┐
│ Usuario hace    │
│ request con JWT │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 1. auth.uid() extrae user_id del JWT    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 2. RLS Policy se activa automaticamente         │
│    - Filtra por organizacion_id                 │
│    - Excluye eliminado_en IS NOT NULL           │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. can_user_v2() verifica:                              │
│    a) Usuario es miembro de la organización             │
│    b) Tiene rol con permiso para el recurso             │
│    c) El permiso permite la acción específica           │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Query ejecutado │  ✅ o ❌
└─────────────────┘
```

### Ejemplo Completo

**Usuario**: `user_123` con rol `admin` en `org_456`

**Query**:
```sql
UPDATE dm_actores
SET email_principal = 'nuevo@email.com'
WHERE id = 'actor_789';
```

**Flujo de autorización**:

1. **RLS Policy activada**: `dm_actores_update`
2. **Verificación 1** - Soft delete:
   ```sql
   eliminado_en IS NULL  -- ✅ Pass
   ```
3. **Verificación 2** - Permiso:
   ```sql
   can_user_v2('dm_actores', 'update', 'org_456')
   ```
4. **can_user_v2() ejecuta**:
   ```sql
   SELECT 1
   FROM config_organizacion_miembros om
   JOIN config_roles_permisos rp ON rp.role = om.role
   WHERE om.user_id = 'user_123'
     AND om.organization_id = 'org_456'  -- ✅ Miembro
     AND rp.resource = 'dm_actores'      -- ✅ Recurso existe
     AND rp.action = 'update'            -- ✅ Acción permitida
     AND rp.allow = true                 -- ✅ Permiso concedido
     AND om.role = 'admin'               -- ✅ Rol tiene permiso
   ```
5. **Resultado**: ✅ Update permitido

---

## 7. Buenas Prácticas

### Para Desarrolladores

#### 1. Usar siempre can_user_v2() en políticas RLS

```sql
-- ✅ Correcto
CREATE POLICY tabla_select ON tabla FOR SELECT TO authenticated
  USING (can_user_v2('tabla', 'select', organizacion_id));

-- ❌ Incorrecto (no verifica permisos granulares)
CREATE POLICY tabla_select ON tabla FOR SELECT TO authenticated
  USING (is_org_member(organizacion_id));
```

#### 2. Nunca confiar solo en la aplicación

La seguridad debe estar en la BD. Nunca asumas que la app filtra correctamente.

```sql
-- ❌ Nunca hacer esto
-- "La app ya filtra por organizacion_id"
SELECT * FROM dm_actores;  -- Sin RLS, ve todo

-- ✅ Dejar que RLS filtre
SELECT * FROM dm_actores;  -- RLS filtra automaticamente
```

#### 3. Soft Delete siempre

Todas las políticas deben excluir registros eliminados:

```sql
-- ✅ Correcto
USING (eliminado_en IS NULL AND can_user_v2(...))

-- ❌ Olvida soft delete
USING (can_user_v2(...))
```

#### 4. Usar funciones SECURITY DEFINER cuando sea necesario

Si una función necesita acceder a datos跨 esquema o usar auth.uid():

```sql
CREATE FUNCTION mi_funcion()
RETURNS ...
SECURITY DEFINER  -- Importante
SET search_path TO 'pg_catalog', 'public'
AS $$
  ...
$$;
```

#### 5. No usar bypass de RLS en producción

```sql
-- ❌ Peligroso
SET local row_security = off;  -- Desactiva RLS

-- ✅ Para testing únicamente
SET local row_security = off;
-- Hacer pruebas
RESET row_security;
```

---

### Para Administradores

#### 1. Auditar permisos regularmente

```sql
-- Ver permisos de un rol
SELECT resource, action, allow
FROM config_roles_permisos
WHERE role = 'admin'
  AND eliminado_en IS NULL
ORDER BY resource, action;
```

#### 2. Verificar membresías

```sql
-- Ver todos los miembros de una org
SELECT u.email, om.role, om.creado_en
FROM auth.users u
JOIN config_organizacion_miembros om ON om.user_id = u.id
WHERE om.organization_id = 'org_uuid'
  AND om.eliminado_en IS NULL;
```

#### 3. Monitorear intentos de acceso no autorizado

```sql
-- PostgreSQL logs
-- Buscar errores de permisos denegados
SELECT * FROM pg_stat_statements
WHERE query LIKE '%permission denied%';
```

---

### Testing de Seguridad

#### Casos de prueba

1. **Multi-tenancy**: Usuario A no puede ver datos de organización B
2. **Role-based**: Analyst no puede eliminar (solo owner/admin)
3. **Soft Delete**: Queries no retornan registros eliminados
4. **Auditor**: Auditor solo puede leer, no escribir

#### Ejemplo de test

```sql
-- Test: Analyst no puede eliminar
BEGIN;
  -- Setup
  INSERT INTO config_organizacion_miembros
  VALUES ('test_user', 'test_org', 'analyst');

  -- Test
  DELETE FROM dm_actores WHERE id = 'test_actor';

  -- Expected: ERROR - permission denied
ROLLBACK;
```

---

## Documentos Relacionados

- [OVERVIEW.md](OVERVIEW.md) - Visión general de la base de datos
- [TABLES.md](TABLES.md) - Documentación detallada de tablas
- [FUNCTIONS.md](FUNCTIONS.md) - Documentación de funciones y procedimientos

---

## Referencias Rápidas

### Resumen de Recursos

| Resource | Descripción |
|----------|-------------|
| config_organizaciones | Organizaciones del sistema |
| config_organizacion_miembros | Membresías de usuarios |
| config_roles | Definición de roles |
| config_roles_permisos | Permisos granulares |
| config_ciudades | Catálogo de ciudades |
| dm_actores | Business Partners (personas/empresas) |
| dm_acciones | Acciones del club (títulos) |
| asignaciones_acciones | Asignación de acciones a socios |
| bp_relaciones | Relaciones entre actores |
| tr_doc_comercial | Documentos comerciales |
| tr_tareas | Tareas del sistema |

### Resumen de Acciones

| Action | Descripción |
|--------|-------------|
| select | Leer registros |
| insert | Crear registros |
| update | Modificar registros |
| delete | Eliminar registros |

### Resumen de Roles

| Role | Nivel de acceso |
|------|----------------|
| owner | Total (incluye config) |
| admin | Total en negocio solamente |
| analyst | Lectura/escritura sin delete |
| auditor | Solo lectura |
