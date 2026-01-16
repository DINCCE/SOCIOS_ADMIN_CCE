# Funciones y Procedimientos - SOCIOS_ADMIN

## Documentación Completa de Funciones PostgreSQL

Este documento describe todas las funciones y procedimientos almacenados en la base de datos, incluyendo funciones de seguridad, negocio, utilidades y triggers.

---

## Índice

1. [Funciones de Seguridad RBAC](#1-funciones-de-seguridad-rbac)
2. [Funciones de Negocio](#2-funciones-de-negocio)
3. [Funciones de Validación](#3-funciones-de-validación)
4. [Funciones de Utilidad](#4-funciones-de-utilidad)
5. [Triggers](#5-triggers)
6. [Funciones del Sistema](#6-funciones-del-sistema)

---

## 1. Funciones de Seguridad RBAC

### is_org_member()

Verifica si un usuario es miembro de una organización.

**Firma**:
```sql
is_org_member(p_org_id uuid, p_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
```

**Parámetros**:
- `p_org_id`: UUID de la organización a verificar
- `p_user_id`: UUID del usuario (opcional, default: `auth.uid()`)

**Retorna**: `true` si el usuario es miembro activo de la organización

**Modo de seguridad**: `SECURITY DEFINER`

**Ejemplo de uso**:
```sql
-- Verificar si el usuario actual es miembro
SELECT is_org_member('org_uuid');

-- Verificar si otro usuario es miembro
SELECT is_org_member('org_uuid', 'user_uuid');
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

### is_org_admin_v2()

Verifica si un usuario tiene rol de **owner** o **admin** en una organización.

**Firma**:
```sql
is_org_admin_v2(p_org_id uuid, p_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
```

**Parámetros**:
- `p_org_id`: UUID de la organización
- `p_user_id`: UUID del usuario (opcional)

**Retorna**: `true` si el usuario tiene rol `owner` o `admin`

**Modo de seguridad**: `SECURITY DEFINER`

**Ejemplo de uso**:
```sql
-- Solo admins pueden modificar organizaciones
UPDATE config_organizaciones
SET nombre = 'Nuevo Nombre'
WHERE id = 'org_uuid'
  AND is_org_admin_v2(id);
```

---

### is_org_owner_v2()

Verifica si un usuario es **owner** de una organización.

**Firma**:
```sql
is_org_owner_v2(org_id uuid)
RETURNS boolean
```

**Parámetros**:
- `org_id`: UUID de la organización

**Retorna**: `true` si el usuario es owner

**Modo de seguridad**: `SECURITY DEFINER`

**Uso típico**: Proteger operaciones críticas que solo owners pueden realizar.

**Ejemplo**:
```sql
-- Solo owners pueden eliminar organizaciones
DELETE FROM config_organizaciones
WHERE id = 'org_uuid'
  AND is_org_owner_v2(id);
```

---

### can_user_v2()

**Función central de autorización**. Verifica si un usuario tiene permiso para una acción sobre un recurso en una organización.

**Firma**:
```sql
can_user_v2(p_resource text, p_action text, p_org uuid)
RETURNS boolean
```

**Parámetros**:
- `p_resource`: Nombre del recurso (ej: `'dm_actores'`, `'tr_doc_comercial'`)
- `p_action`: Acción a verificar (`'select'`, `'insert'`, `'update'`, `'delete'`)
- `p_org`: UUID de la organización

**Retorna**: `true` si el usuario tiene el permiso

**Modo de seguridad**: `SECURITY DEFINER`

**Estabilidad**: `STABLE` (puede ser usado en WHERE clauses)

**Ejemplo de uso**:
```sql
-- Verificar si se puede seleccionar dm_actores
SELECT * FROM dm_actores
WHERE can_user_v2('dm_actores', 'select', organizacion_id);
```

**Lógica**:
```sql
COALESCE(EXISTS (
  SELECT 1
  FROM config_organizacion_miembros om
  JOIN config_roles_permisos rp ON rp.role = om.role
  WHERE om.user_id = auth.uid()
    AND om.organization_id = p_org
    AND om.eliminado_en IS NULL
    AND rp.eliminado_en IS NULL
    AND rp.resource = p_resource
    AND rp.action = p_action
    AND rp.allow = true
), false)
```

**Recursos válidos**:
- `config_organizaciones`, `config_organizacion_miembros`, `config_roles`, `config_roles_permisos`, `config_ciudades`
- `dm_actores`, `dm_acciones`
- `asignaciones_acciones` (vn_asociados)
- `bp_relaciones` (vn_relaciones_actores)
- `tr_doc_comercial`, `tr_tareas`

---

### can_view_org_membership_v2()

Verifica si un usuario puede ver la membresía de una organización (para visibility de miembros).

**Firma**:
```sql
can_view_org_membership_v2(p_org uuid)
RETURNS boolean
```

**Parámetros**:
- `p_org`: UUID de la organización

**Retorna**: `true` si el usuario puede ver los miembros

**Modo de seguridad**: `SECURITY DEFINER`

---

### org_has_other_owner_v2()

Verifica si existe otro owner en la organización (útil al cambiar rol del último owner).

**Firma**:
```sql
org_has_other_owner_v2(p_org_id uuid, p_excluded_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
```

**Parámetros**:
- `p_org_id`: UUID de la organización
- `p_excluded_user_id`: UUID a excluir (opcional, default: usuario actual)

**Retorna**: `true` si existe al menos otro owner

**Modo de seguridad**: `SECURITY DEFINER`

**Uso típico**: Prevenir que una organización quede sin owners.

**Ejemplo**:
```sql
-- Antes de cambiar el rol del último owner
IF NOT org_has_other_owner_v2('org_uuid', 'current_user_uuid') THEN
  RAISE EXCEPTION 'Cannot change role: organization would have no owners';
END IF;
```

---

### get_user_orgs()

Retorna todas las organizaciones a las que pertenece el usuario actual.

**Firma**:
```sql
get_user_orgs()
RETURNS SETOF uuid
```

**Retorna**: Conjunto de UUIDs de organizaciones

**Modo de seguridad**: `SECURITY DEFINER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Obtener organizaciones del usuario
SELECT * FROM config_organizaciones
WHERE id IN (SELECT get_user_orgs());

-- O usando join lateral
SELECT o.*, om.role
FROM get_user_orgs() guo
JOIN config_organizaciones o ON o.id = guo.get_user_orgs
JOIN config_organizacion_miembros om ON om.organization_id = o.id AND om.user_id = auth.uid()
WHERE om.eliminado_en IS NULL;
```

---

### user_role_in_org_v2()

Retorna el rol de un usuario en una organización específica.

**Firma**:
```sql
user_role_in_org_v2(p_org uuid)
RETURNS text
```

**Parámetros**:
- `p_org`: UUID de la organización

**Retorna**: Nombre del rol (`'owner'`, `'admin'`, `'analyst'`, `'auditor'`) o `NULL`

**Modo de seguridad**: `SECURITY DEFINER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Obtener el rol del usuario actual
SELECT user_role_in_org_v2('org_uuid');  -- 'admin'

-- Usar en lógica condicional
IF user_role_in_org_v2('org_uuid') = 'owner' THEN
  -- Solo owners pueden hacer esto
END IF;
```

---

### get_user_email()

Obtiene el email de un usuario desde `auth.users`.

**Firma**:
```sql
get_user_email(user_id uuid)
RETURNS text
```

**Parámetros**:
- `user_id`: UUID del usuario

**Retorna**: Email del usuario o `NULL`

**Modo de seguridad**: `SECURITY DEFINER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Obtener email del creador
SELECT
  t.titulo,
  get_user_email(t.creado_por) as creador_email
FROM tr_tareas t;
```

---

## 2. Funciones de Negocio

### soft_delete_actor()

Realiza soft delete de actores (personas o empresas) con verificación de permisos y bypass de RLS.

**Firma**:
```sql
soft_delete_actor(p_actor_id uuid)
RETURNS jsonb
```

**Parámetros**:
- `p_actor_id`: UUID del actor a eliminar

**Retorna**: Objeto JSONB con:
- `success`: Boolean indicando si la operación fue exitosa
- `message`: Mensaje descriptivo del resultado

**Modo de seguridad**: `SECURITY DEFINER`

**Propósito**: Soluciona el problema de `auth.uid()` retornando `NULL` en Server Actions. Esta función tiene privilegios elevados para bypass RLS pero verifica permisos manualmente.

**Ejemplo de uso**:
```typescript
// Desde Server Action
const { data, error } = await supabase.rpc('soft_delete_actor', {
  p_actor_id: 'actor_uuid'
})

// Respuesta exitosa
{ success: true, message: 'Actor eliminado correctamente' }

// Respuesta con error
{ success: false, message: 'No tienes permisos para eliminar este actor' }
```

**Lógica interna**:
1. Obtiene el usuario autenticado con `auth.uid()`
2. Obtiene la `organizacion_id` del actor
3. Verifica permisos usando `can_user_v2('dm_actores', 'update', organizacion_id)`
4. Si tiene permisos, ejecuta el soft delete (set `eliminado_en = NOW()`, `eliminado_por = user_id`)
5. Retorna resultado JSONB

**Ventajas**:
- Bypass RLS con `SECURITY DEFINER`
- Verifica permisos manualmente (seguro)
- Funciona correctamente desde Server Actions
- Retorna estructura JSONB consistente para manejo de errores

**Casos de error**:
- `Usuario no autenticado`: Cuando `auth.uid()` es NULL
- `Actor no encontrado o ya eliminado`: Cuando el actor no existe o ya tiene `eliminado_en` set
- `No tienes permisos`: Cuando `can_user_v2()` retorna false

---

### generar_siguiente_subcodigo()

Genera el siguiente subcódigo para asignaciones de acciones. Implementa la lógica de negocio para códigos de asignación.

**Firma**:
```sql
generar_siguiente_subcodigo(p_accion_id uuid, p_tipo_asignacion text)
RETURNS text
```

**Parámetros**:
- `p_accion_id`: UUID de la acción
- `p_tipo_asignacion`: Tipo de asignación (`'dueño'`, `'titular'`, `'beneficiario'`)

**Retorna**: Subcódigo de 2 dígitos (`'00'`, `'01'`, `'02'`, etc.)

**Modo de seguridad**: `SECURITY INVOKER`

**Lógica de negocio**:

| Tipo | Subcódigo | Descripción |
|------|-----------|-------------|
| `dueño` | `00` | Dueño de la acción (único) |
| `titular` | `01` | Titular de la acción (único) |
| `beneficiario` | `02+` | Beneficiarios (múltiples, secuenciales) |

**Ejemplo de uso**:
```sql
-- Crear asignación de dueño
INSERT INTO vn_asociados (
  accion_id,
  business_partner_id,
  tipo_asignacion,
  subcodigo
) VALUES (
  'accion_uuid',
  'bp_uuid',
  'dueño',
  generar_siguiente_subcodigo('accion_uuid', 'dueño')  -- '00'
);

-- Crear asignación de beneficiario
INSERT INTO vn_asociados (
  accion_id,
  business_partner_id,
  tipo_asignacion,
  subcodigo
) VALUES (
  'accion_uuid',
  'bp_uuid2',
  'beneficiario',
  generar_siguiente_subcodigo('accion_uuid', 'beneficiario')  -- '02'
);
```

**Comportamiento**:
- `dueño`: Siempre retorna `'00'`
- `titular`: Siempre retorna `'01'`
- `beneficiario`: Busca el máximo subcodigo existente y retorna el siguiente (`'02'`, `'03'`, etc.)

**Error**: Lanza excepción si `p_tipo_asignacion` no es válido.

---

### rpc_accion_disponibilidad()

Verifica la disponibilidad de una acción y retorna los ocupantes vigentes.

**Firma**:
```sql
rpc_accion_disponibilidad(p_accion_id uuid, p_organizacion_id uuid)
RETURNS jsonb
```

**Parámetros**:
- `p_accion_id`: UUID de la acción a verificar
- `p_organizacion_id`: UUID de la organización

**Retorna**: Objeto JSONB con:
- `disponible`: Boolean indicando si está disponible
- `mensaje`: Mensaje descriptivo
- `ocupantes`: Array de objetos con información de ocupantes vigentes

**Modo de seguridad**: `SECURITY DEFINER`

**Ejemplo de respuesta**:
```json
{
  "disponible": false,
  "mensaje": "Acción con asignaciones vigentes",
  "ocupantes": [
    {
      "tipo_asignacion": "dueño",
      "nombre_actor": "Juan Pérez",
      "codigo_actor": "ACT-00000001",
      "fecha_inicio": "2024-01-01"
    }
  ]
}
```

**Ejemplo de uso**:
```sql
SELECT rpc_accion_disponibilidad(
  'accion_uuid',
  'org_uuid'
);
```

**Lógica**: Consulta la vista `v_asociados_org` filtrando por:
- Acción especificada
- Organización especificada
- Asignaciones vigentes (`es_vigente = true`)
- Fechas vigentes (inicio <= hoy y fin >= hoy o fin es NULL)

---

## 3. Funciones de Validación

### dm_actores_documento_existe()

Verifica si existe un actor con el mismo documento en la organización.

**Firma**:
```sql
dm_actores_documento_existe(
  p_organizacion_id uuid,
  p_tipo_documento dm_actor_tipo_documento,
  p_num_documento text,
  p_excluir_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  doc_exists boolean,
  actor_id uuid,
  codigo_bp text,
  nombre_completo text
)
```

**Parámetros**:
- `p_organizacion_id`: UUID de la organización
- `p_tipo_documento`: Tipo de documento a buscar
- `p_num_documento`: Número de documento (trim aplicado)
- `p_excluir_id`: UUID del actor a excluir (opcional, útil para updates)

**Retorna**: Tabla con información del duplicado encontrado

**Modo de seguridad**: `SECURITY INVOKER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Verificar si documento existe antes de insertar
SELECT * FROM dm_actores_documento_existe(
  'org_uuid',
  'CC',
  '12345678',
  NULL
);

-- Verificar excluyendo el actor actual (para updates)
SELECT * FROM dm_actores_documento_existe(
  'org_uuid',
  'CC',
  '12345678',
  'actor_actual_uuid'
);
```

**Comportamiento**:
- Realiza búsqueda trim comparando los documentos
- Retorna un registro con `doc_exists = true` si encuentra duplicado
- Retorna un registro con `doc_exists = false` si no encuentra duplicado
- Incluye información del actor encontrado (id, código_bp, nombre_completo)

---

### dm_actores_email_existe()

Verifica si existe un actor con el mismo email en la organización.

**Firma**:
```sql
dm_actores_email_existe(
  p_organizacion_id uuid,
  p_email text,
  p_excluir_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  email_exists boolean,
  actor_id uuid,
  codigo_bp text,
  nombre_completo text,
  email_encontrado text
)
```

**Parámetros**:
- `p_organizacion_id`: UUID de la organización
- `p_email`: Email a buscar (case-insensitive)
- `p_excluir_id`: UUID del actor a excluir (opcional)

**Retorna**: Tabla con información del duplicado encontrado

**Modo de seguridad**: `SECURITY INVOKER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Verificar si email existe
SELECT * FROM dm_actores_email_existe(
  'org_uuid',
  'usuario@example.com',
  NULL
);
```

**Comportamiento**:
- Busca en `email_principal` y `email_secundario`
- Comparación case-insensitive
- Indica cuál email coincidió (`email_encontrado`)

---

### dm_actores_telefono_existe()

Verifica si existe un actor con el mismo teléfono en la organización.

**Firma**:
```sql
dm_actores_telefono_existe(
  p_organizacion_id uuid,
  p_telefono text,
  p_excluir_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  phone_exists boolean,
  actor_id uuid,
  codigo_bp text,
  nombre_completo text,
  telefono_encontrado text
)
```

**Parámetros**:
- `p_organizacion_id`: UUID de la organización
- `p_telefono`: Teléfono a buscar
- `p_excluir_id`: UUID del actor a excluir (opcional)

**Retorna**: Tabla con información del duplicado encontrado

**Modo de seguridad**: `SECURITY INVOKER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Verificar si teléfono existe
SELECT * FROM dm_actores_telefono_existe(
  'org_uuid',
  '+57 300 123 4567',
  NULL
);
```

**Comportamiento**:
- Busca en `telefono_principal` y `telefono_secundario`
- Normaliza ambos teléfonos eliminando caracteres no numéricos
- Indica cuál teléfono coincidió

---

### vn_asociados_validar_accion()

Valida si una acción tiene asignaciones vigentes para el usuario actual (usa org_id del JWT).

**Firma**:
```sql
vn_asociados_validar_accion(p_accion_id uuid)
RETURNS jsonb
```

**Parámetros**:
- `p_accion_id`: UUID de la acción a validar

**Retorna**: Objeto JSONB con:
- `disponible`: Boolean
- `mensaje`: Mensaje descriptivo
- `ocupantes`: Array de ocupantes vigentes

**Modo de seguridad**: `SECURITY DEFINER`

**Requiere**: `org_id` en el claim del JWT

**Ejemplo de uso**:
```sql
SELECT vn_asociados_validar_accion('accion_uuid');
```

**Validaciones**:
1. Verifica que `org_id` exista en el JWT
2. Verifica que el usuario sea miembro de la organización
3. Busca asignaciones vigentes en la organización

**Errores**:
- `22023` (invalid_parameter_value): Si falta `org_id` en el JWT
- `42501` (insufficient_privilege): Si el usuario no es miembro de la organización

---

### vn_asociados_validar_asociado()

Valida si un asociado tiene acciones vigentes asignadas para el usuario actual.

**Firma**:
```sql
vn_asociados_validar_asociado(p_asociado_id uuid)
RETURNS jsonb
```

**Parámetros**:
- `p_asociado_id`: UUID del asociado a validar

**Retorna**: Objeto JSONB con:
- `disponible`: Boolean
- `mensaje`: Mensaje descriptivo
- `acciones`: Array de acciones vigentes

**Modo de seguridad**: `SECURITY DEFINER`

**Requiere**: `org_id` en el claim del JWT

**Ejemplo de uso**:
```sql
SELECT vn_asociados_validar_asociado('asociado_uuid');
```

**Ejemplo de respuesta**:
```json
{
  "disponible": false,
  "mensaje": "Asociado con acciones vigentes",
  "acciones": [
    {
      "accion_id": "uuid",
      "codigo_accion": "ACC-001",
      "nombre_accion": "Acción X",
      "tipo_asignacion": "titular",
      "fecha_inicio": "2024-01-01",
      "fecha_fin": null
    }
  ]
}
```

---

## 4. Funciones de Utilidad

### search_locations()

Busca ciudades por texto usando búsqueda difusa sin acentos.

**Firma**:
```sql
search_locations(q text, max_results integer DEFAULT 20)
RETURNS SETOF config_ciudades
```

**Parámetros**:
- `q`: Texto a buscar (nombre de ciudad, estado, país)
- `max_results`: Máximo de resultados (default: 20)

**Retorna**: Conjunto de ciudades coincidentes

**Modo de seguridad**: `SECURITY INVOKER`

**Estabilidad**: `STABLE`

**Características**:
- Búsqueda case-insensitive
- Elimina acentos del texto de búsqueda
- Busca en city_name, state_name, country_name, y postal_code
- Ordena por city_name ascendentemente

**Ejemplo de uso**:
```sql
-- Buscar "Bogota"
SELECT * FROM search_locations('Bogota');

-- Buscar con límite de resultados
SELECT * FROM search_locations('Medellin', 5);

-- Buscar por estado
SELECT * FROM search_locations('Cundinamarca');
```

**Internamente usa**:
```sql
WITH nq AS (
  SELECT unaccent_lower(q) AS qn
)
SELECT c.*
FROM config_ciudades c, nq
WHERE c.search_text ILIKE '%' || nq.qn || '%'
ORDER BY c.city_name ASC
LIMIT GREATEST(1, max_results);
```

---

### get_enum_values()

Retorna todos los valores posibles de un tipo ENUM PostgreSQL. **Función muy útil para validaciones y UIs dinámicos**.

**Firma**:
```sql
get_enum_values(p_enum_name text)
RETURNS SETOF text
```

**Parámetros**:
- `p_enum_name`: Nombre del tipo enum (ej: `'dm_actor_estado'`, `'tr_doc_comercial_estados'`)

**Retorna**: Conjunto de valores del enum en orden

**Modo de seguridad**: `SECURITY DEFINER`

**Estabilidad**: `STABLE`

**Ejemplo de uso**:
```sql
-- Obtener todos los estados de un actor
SELECT * FROM get_enum_values('dm_actor_estado');
-- Retorna: activo, inactivo, bloqueado

-- Obtener tipos de documento
SELECT * FROM get_enum_values('dm_actor_tipo_documento');
-- Retorna: CC, CE, PA, TI, RC, PEP, PPT, NIT

-- Usar en validación
CREATE OR REPLACE FUNCTION validar_estado_actor(p_estado text)
RETURNS boolean AS $$
BEGIN
  RETURN p_estado IN (SELECT get_enum_values('dm_actor_estado'));
END;
$$ LANGUAGE plpgsql;

-- Obtener opciones para un select/dropdown en la app
SELECT enumlabel as value, enumlabel as label
FROM get_enum_values('tr_doc_comercial_estados')
ORDER BY enumlabel;
```

**Uso típico en aplicaciones**:
- Generar dropdowns/selects dinámicamente
- Validar que un valor sea válido para un enum
- Documentar valores posibles de un campo
- Migraciones o actualizaciones de datos

---

### calcular_digito_verificacion_nit()

Calcula el dígito de verificación para NITs en Colombia (algoritmo módulo 11).

**Firma**:
```sql
calcular_digito_verificacion_nit(nit text)
RETURNS integer
```

**Parámetros**:
- `nit`: NIT como texto (puede incluir puntos, guiones)

**Retorna**: Dígito de verificación (0-10) o `NULL` si el NIT está vacío

**Modo de seguridad**: `SECURITY INVOKER`

**Inmutabilidad**: `IMMUTABLE` (siempre retorna el mismo resultado para el mismo input)

**Algoritmo**:
1. Limpia el NIT (solo dígitos)
2. Aplica factores primos `[3,7,13,17,19,23,29,37,41,43,47,53,59,67,71]`
3. Suma productos de dígito × factor
4. Retorna `(s % 11)` si `< 2`, sino `11 - (s % 11)`

**Ejemplo de uso**:
```sql
-- Calcular dígito de verificación
SELECT calcular_digito_verificacion_nit('900123456');  -- Retorna: 4

-- Validar NIT completo
SELECT
  nit,
  calcular_digito_verificacion_nit(nit) as digito_calculado,
  -- Comparar con dígito almacenado
  CASE
    WHEN calcular_digito_verificacion_nit(nit) = digito_verificacion
    THEN 'Válido'
    ELSE 'Inválido'
  END as validacion
FROM dm_actores
WHERE nat_fiscal = 'jurídica';
```

---

## 5. Triggers

### set_actualizado_por_en()

Trigger que actualiza automáticamente los campos de auditoría `actualizado_en` y `actualizado_por`.

**Firma**:
```sql
set_actualizado_por_en()
RETURNS trigger
```

**Evento**: `BEFORE UPDATE`

**Tablas que lo usan**: Todas las tablas con campos de auditoría

**Modo de seguridad**: `SECURITY DEFINER`

**Lógica**:
```sql
NEW.actualizado_en = now();
NEW.actualizado_por = auth.uid();
RETURN NEW;
```

**Ejemplo**:
```sql
-- Trigger definido en dm_actores
CREATE TRIGGER dm_actores_set_actualizado_por_en
  BEFORE UPDATE ON dm_actores
  FOR EACH ROW
  EXECUTE FUNCTION set_actualizado_por_en();

-- Al actualizar:
UPDATE dm_actores SET email_principal = 'nuevo@email.com' WHERE id = 'uuid';
-- actualizado_en y actualizado_por se actualizan automáticamente
```

---

### set_deleted_by_on_soft_delete()

Trigger que establece `eliminado_por` cuando se marca un registro como eliminado (soft delete).

**Firma**:
```sql
set_deleted_by_on_soft_delete()
RETURNS trigger
```

**Evento**: `BEFORE UPDATE`

**Tablas que lo usan**: Todas las tablas con soft delete

**Modo de seguridad**: `SECURITY INVOKER`

**Lógica**:
```sql
IF NEW.eliminado_en IS NOT NULL AND OLD.eliminado_en IS NULL THEN
  NEW.eliminado_por := auth.uid();
END IF;
RETURN NEW;
```

**Ejemplo**:
```sql
-- Soft delete
UPDATE dm_actores
SET eliminado_en = now()
WHERE id = 'uuid';
-- eliminado_por se establece automáticamente a auth.uid()
```

---

### assign_owner_on_org_create()

Trigger que asigna automáticamente el rol de `owner` al creador de una organización.

**Firma**:
```sql
assign_owner_on_org_create()
RETURNS trigger
```

**Evento**: `AFTER INSERT`

**Tabla**: `config_organizaciones`

**Modo de seguridad**: `SECURITY DEFINER`

**Lógica**:
```sql
INSERT INTO config_organizacion_miembros (organization_id, user_id, role)
VALUES (new.id, auth.uid(), 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;
```

**Validación**: Lanza excepción si `auth.uid()` es `NULL`.

**Ejemplo**:
```sql
-- Crear organización
INSERT INTO config_organizaciones (nombre, slug)
VALUES ('Mi Org', 'mi-org');

-- Trigger automático asigna owner
-- Equivalente a:
-- INSERT INTO config_organizacion_miembros (organization_id, user_id, role)
-- VALUES ('org_uuid', 'current_user_uuid', 'owner');
```

---

### om_prevent_key_change()

Trigger que previene cambios en la clave primaria compuesta de `config_organizacion_miembros`.

**Firma**:
```sql
om_prevent_key_change()
RETURNS trigger
```

**Evento**: `BEFORE UPDATE`

**Tabla**: `config_organizacion_miembros`

**Modo de seguridad**: `SECURITY INVOKER`

**Lógica**:
```sql
IF (TG_OP = 'UPDATE') THEN
  IF (NEW.organization_id <> OLD.organization_id OR NEW.user_id <> OLD.user_id) THEN
    RAISE EXCEPTION 'Cannot change organization_id or user_id of membership row';
  END IF;
END IF;
```

**Propósito**: Protege la integridad de la PK compuesta `(user_id, organization_id)`.

---

### config_ciudades_build_search_text()

Trigger que recalcula el campo `search_text` para búsqueda sin acentos en `config_ciudades`.

**Firma**:
```sql
config_ciudades_build_search_text()
RETURNS trigger
```

**Evento**: `BEFORE INSERT OR UPDATE`

**Tabla**: `config_ciudades`

**Modo de seguridad**: `SECURITY DEFINER`

**Lógica**:
```sql
NEW.search_text := concat_ws(' ',
  unaccent_lower(COALESCE(NEW.city_name, '')),
  unaccent_lower(COALESCE(NEW.state_name, '')),
  unaccent_lower(COALESCE(NEW.country_name, '')),
  unaccent_lower(COALESCE(NEW.postal_code, ''))
);
RETURN NEW;
```

**Ejemplo**:
```sql
-- Insertar ciudad
INSERT INTO config_ciudades (city_name, state_name, country_name)
VALUES ('Bogotá', 'Cundinamarca', 'Colombia');

-- search_text se calcula automáticamente: 'bogota cundinamarca colombia'
```

---

### tr_doc_comercial_calcular_total()

Trigger que calcula automáticamente el `valor_total` de documentos comerciales.

**Firma**:
```sql
tr_doc_comercial_calcular_total()
RETURNS trigger
```

**Evento**: `BEFORE INSERT OR UPDATE`

**Tabla**: `tr_doc_comercial`

**Modo de seguridad**: `SECURITY DEFINER`

**Fórmula**:
```sql
valor_total = valor_neto - valor_descuento + valor_impuestos
```

**Lógica**:
```sql
NEW.valor_total := (
  COALESCE(NEW.valor_neto, 0) -
  COALESCE(NEW.valor_descuento, 0) +
  COALESCE(NEW.valor_impuestos, 0)
);
RETURN NEW;
```

**Ejemplo**:
```sql
INSERT INTO tr_doc_comercial (
  valor_neto,
  valor_descuento,
  valor_impuestos
) VALUES (
  1000000,  -- 1 millón
  100000,   -- 10% descuento
  190000    -- 19% IVA
);

-- valor_total se calcula: 1000000 - 100000 + 190000 = 1090000
```

---

### dm_actores_prevent_dup_doc_trg()

Trigger que previene documentos duplicados en `dm_actores`.

**Firma**:
```sql
dm_actores_prevent_dup_doc_trg()
RETURNS trigger
```

**Evento**: `BEFORE INSERT OR UPDATE`

**Tabla**: `dm_actores`

**Modo de seguridad**: `SECURITY INVOKER`

**Lógica**:
```sql
-- Valida si vienen los campos necesarios
IF NEW.organizacion_id IS NOT NULL AND NEW.tipo_documento IS NOT NULL AND NEW.num_documento IS NOT NULL THEN
  -- Llama a la función de validación
  PERFORM 1 FROM dm_actores_documento_existe(
    NEW.organizacion_id,
    NEW.tipo_documento,
    NEW.num_documento,
    NULL
  ) AS r(doc_exists boolean, actor_id uuid, codigo_bp text, nombre_completo text)
  WHERE r.doc_exists = true;

  IF found THEN
    RAISE EXCEPTION USING
      errcode = 'unique_violation',
      message = format('El documento ingresado ya existe en la organización (codigo_bp=%s, nombre=%s).', r.codigo_bp, r.nombre_completo),
      detail = 'Duplicidad por (organizacion_id, tipo_documento, num_documento)',
      hint = 'Verifique el documento o use p_excluir_id para updates.';
  END IF;
END IF;

RETURN NEW;
```

**Propósito**: Prevenir documentos duplicados dentro de la misma organización.

---

## 6. Funciones del Sistema

### unaccent()

Función del sistema PostgreSQL para eliminar acentos de caracteres (del extension `unaccent`).

**Firmas**:
```sql
unaccent(text) RETURNS text
unaccent(regdictionary, text) RETURNS text
```

**Ejemplo**:
```sql
SELECT unaccent('Áéíóú');  -- 'Aeiou'
```

---

### unaccent_lower()

Función helper que combina `unaccent()` con `lower()` para búsqueda sin acentos case-insensitive.

**Firma**:
```sql
unaccent_lower(text)
RETURNS text
```

**Ejemplo**:
```sql
SELECT unaccent_lower('Bogotá');  -- 'bogota'
```

---

### unaccent_init() / unaccent_lexize()

Funciones internas del diccionario de búsqueda full text de PostgreSQL (no usar directamente).

---

## Tabla de Referencia Rápida

### Funciones por Categoría

| Categoría | Función | Propósito |
|-----------|---------|-----------|
| **Seguridad** | `is_org_member` | Verificar membresía |
| **Seguridad** | `is_org_admin_v2` | Verificar rol admin/owner |
| **Seguridad** | `is_org_owner_v2` | Verificar rol owner |
| **Seguridad** | `can_user_v2` | Verificar permisos |
| **Seguridad** | `can_view_org_membership_v2` | Visibility de membresía |
| **Seguridad** | `org_has_other_owner_v2` | Verificar otros owners |
| **Seguridad** | `get_user_orgs` | Obtener organizaciones del usuario |
| **Seguridad** | `user_role_in_org_v2` | Obtener rol en organización |
| **Utilidad** | `get_user_email` | Obtener email de usuario |
| **Utilidad** | `get_enum_values` | Obtener valores de un ENUM |
| **Negocio** | `soft_delete_actor` | Soft delete de actores con bypass RLS |
| **Negocio** | `generar_siguiente_subcodigo` | Generar subcódigo de asignación |
| **Negocio** | `rpc_accion_disponibilidad` | Verificar disponibilidad de acción |
| **Validación** | `dm_actores_documento_existe` | Verificar duplicado de documento |
| **Validación** | `dm_actores_email_existe` | Verificar duplicado de email |
| **Validación** | `dm_actores_telefono_existe` | Verificar duplicado de teléfono |
| **Validación** | `vn_asociados_validar_accion` | Validar acción con asignaciones |
| **Validación** | `vn_asociados_validar_asociado` | Validar asociado con acciones |
| **Utilidad** | `search_locations` | Buscar ciudades |
| **Utilidad** | `calcular_digito_verificacion_nit` | Calcular DV de NIT |
| **Trigger** | `set_actualizado_por_en` | Auditoría de actualización |
| **Trigger** | `set_deleted_by_on_soft_delete` | Auditoría de eliminación |
| **Trigger** | `assign_owner_on_org_create` | Asignar owner al crear org |
| **Trigger** | `om_prevent_key_change` | Proteger PK compuesta |
| **Trigger** | `config_ciudades_build_search_text` | Recalcular búsqueda |
| **Trigger** | `tr_doc_comercial_calcular_total` | Calcular total documento |
| **Trigger** | `dm_actores_prevent_dup_doc_trg` | Prevenir duplicados de documento |

---

## Documentos Relacionados

- [OVERVIEW.md](OVERVIEW.md) - Visión general de la base de datos
- [TABLES.md](TABLES.md) - Documentación detallada de tablas
- [RLS.md](RLS.md) - Políticas de seguridad y RLS
