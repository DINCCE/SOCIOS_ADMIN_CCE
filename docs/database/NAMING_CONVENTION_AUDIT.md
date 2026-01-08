# AUDITORÍA DE NOMENCLATURA - POLÍTICAS Y FUNCIONES

**Fecha:** 2026-01-08
**Auditoría:** Verificación de convenciones de nomenclatura para políticas RLS y funciones
**Alcance:** Todas las tablas del esquema `public`

---

## 📋 Resumen Ejecutivo

### Estado General

| Categoría | Total | ✅ Correctos | ❌ Incorrectos | % Correcto |
|-----------|-------|-------------|---------------|-----------|
| **Políticas RLS** | 27 | 1 | 26 | 3.7% |
| **Funciones** | 43 | 0 | 43 | 0% |

**Conclusión:** La nomenclatura actual **NO sigue las convenciones establecidas**. Se requiere un esfuerzo de renombración significativo.

---

## 🎯 Convenciones Establecidas

### Prefijos de Tablas

| Prefijo | Tipo de Tabla | Ejemplo |
|---------|----------------|----------|
| `dm_` | Data Maestra (Master Data) | `dm_actores`, `dm_acciones` |
| `tr_` | Transacciones | `tr_doc_comercial`, `tr_tareas` |
| `vn_` | Vinculación (N:M relationships) | `vn_asociados`, `vn_relaciones_actores` |
| `config_` | Configuración | `config_organizaciones`, `config_roles` |

### Nomenclatura Esperada

#### Políticas RLS
```
Formato: {tabla_completa}_{acción}_{descripción_opcional}

Ejemplos:
✅ config_ciudades_select
✅ dm_actores_insert
✅ tr_doc_comercial_update_own
✅ vn_asociados_delete
```

#### Funciones
```
Formato: {tabla_completa}_{acción}_{descripción}

Ejemplos:
✅ dm_actores_generar_codigo
✅ tr_doc_comercial_calcular_total
✅ config_organizaciones_verificar_miembro
✅ vn_asociados_transferir_accion
```

---

## 🔐 RBAC (Role-Based Access Control) - ANÁLISIS

### ¿Qué es RBAC?

**RBAC** (Role-Based Access Control) es un modelo de seguridad que restringe el acceso a recursos basándose en los roles de los usuarios dentro de una organización. En este sistema:

1. **Usuarios** → tienen **Roles** (owner, admin, member, viewer)
2. **Roles** → tienen **Permisos** (resource:action pairs)
3. **Permisos** → definen **Acceso** a tablas/operaciones

### Tablas del Sistema RBAC

| Tabla | Propósito |
|-------|-----------|
| `config_organizaciones` | Organizaciones (multi-tenancy) |
| `config_organizacion_miembros` | Membresías de usuarios en organizaciones |
| `config_roles` | Definición de roles (owner, admin, member, viewer) |
| `config_roles_permisos` | Matriz de permisos por rol |

### Funciones Helper del Sistema RBAC

| Función | Propósito | Usa `config_roles_permisos` |
| :--- | :--- | :--- |
| `can_user()` | Verifica si usuario tiene permiso específico | ✅ Sí |
| `can_user_v2()` | Versión mejorada de can_user | ✅ Sí |
| `has_org_permission()` | Verifica permiso con formato "resource:action" | ✅ Sí |
| `is_org_admin()` | Verifica si usuario es admin/owner | ❌ No |
| `is_org_admin_v2()` | Versión mejorada | ❌ No |
| `is_org_member()` | Verifica si usuario es miembro | ❌ No |
| `is_org_owner()` | Verifica si usuario es owner | ❌ No |
| `is_org_owner_v2()` | Versión mejorada | ❌ No |
| `user_role_in_org()` | Obtiene rol del usuario | ❌ No |
| `user_role_in_org_v2()` | Versión mejorada | ❌ No |
| `can_view_org_membership()` | Verifica si puede ver membrecías | ❌ No |
| `can_view_org_membership_v2()` | Versión mejorada | ❌ No |
| `org_has_other_owner()` | Verifica si hay otro owner | ❌ No |
| `org_has_other_owner_v2()` | Versión mejorada | ❌ No |

### Políticas RLS - Uso de RBAC

| Tabla | Política | Tipo de Control | Usa RBAC |
| :--- | :--- | :--- | :--- |
| `config_ciudades` | `config_ciudades_select` | Ninguno (global catalog) | ❌ No |
| `config_organizacion_miembros` | `om_select_visible` | Organización + Rol hardcoded | ❌ No |
| `config_organizacion_miembros` | `om_update_own_preferences` | Solo usuario propio | ❌ No |
| `config_organizaciones` | `org_select` | Membresía directa | ❌ No |
| `config_organizaciones` | `org_write` | Rol hardcoded (owner/admin) | ❌ No |
| `config_organizaciones` | `orgs_delete` | Helper `is_org_owner_v2()` | ⚠️ Indirecto |
| `config_organizaciones` | `orgs_insert` | Sin expresión | ❌ No |
| `config_organizaciones` | `orgs_select` | Helper `can_view_org_membership_v2()` | ⚠️ Indirecto |
| `config_roles` | `roles_delete` | Rol hardcoded (owner/admin) | ❌ No |
| `config_roles` | `roles_insert` | Sin expresión | ❌ No |
| `config_roles` | `roles_read_org_filtered` | Rol hardcoded (lista) | ❌ No |
| `config_roles` | `roles_update` | Rol hardcoded (owner/admin) | ❌ No |
| `config_roles_permisos` | `role_permissions_delete` | Rol hardcoded (owner/admin) | ❌ No |
| `config_roles_permisos` | `role_permissions_insert` | Sin expresión | ❌ No |
| `config_roles_permisos` | `role_permissions_read_org_filtered` | Join con `config_roles` | ⚠️ Indirecto |
| `config_roles_permisos` | `role_permissions_update` | Rol hardcoded (owner/admin) | ❌ No |
| `dm_acciones` | `acciones_delete` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `dm_acciones` | `acciones_insert` | Sin expresión | ❌ No |
| `dm_acciones` | `acciones_select` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `dm_acciones` | `acciones_update` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `dm_actores` | `bp_select` | Membresía directa | ❌ No |
| `tr_doc_comercial` | `oportunidades_select` | Membresía directa | ❌ No |
| `tr_tareas` | `tareas_select` | Membresía directa | ❌ No |
| `vn_asociados` | `asig_acc_delete` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `vn_asociados` | `asig_acc_insert` | Sin expresión | ❌ No |
| `vn_asociados` | `asig_acc_select` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `vn_asociados` | `asig_acc_update` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `vn_relaciones_actores` | `bp_rel_delete` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `vn_relaciones_actores` | `bp_rel_insert` | Sin expresión | ❌ No |
| `vn_relaciones_actores` | `bp_rel_select` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |
| `vn_relaciones_actores` | `bp_rel_update` | Helper `can_user_v2()` | ✅ **SÍ - RBAC** |

### Funciones - Uso de RBAC

| Función | Usa RBAC | Detalles |
| :--- | :--- | :--- |
| **RBAC Helper Functions** (14 funciones) | ✅ Sí | Funciones core del sistema RBAC |
| `actualizar_accion` | ✅ Sí | Llama `can_user_v2('dm_acciones', 'update', org)` |
| `actualizar_oportunidad` | ✅ Sí | Llama `can_user_v2('oportunidades', 'update', org)` |
| `actualizar_tarea` | ✅ Sí | Llama `can_user_v2('tareas', 'update', org)` |
| `crear_accion` | ✅ Sí | Llama `can_user_v2('dm_acciones', 'insert', org)` |
| `crear_tarea` | ✅ Sí | Llama `can_user_v2('tareas', 'insert', org)` |
| **Otras 24 funciones** | ❌ No | No usan funciones RBAC |

### Resumen de RBAC

| Categoría | Total | Usan RBAC | % RBAC |
| :--- | :--- | :--- | :--- |
| **Políticas RLS** | 27 | 9 | 33.3% |
| **Funciones** | 43 | 19 | 44.2% |
| **TOTAL** | 70 | 28 | 40.0% |

### Observaciones sobre RBAC

1. **Implementación Híbrida**:
   - Algunas tablas usan RBAC completo (`dm_acciones`, `vn_asociados`, `vn_relaciones_actores`)
   - Otras usan hardcoded roles (config tables)
   - Otras usan solo membresía directa (`dm_actores`, `tr_doc_comercial`, `tr_tareas`)

2. **Consistencia Recomendada**:
   - 🟢 **Buena práctica**: `dm_acciones`, `vn_asociados`, `vn_relaciones_actores` usan RBAC dinámico
   - 🟡 **Mejorable**: config tables tienen roles hardcoded en políticas
   - 🟡 **Inconsistencia**: `dm_actores`, `tr_doc_comercial`, `tr_tareas` no usan RBAC

3. **Ventajas de RBAC Completo**:
   - ✅ Flexibilidad: Cambiar permisos sin modificar código SQL
   - ✅ Auditoría: Registro completo de permisos en `config_roles_permisos`
   - ✅ Mantenibilidad: Roles y permisos centralizados en base de datos
   - ✅ Escalabilidad: Fácil agregar nuevos roles o permisos

4. **Desventajas de Roles Hardcoded**:
   - ❌ Requiere migración SQL para cambiar permisos
   - ❌ Difícil auditar quién tiene acceso a qué
   - ❌ No escalable para múltiples organizaciones con necesidades distintas

### Recomendación RBAC

**Considerar migrar todas las tablas a RBAC dinámico usando `can_user_v2()`**:

```sql
-- Ejemplo para dm_actores (actualmente usa membresía directa)
CREATE POLICY dm_actores_select ON dm_actores
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('dm_actores', 'select', organizacion_id)
  );
```

Esto permitiría:

- Configurar permisos por rol desde `config_roles_permisos`
- Mayor flexibilidad para casos especiales
- Auditoría completa de permisos en un solo lugar

---

## 🔴 POLÍTICAS RLS - ANÁLISIS DETALLADO (CON RBAC)

### Resumen por Tabla

| Tabla | Políticas | ✅ Correctas | ❌ Incorrectas |
|-------|-----------|--------------|-----------------|
| `config_ciudades` | 1 | 1 | 0 |
| `config_organizacion_miembros` | 2 | 0 | 2 |
| `config_organizaciones` | 5 | 0 | 5 |
| `config_roles` | 4 | 0 | 4 |
| `config_roles_permisos` | 4 | 0 | 4 |
| `dm_acciones` | 4 | 0 | 4 |
| `dm_actores` | 1 | 0 | 1 |
| `tr_doc_comercial` | 1 | 0 | 1 |
| `tr_tareas` | 1 | 0 | 1 |
| `vn_asociados` | 4 | 0 | 4 |
| `vn_relaciones_actores` | 4 | 0 | 4 |

### Políticas Correctas (Solo 1)

| Tabla | Política Actual | Acción |
|-------|-----------------|--------|
| `config_ciudades` | `config_ciudades_select` | ✅ **ÚNICA POLÍTICA CORRECTA** |

### Políticas Incorrectas por Tabla

#### config_organizacion_miembros

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `om_select_visible` | `config_organizacion_miembros_select_visible` | SELECT |
| `om_update_own_preferences` | `config_organizacion_miembros_update_own_preferences` | UPDATE |

#### config_organizaciones

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `org_select` | `config_organizaciones_select` | SELECT |
| `org_write` | `config_organizaciones_update` | UPDATE |
| `orgs_delete` | `config_organizaciones_delete` | DELETE |
| `orgs_insert` | `config_organizaciones_insert` | INSERT |
| `orgs_select` | `config_organizaciones_select_filtered` | SELECT |

#### config_roles

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `roles_delete` | `config_roles_delete` | DELETE |
| `roles_insert` | `config_roles_insert` | INSERT |
| `roles_read_org_filtered` | `config_roles_select_org_filtered` | SELECT |
| `roles_update` | `config_roles_update` | UPDATE |

#### config_roles_permisos

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `role_permissions_delete` | `config_roles_permisos_delete` | DELETE |
| `role_permissions_insert` | `config_roles_permisos_insert` | INSERT |
| `role_permissions_read_org_filtered` | `config_roles_permisos_select_org_filtered` | SELECT |
| `role_permissions_update` | `config_roles_permisos_update` | UPDATE |

#### dm_acciones

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `acciones_delete` | `dm_acciones_delete` | DELETE |
| `acciones_insert` | `dm_acciones_insert` | INSERT |
| `acciones_select` | `dm_acciones_select` | SELECT |
| `acciones_update` | `dm_acciones_update` | UPDATE |

#### dm_actores

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `bp_select` | `dm_actores_select` | SELECT |

#### tr_doc_comercial

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `oportunidades_select` | `tr_doc_comercial_select` | SELECT |

#### tr_tareas

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `tareas_select` | `tr_tareas_select` | SELECT |

#### vn_asociados

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `asig_acc_delete` | `vn_asociados_delete` | DELETE |
| `asig_acc_insert` | `vn_asociados_insert` | INSERT |
| `asig_acc_select` | `vn_asociados_select` | SELECT |
| `asig_acc_update` | `vn_asociados_update` | UPDATE |

#### vn_relaciones_actores

| Política Actual | Política Sugerida | Tipo |
|-----------------|-------------------|------|
| `bp_rel_delete` | `vn_relaciones_actores_delete` | DELETE |
| `bp_rel_insert` | `vn_relaciones_actores_insert` | INSERT |
| `bp_rel_select` | `vn_relaciones_actores_select` | SELECT |
| `bp_rel_update` | `vn_relaciones_actores_update` | UPDATE |

---

## 🟠 FUNCIONES - ANÁLISIS DETALLADO

### Resumen

| Categoría | Cantidad | Observación |
|-----------|----------|--------------|
| **Total funciones** | 43 | Todas sin prefijo de tabla |
| **Con prefijo dm_/tr_/vn_/config_** | 0 | **0%** siguen la convención |
| **Sin prefijo** | 43 | Todas |

### Funciones Agrupadas por Tabla Objetivo

#### Funciones para dm_actores

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `generar_codigo_dm_actores` | `dm_actores_generar_codigo` | Trigger |
| `soft_delete_bp` | `dm_actores_soft_delete` | CRUD |

#### Funciones para dm_acciones

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `actualizar_accion` | `dm_acciones_actualizar` | RPC |
| `crear_accion` | `dm_acciones_crear` | RPC |

#### Funciones para tr_doc_comercial

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `actualizar_oportunidad` | `tr_doc_comercial_actualizar` | RPC |
| `crear_doc_comercial` | `tr_doc_comercial_crear` | RPC |
| `gen_codigo_oportunidad` | `tr_doc_comercial_generar_codigo` | Función |
| `calcular_valor_total_oportunidad` | `tr_doc_comercial_calcular_total` | Trigger |
| `soft_delete_oportunidad_by_id` | `tr_doc_comercial_soft_delete_by_id` | CRUD |
| `soft_delete_oportunidades` | `tr_doc_comercial_soft_delete` | Trigger |

#### Funciones para tr_tareas

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `actualizar_tarea` | `tr_tareas_actualizar` | RPC |
| `crear_tarea` | `tr_tareas_crear` | RPC |
| `generar_codigo_tarea` | `tr_tareas_generar_codigo` | Trigger |

#### Funciones para vn_asociados

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `finalizar_asignacion_accion` | `vn_asociados_finalizar` | RPC |
| `generar_codigo_completo_asignacion` | `vn_asociados_generar_codigo_completo` | Trigger |
| `generar_siguiente_subcodigo` | `vn_asociados_generar_siguiente_subcodigo` | Función |
| `transferir_accion` | `vn_asociados_transferir` | RPC |

#### Funciones para vn_relaciones_actores

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `actualizar_relacion_bp` | `vn_relaciones_actores_actualizar` | RPC |
| `crear_relacion_bp` | `vn_relaciones_actores_crear` | RPC |
| `eliminar_relacion_bp` | `vn_relaciones_actores_eliminar` | RPC |
| `finalizar_relacion_bp` | `vn_relaciones_actores_finalizar` | RPC |
| `obtener_relaciones_bp` | `vn_relaciones_actores_obtener` | RPC |

#### Funciones para config_*

| Función Actual | Sugerencia | Tipo |
|----------------|------------|------|
| `is_org_admin` | `config_organizaciones_is_admin` | Utilidad |
| `is_org_admin_v2` | `config_organizaciones_is_admin_v2` | Utilidad |
| `is_org_member` | `config_organizaciones_is_member` | Utilidad |
| `is_org_owner` | `config_organizaciones_is_owner` | Utilidad |
| `is_org_owner_v2` | `config_organizaciones_is_owner_v2` | Utilidad |
| `user_role_in_org` | `config_organizaciones_user_role` | Utilidad |
| `user_role_in_org_v2` | `config_organizaciones_user_role_v2` | Utilidad |
| `org_has_other_owner` | `config_organizaciones_has_other_owner` | Utilidad |
| `org_has_other_owner_v2` | `config_organizaciones_has_other_owner_v2` | Utilidad |
| `assign_owner_on_org_create` | `config_organizaciones_assign_owner_on_create` | Trigger |
| `search_locations` | `config_ciudades_search` | RPC |
| `geographic_locations_build_search_text` | `config_ciudades_build_search_text` | Trigger |
| `geographic_locations_sanitize` | `config_ciudades_sanitize` | Trigger |

#### Funciones de Utilidad General (Sin tabla específica)

| Función Actual | Observación |
|----------------|-------------|
| `can_user` | Mantener nombre (función de autorización genérica) |
| `can_user_v2` | Mantener nombre (versión mejorada) |
| `can_view_org_membership` | Mantener nombre (función de autorización) |
| `can_view_org_membership_v2` | Mantener nombre (versión mejorada) |
| `has_org_permission` | Mantener nombre (función de autorización) |
| `set_audit_fields` | Mantener nombre (trigger genérico) |
| `set_updated_at` | Mantener nombre (trigger genérico) |
| `actualizar_timestamp` | Mantener nombre (trigger genérico) |
| `actualizar_timestamp_config` | Mantener nombre (trigger genérico) |
| `set_audit_user_columns` | Mantener nombre (trigger genérico) |
| `enforce_created_by` | Mantener nombre (trigger genérico) |
| `set_deleted_by_on_soft_delete` | Mantener nombre (trigger genérico) |
| `get_user_email` | Mantener nombre (función de auth) |
| `get_user_orgs` | Mantener nombre (función de auth) |
| `_normalize_civil_status` | Mantener nombre (función de utilidad) |
| `unaccent_lower` | Mantener nombre (función de utilidad) |
| `validar_asignacion_accion` | Mantener nombre (trigger genérico) |
| `calcular_digito_verificacion_nit` | Mantener nombre (función de utilidad) |
| `tareas_broadcast_trigger` | Mantener nombre (trigger genérico) |
| `oportunidades_broadcast_trigger` | Mantener nombre (trigger genérico) |

---

## ✅ VERIFICACIÓN DE OBJETOS HUÉRFANOS

### Políticas RLS

| Estado | Resultado |
|--------|-----------|
| **Políticas sin tabla** | ✅ **0** - Todas las políticas tienen su tabla |
| **Tablas huérfanas** | ✅ **0** - Todas las tablas existen |

### Funciones

| Estado | Resultado |
|--------|-----------|
| **Funciones sin dependencias** | 43 funciones (todas) |
| **Observación** | Normal para funciones/triggers que no hacen SELECT directo |

---

## 📊 IMPACTO DE LA RENOMBRACIÓN

### Riesgos

| Riesgo | Nivel | Mitigación |
|--------|-------|------------|
| **Breaking changes en aplicación** | 🔴 ALTO | Actualizar referencias en código |
| **Referencias en documentación** | 🟡 MEDIO | Actualizar docs simultáneamente |
| **Funciones externas (API)** | 🟡 MEDIO | Versionado de API |
| **Triggers existentes** | 🟠 MEDIO | Recrear triggers con nuevo nombre |

### Estimación de Esfuerzo

| Categoría | Cantidad a Renombrar | Estimado |
|-----------|---------------------|----------|
| **Políticas RLS** | 26 | 2-4 horas |
| **Funciones** | ~30 (excluyendo genéricas) | 4-6 horas |
| **Total** | ~56 objetos | 6-10 horas |

---

## 🎯 RECOMENDACIONES

### 1. Priorizar por Criticidad

#### 🔴 ALTA PRIORIDAD (Funcionalidad Core)

Renombrar primero funciones/políticas que afectan:
- **dm_actores** (1 política)
- **tr_doc_comercial** (1 política + 6 funciones)
- **tr_tareas** (1 política + 3 funciones)

#### 🟠 MEDIA PRIORIDAD (Configuración)

- **config_organizaciones** (5 políticas + 9 funciones)
- **config_roles** (4 políticas)
- **config_roles_permisos** (4 políticas)

#### 🟡 BAJA PRIORIDAD (Vinculación)

- **vn_asociados** (4 políticas + 4 funciones)
- **vn_relaciones_actores** (4 políticas + 5 funciones)

### 2. Estrategia de Migración

#### Fase 1: Preparación
```sql
-- 1. Crear script de renombración
-- 2. Hacer backup de policies y functions
-- 3. Preparar script de rollback
```

#### Fase 2: Renombración por Fases
```sql
-- Por cada tabla:
-- 1. Crear nuevas políticas/funciones con nombre correcto
-- 2. Actualizar código de aplicación
-- 3. Eliminar políticas/funciones antiguas
```

#### Fase 3: Verificación
```sql
-- Verificar que todo funcione correctamente
-- Actualizar documentación
-- Comunicar cambios al equipo
```

### 3. Mantener Sin Cambio

**Funciones/Políticas que NO necesitan renombrarse:**

- Triggers genéricos: `set_audit_fields`, `set_updated_at`, etc.
- Funciones de autorización: `can_user`, `can_user_v2`, etc.
- Funciones de utilidad: `calcular_digito_verificacion_nit`, `unaccent_lower`
- Funciones que no son específicas de una tabla

---

## 📝 SCRIPTS DE RENOMBRACIÓN

Ejemplo para una tabla:

```sql
-- ============================================================================
-- EJEMPLO: Renombrar políticas de dm_actores
-- ============================================================================

-- 1. Crear nuevas políticas con nombre correcto
CREATE POLICY dm_actores_select ON dm_actores
  FOR SELECT TO authenticated
  USING (
    organizacion_id IN (
      SELECT organization_id
      FROM config_organizacion_miembros
      WHERE user_id = auth.uid()
        AND eliminado_en IS NULL
    )
    AND eliminado_en IS NULL
  );

-- 2. Eliminar políticas antiguas
DROP POLICY IF EXISTS bp_select ON dm_actores;

-- 3. Verificar
SELECT policyname FROM pg_policies WHERE tablename = 'dm_actores';
```

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar este reporte** con el equipo
2. **Aprobar estrategia** de renombración
3. **Crear scripts** detallados por tabla
4. **Ejecutar en ambiente** de desarrollo/pruebas primero
5. **Actualizar código** de aplicación
6. **Desplegar a producción**
7. **Verificar y monitorear**

---

## 📚 ARCHIVOS RELACIONADOS

- [OVERVIEW.md](OVERVIEW.md) - Arquitectura y convenciones
- [TABLES.md](TABLES.md) - Diccionario de datos
- [RLS.md](RLS.md) - Políticas RLS
- [FUNCTIONS.md](FUNCTIONS.md) - Funciones de base de datos

---

**Reporte Generado:** 2026-01-08
**Auditoría Completada:** ✅ Sí
**Total Objetos Analizados:** 70 (27 políticas + 43 funciones)
