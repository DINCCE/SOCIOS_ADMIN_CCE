# Implementation Plan: Missing CRUD Functions

> **Comprehensive implementation plan for building missing CRUD functions identified in the database functions audit report**
>
> Created: 2026-01-03
> Based on: [`DATABASE_FUNCTIONS_AUDIT_REPORT.md`](./DATABASE_FUNCTIONS_AUDIT_REPORT.md)

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Implementation Strategy](#implementation-strategy)
- [Phase 1: Critical Gaps (Week 1-2)](#phase-1-critical-gaps-week-1-2)
- [Phase 2: Operations Management (Week 3-4)](#phase-2-operations-management-week-3-4)
- [Phase 3: Access Control (Week 5-6)](#phase-3-access-control-week-5-6)
- [Phase 4: Completion (Week 7-8)](#phase-4-completion-week-7-8)
- [Role-Based Authorization Integration](#role-based-authorization-integration)
- [Technical Approach for Supabase Calls](#technical-approach-for-supabase-calls)
- [Error Handling and Security](#error-handling-and-security)
- [Documentation Updates](#documentation-updates)
- [Testing Strategy](#testing-strategy)
- [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State

| Metric | Count | Percentage |
|--------|--------|------------|
| **Total Tables** | 13 | 100% |
| **Tables with Full CRUD** | 2 | 15.4% |
| **Tables with Partial CRUD** | 3 | 23.1% |
| **Tables with No Frontend Functions** | 8 | 61.5% |
| **Total Missing Functions** | 47 | N/A |

### Critical Gaps

1. **No soft delete functions** - Only hard delete exists in test code
2. **No bulk operations** - No batch create, update, or delete functions
3. **Missing search functions** - No dedicated search/filter RPC functions
4. **Incomplete CRUD coverage** - 8 tables (61.5%) have no frontend functions
5. **No relationship management UI** - RPC exists but no frontend integration

### Implementation Goal

Achieve **100% CRUD coverage** across all 13 tables with:
- ✅ Role-based authorization for all operations
- ✅ Consistent error handling and security checks
- ✅ Soft delete pattern implementation
- ✅ Comprehensive documentation updates
- ✅ Integration with existing UI components

---

## Implementation Strategy

### Development Principles

1. **Follow Existing Patterns** - Use established conventions from [`app/actions/personas.ts`](../app/actions/personas.ts) and [`app/actions/empresas.ts`](../app/actions/empresas.ts)
2. **Leverage Existing RPC Functions** - Wrap existing database RPC functions where available
3. **Create Missing RPC Functions** - Develop new RPC functions for tables without them
4. **Enforce RLS** - All functions respect Row Level Security policies
5. **Maintain Type Safety** - Use TypeScript with proper type definitions from [`types_db.ts`](../types_db.ts)
6. **Consistent Error Handling** - Standardized error responses and user feedback

### File Structure

```
app/actions/
├── personas.ts              # ✅ EXISTS - Add soft delete
├── empresas.ts              # ✅ EXISTS - Add update & soft delete
├── relaciones.ts           # ❌ NEW - Relationship management
├── acciones.ts             # ❌ NEW - Club shares management
├── oportunidades.ts         # ❌ NEW - Opportunities management
├── tareas.ts              # ❌ NEW - Tasks management
└── admin/
    ├── organizations.ts     # ❌ NEW - Organization CRUD
    ├── members.ts          # ❌ NEW - Organization members
    ├── roles.ts           # ❌ NEW - Role management
    └── permissions.ts     # ❌ NEW - Permission management
```

### Naming Conventions

**Standardize on:**
- `create{Entity}` for CREATE operations
- `update{Entity}` for UPDATE operations
- `delete{Entity}` for DELETE operations (soft delete)
- `list{Entities}` for READ operations
- Spanish RPC function names (existing pattern: `crear_persona`, `crear_empresa`)

---

## Phase 1: Critical Gaps (Week 1-2)

### Priority: HIGH

### 1.1 Soft Delete Functions

**Target:** All 13 tables

**Implementation:**

#### 1.1.1 Add `softDeletePersona` to [`app/actions/personas.ts`](../app/actions/personas.ts)

```typescript
/**
 * Soft delete a persona by setting eliminado_en timestamp
 * Also updates business_partners.eliminado_en for consistency
 *
 * @param id - The UUID of the persona to soft delete
 * @returns Object with { success, message, error? }
 */
export async function softDeletePersona(id: string) {
  const supabase = await createClient()

  // 1. Soft delete personas record
  const { error: personaError } = await supabase
    .from('personas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (personaError) {
    console.error('Error soft deleting persona:', personaError)
    return {
      success: false,
      message: `Error al eliminar persona: ${personaError.message}`,
      error: personaError
    }
  }

  // 2. Soft delete corresponding business_partners record
  const { error: bpError } = await supabase
    .from('business_partners')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (bpError) {
    console.error('Error soft deleting business_partner:', bpError)
    return {
      success: false,
      message: `Error al eliminar business partner: ${bpError.message}`,
      error: bpError
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/personas')
  revalidatePath(`/admin/socios/personas/${id}`)

  return {
    success: true,
    message: 'Persona eliminada correctamente'
  }
}
```

#### 1.1.2 Add `softDeleteEmpresa` to [`app/actions/empresas.ts`](../app/actions/empresas.ts)

```typescript
/**
 * Soft delete an empresa by setting eliminado_en timestamp
 * Also updates business_partners.eliminado_en for consistency
 *
 * @param id - The UUID of the empresa to soft delete
 * @returns Object with { success, message, error? }
 */
export async function softDeleteEmpresa(id: string) {
  const supabase = await createClient()

  // 1. Soft delete empresas record
  const { error: empresaError } = await supabase
    .from('empresas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (empresaError) {
    console.error('Error soft deleting empresa:', empresaError)
    return {
      success: false,
      message: `Error al eliminar empresa: ${empresaError.message}`,
      error: empresaError
    }
  }

  // 2. Soft delete corresponding business_partners record
  const { error: bpError } = await supabase
    .from('business_partners')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (bpError) {
    console.error('Error soft deleting business_partner:', bpError)
    return {
      success: false,
      message: `Error al eliminar business partner: ${bpError.message}`,
      error: bpError
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/empresas')

  return {
    success: true,
    message: 'Empresa eliminada correctamente'
  }
}
```

#### 1.1.3 Add `actualizarEmpresa` to [`app/actions/empresas.ts`](../app/actions/empresas.ts)

```typescript
/**
 * Update empresa data
 *
 * @param id - The UUID of the empresa
 * @param data - Partial empresa data to update
 * @returns Object with { success, message, error? }
 */
export async function actualizarEmpresa(
  id: string,
  data: Partial<{
    razon_social: string
    nombre_comercial: string
    nit: string
    digito_verificacion: string
    tipo_sociedad: string
    fecha_constitucion: string
    ciudad_constitucion: string
    pais_constitucion: string
    numero_registro: string
    codigo_ciiu: string
    sector_industria: string
    actividad_economica: string
    tamano_empresa: string
    representante_legal_id: string
    cargo_representante: string
    email_secundario: string
    telefono_secundario: string
    whatsapp: string
    website: string
    linkedin_url: string
    facebook_url: string
    instagram_handle: string
    twitter_handle: string
    logo_url: string
    ingresos_anuales: number
    numero_empleados: number
    atributos: Record<string, unknown>
  }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('empresas')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating empresa:', error)
    return {
      success: false,
      message: `Error al actualizar empresa: ${error.message}`,
      error
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/empresas')

  return {
    success: true,
    message: 'Empresa actualizada correctamente'
  }
}
```

#### 1.1.4 Update FloatingActionBar Delete Handler

Modify [`features/socios/personas/data-table.tsx`](../features/socios/personas/data-table.tsx:235) to call `softDeletePersona`:

```typescript
onDelete={async () => {
  const selectedIds = table.getFilteredSelectedRowModel().rows.map(
    row => (row.original as { id: string }).id
  )
  
  // Call soft delete for each selected persona
  for (const id of selectedIds) {
    const result = await softDeletePersona(id)
    if (!result.success) {
      // Show error notification
      console.error(result.message)
    }
  }
  
  // Refresh data
  router.refresh()
}}
```

---

### 1.2 Relationship Management

**Target:** [`bp_relaciones`](../docs/database/TABLES.md:434) table

**Status:** 5 RPC functions exist, 0 frontend functions

**Implementation:**

#### 1.2.1 Create [`app/actions/relaciones.ts`](../app/actions/relaciones.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a relationship between two business partners
 * Wrapper for RPC function crear_relacion_bp
 *
 * @param data - Relationship creation data
 * @returns Object with { success, message, relacion_id? }
 */
export async function crearRelacionFromForm(data: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
  descripcion?: string
  fecha_inicio?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  // Get organization from origen BP
  const { data: bpData } = await supabase
    .from('business_partners')
    .select('organizacion_id')
    .eq('id', data.bp_origen_id)
    .single()

  if (!bpData) {
    return {
      success: false,
      message: 'No se encontró el business partner de origen'
    }
  }

  // Call RPC function
  const { data: rpcResponse, error } = await supabase.rpc('crear_relacion_bp', {
    p_bp_origen_id: data.bp_origen_id,
    p_bp_destino_id: data.bp_destino_id,
    p_tipo_relacion: data.tipo_relacion,
    p_descripcion: data.descripcion,
    p_fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating relationship:', error)
    return {
      success: false,
      message: `Error al crear relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación creada correctamente',
    relacion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an existing relationship
 * Wrapper for RPC function actualizar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @param data - Partial relationship data to update
 * @returns Object with { success, message }
 */
export async function actualizarRelacion(
  relacion_id: string,
  data: {
    tipo_relacion?: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
    descripcion?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_tipo_relacion: data.tipo_relacion,
    p_descripcion: data.descripcion,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating relationship:', error)
    return {
      success: false,
      message: `Error al actualizar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación actualizada correctamente'
  }
}

/**
 * End a relationship by setting fecha_fin
 * Wrapper for RPC function finalizar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @param fecha_fin - End date (default: today)
 * @returns Object with { success, message }
 */
export async function finalizarRelacion(
  relacion_id: string,
  fecha_fin?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('finalizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_fecha_fin: fecha_fin || new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error finalizing relationship:', error)
    return {
      success: false,
      message: `Error al finalizar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación finalizada correctamente'
  }
}

/**
 * Soft delete a relationship
 * Wrapper for RPC function eliminar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @returns Object with { success, message }
 */
export async function eliminarRelacion(relacion_id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('eliminar_relacion_bp', {
    p_relacion_id: relacion_id
  })

  if (error) {
    console.error('Error deleting relationship:', error)
    return {
      success: false,
      message: `Error al eliminar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación eliminada correctamente'
  }
}

/**
 * Get all relationships for a business partner (bidirectional)
 * Wrapper for RPC function obtener_relaciones_bp
 *
 * @param bp_id - The UUID of the business partner
 * @param solo_vigentes - Return only active relationships (default: true)
 * @returns Array of relationships or error
 */
export async function obtenerRelaciones(
  bp_id: string,
  solo_vigentes: boolean = true
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
    p_bp_id: bp_id,
    p_solo_vigentes: solo_vigentes
  })

  if (error) {
    console.error('Error fetching relationships:', error)
    return {
      success: false,
      message: `Error al obtener relaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

### 1.3 Acciones Management

**Target:** [`acciones`](../docs/database/TABLES.md:552) and [`asignaciones_acciones`](../docs/database/TABLES.md:618) tables

**Status:** 4 RPC functions exist for asignaciones, 0 for acciones, 0 frontend functions

**Implementation:**

#### 1.3.1 Create RPC Function for Acciones CRUD

First, create the missing RPC function in the database:

```sql
-- Create RPC function for creating acciones
CREATE OR REPLACE FUNCTION crear_accion(
  p_organizacion_id UUID,
  p_codigo_accion TEXT,
  p_estado TEXT DEFAULT 'disponible'
) RETURNS acciones AS $$
DECLARE
  v_accion acciones%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('acciones', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new accion
  INSERT INTO acciones (organizacion_id, codigo_accion, estado)
  VALUES (p_organizacion_id, p_codigo_accion, p_estado)
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating acciones
CREATE OR REPLACE FUNCTION actualizar_accion(
  p_accion_id UUID,
  p_estado TEXT DEFAULT NULL
) RETURNS acciones AS $$
DECLARE
  v_accion acciones%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_accion.organizacion_id
  FROM acciones WHERE id = p_accion_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('acciones', 'update', v_accion.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update accion
  UPDATE acciones
  SET estado = COALESCE(p_estado, estado)
  WHERE id = p_accion_id
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3.2 Create [`app/actions/acciones.ts`](../app/actions/acciones.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new accion (club share)
 *
 * @param data - Accion creation data
 * @returns Object with { success, message, accion_id? }
 */
export async function crearAccion(data: {
  organizacion_id: string
  codigo_accion: string
  estado?: string
}) {
  const supabase = await createClient()

  const { data: rpcResponse, error } = await supabase.rpc('crear_accion', {
    p_organizacion_id: data.organizacion_id,
    p_codigo_accion: data.codigo_accion,
    p_estado: data.estado || 'disponible'
  })

  if (error) {
    console.error('Error creating accion:', error)
    return {
      success: false,
      message: `Error al crear acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Acción creada correctamente',
    accion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an accion
 *
 * @param accion_id - The UUID of the accion
 * @param data - Partial accion data to update
 * @returns Object with { success, message }
 */
export async function actualizarAccion(
  accion_id: string,
  data: {
    estado?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_accion', {
    p_accion_id: accion_id,
    p_estado: data.estado
  })

  if (error) {
    console.error('Error updating accion:', error)
    return {
      success: false,
      message: `Error al actualizar acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Acción actualizada correctamente'
  }
}

/**
 * Soft delete an accion
 *
 * @param accion_id - The UUID of the accion
 * @returns Object with { success, message }
 */
export async function softDeleteAccion(accion_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('acciones')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', accion_id)

  if (error) {
    console.error('Error soft deleting accion:', error)
    return {
      success: false,
      message: `Error al eliminar acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Acción eliminada correctamente'
  }
}

/**
 * List all acciones for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @returns Array of acciones or error
 */
export async function listAcciones(organizacion_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('acciones')
    .select('*')
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .order('codigo_accion', { ascending: true })

  if (error) {
    console.error('Error fetching acciones:', error)
    return {
      success: false,
      message: `Error al obtener acciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}

/**
 * Create an action assignment
 * Wrapper for RPC function crear_asignacion_accion
 *
 * @param data - Assignment creation data
 * @returns Object with { success, message, asignacion_id? }
 */
export async function crearAsignacion(data: {
  accion_id: string
  persona_id: string
  tipo_asignacion: 'dueño' | 'titular' | 'beneficiario'
  subcodigo?: string
  fecha_inicio?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  // Get organization from accion
  const { data: accionData } = await supabase
    .from('acciones')
    .select('organizacion_id')
    .eq('id', data.accion_id)
    .single()

  if (!accionData) {
    return {
      success: false,
      message: 'No se encontró la acción'
    }
  }

  const { data: rpcResponse, error } = await supabase.rpc('crear_asignacion_accion', {
    p_accion_id: data.accion_id,
    p_persona_id: data.persona_id,
    p_tipo_asignacion: data.tipo_asignacion,
    p_subcodigo: data.subcodigo,
    p_fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating assignment:', error)
    return {
      success: false,
      message: `Error al crear asignación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')
  revalidatePath(`/admin/socios/acciones/${data.accion_id}`)

  return {
    success: true,
    message: 'Asignación creada correctamente',
    asignacion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Transfer action ownership to a new owner
 * Wrapper for RPC function transferir_accion
 *
 * @param data - Transfer data
 * @returns Object with { success, message }
 */
export async function transferirAccion(data: {
  accion_id: string
  nuevo_dueno_id: string
  fecha_transferencia?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('transferir_accion', {
    p_accion_id: data.accion_id,
    p_nuevo_dueno_id: data.nuevo_dueno_id,
    p_fecha_transferencia: data.fecha_transferencia || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error transferring accion:', error)
    return {
      success: false,
      message: `Error al transferir acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')
  revalidatePath(`/admin/socios/acciones/${data.accion_id}`)

  return {
    success: true,
    message: 'Acción transferida correctamente'
  }
}

/**
 * End an action assignment
 * Wrapper for RPC function finalizar_asignacion_accion
 *
 * @param asignacion_id - The UUID of the assignment
 * @param fecha_fin - End date (default: today)
 * @returns Object with { success, message }
 */
export async function finalizarAsignacion(
  asignacion_id: string,
  fecha_fin?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('finalizar_asignacion_accion', {
    p_asignacion_id: asignacion_id,
    p_fecha_fin: fecha_fin || new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error finalizing assignment:', error)
    return {
      success: false,
      message: `Error al finalizar asignación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Asignación finalizada correctamente'
  }
}

/**
 * List all assignments for an action
 *
 * @param accion_id - The UUID of the action
 * @param solo_vigentes - Return only active assignments (default: true)
 * @returns Array of assignments or error
 */
export async function listAsignaciones(
  accion_id: string,
  solo_vigentes: boolean = true
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asignaciones_acciones')
    .select(`
      *,
      business_partners (
        id,
        codigo_bp,
        tipo_actor,
        email_principal
      )
    `)
    .eq('accion_id', accion_id)
    .is('eliminado_en', null)

  if (solo_vigentes) {
    // Filter for active assignments (es_vigente = true)
    // This is a generated column, so we can't use .is()
    // We'll filter in the query
  }

  if (error) {
    console.error('Error fetching asignaciones:', error)
    return {
      success: false,
      message: `Error al obtener asignaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}

/**
 * Soft delete an assignment
 *
 * @param asignacion_id - The UUID of the assignment
 * @returns Object with { success, message }
 */
export async function softDeleteAsignacion(asignacion_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('asignaciones_acciones')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', asignacion_id)

  if (error) {
    console.error('Error soft deleting asignacion:', error)
    return {
      success: false,
      message: `Error al eliminar asignación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Asignación eliminada correctamente'
  }
}
```

---

## Phase 2: Operations Management (Week 3-4)

### Priority: HIGH

### 2.1 Opportunities Management

**Target:** [`oportunidades`](../docs/database/TABLES.md:973) table

**Status:** 0 RPC functions, 0 frontend functions

**Implementation:**

#### 2.1.1 Create RPC Functions for Oportunidades CRUD

```sql
-- Create RPC function for creating oportunidades
CREATE OR REPLACE FUNCTION crear_oportunidad(
  p_organizacion_id UUID,
  p_codigo TEXT,
  p_tipo tipo_oportunidad_enum,
  p_solicitante_id UUID,
  p_responsable_id UUID DEFAULT NULL,
  p_monto_estimado NUMERIC DEFAULT NULL,
  p_notas TEXT DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb
) RETURNS oportunidades AS $$
DECLARE
  v_oportunidad oportunidades%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('oportunidades', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new oportunidad
  INSERT INTO oportunidades (
    organizacion_id,
    codigo,
    tipo,
    solicitante_id,
    responsable_id,
    monto_estimado,
    notas,
    atributos
  )
  VALUES (
    p_organizacion_id,
    p_codigo,
    p_tipo,
    p_solicitante_id,
    p_responsable_id,
    p_monto_estimado,
    p_notas,
    p_atributos
  )
  RETURNING * INTO v_oportunidad;

  RETURN v_oportunidad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating oportunidades
CREATE OR REPLACE FUNCTION actualizar_oportunidad(
  p_oportunidad_id UUID,
  p_estado estado_oportunidad_enum DEFAULT NULL,
  p_responsable_id UUID DEFAULT NULL,
  p_monto_estimado NUMERIC DEFAULT NULL,
  p_notas TEXT DEFAULT NULL,
  p_atributos JSONB DEFAULT NULL
) RETURNS oportunidades AS $$
DECLARE
  v_oportunidad oportunidades%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_oportunidad.organizacion_id
  FROM oportunidades WHERE id = p_oportunidad_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('oportunidades', 'update', v_oportunidad.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update oportunidad
  UPDATE oportunidades
  SET
    estado = COALESCE(p_estado, estado),
    responsable_id = COALESCE(p_responsable_id, responsable_id),
    monto_estimado = COALESCE(p_monto_estimado, monto_estimado),
    notas = COALESCE(p_notas, notas),
    atributos = COALESCE(p_atributos, atributos)
  WHERE id = p_oportunidad_id
  RETURNING * INTO v_oportunidad;

  RETURN v_oportunidad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.1.2 Create [`app/actions/oportunidades.ts`](../app/actions/oportunidades.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new oportunidad
 *
 * @param data - Oportunidad creation data
 * @returns Object with { success, message, oportunidad_id? }
 */
export async function crearOportunidad(data: {
  organizacion_id: string
  codigo: string
  tipo: 'Solicitud Retiro' | 'Solicitud Ingreso'
  solicitante_id: string
  responsable_id?: string
  monto_estimado?: number
  notas?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: rpcResponse, error } = await supabase.rpc('crear_oportunidad', {
    p_organizacion_id: data.organizacion_id,
    p_codigo: data.codigo,
    p_tipo: data.tipo,
    p_solicitante_id: data.solicitante_id,
    p_responsable_id: data.responsable_id,
    p_monto_estimado: data.monto_estimado,
    p_notas: data.notas,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating oportunidad:', error)
    return {
      success: false,
      message: `Error al crear oportunidad: ${error.message}`
    }
  }

  revalidatePath('/admin/oportunidades')

  return {
    success: true,
    message: 'Oportunidad creada correctamente',
    oportunidad_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an oportunidad
 *
 * @param oportunidad_id - The UUID of the oportunidad
 * @param data - Partial oportunidad data to update
 * @returns Object with { success, message }
 */
export async function actualizarOportunidad(
  oportunidad_id: string,
  data: {
    estado?: 'abierta' | 'en_proceso' | 'ganada' | 'perdida' | 'cancelada'
    responsable_id?: string
    monto_estimado?: number
    notas?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_oportunidad', {
    p_oportunidad_id: oportunidad_id,
    p_estado: data.estado,
    p_responsable_id: data.responsable_id,
    p_monto_estimado: data.monto_estimado,
    p_notas: data.notas,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating oportunidad:', error)
    return {
      success: false,
      message: `Error al actualizar oportunidad: ${error.message}`
    }
  }

  revalidatePath('/admin/oportunidades')
  revalidatePath(`/admin/oportunidades/${oportunidad_id}`)

  return {
    success: true,
    message: 'Oportunidad actualizada correctamente'
  }
}

/**
 * Soft delete an oportunidad
 *
 * @param oportunidad_id - The UUID of the oportunidad
 * @returns Object with { success, message }
 */
export async function softDeleteOportunidad(oportunidad_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('oportunidades')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', oportunidad_id)

  if (error) {
    console.error('Error soft deleting oportunidad:', error)
    return {
      success: false,
      message: `Error al eliminar oportunidad: ${error.message}`
    }
  }

  revalidatePath('/admin/oportunidades')

  return {
    success: true,
    message: 'Oportunidad eliminada correctamente'
  }
}

/**
 * List all oportunidades for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @param filters - Optional filters (estado, tipo)
 * @returns Array of oportunidades or error
 */
export async function listOportunidades(
  organizacion_id: string,
  filters?: {
    estado?: 'abierta' | 'en_proceso' | 'ganada' | 'perdida' | 'cancelada'
    tipo?: 'Solicitud Retiro' | 'Solicitud Ingreso'
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('oportunidades')
    .select(`
      *,
      solicitante (
        id,
        codigo_bp,
        tipo_actor,
        email_principal
      ),
      responsable (
        id,
        email
      )
    `)
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .order('fecha_solicitud', { ascending: false })

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching oportunidades:', error)
    return {
      success: false,
      message: `Error al obtener oportunidades: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

### 2.2 Tasks Management

**Target:** [`tareas`](../docs/database/TABLES.md:1052) table

**Status:** 0 RPC functions, 0 frontend functions

**Implementation:**

#### 2.2.1 Create RPC Functions for Tareas CRUD

```sql
-- Create RPC function for creating tareas
CREATE OR REPLACE FUNCTION crear_tarea(
  p_organizacion_id UUID,
  p_titulo TEXT,
  p_descripcion TEXT DEFAULT NULL,
  p_prioridad prioridad_tarea_enum DEFAULT 'media',
  p_oportunidad_id UUID DEFAULT NULL,
  p_asignado_a UUID DEFAULT NULL,
  p_relacionado_con_bp UUID DEFAULT NULL,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb
) RETURNS tareas AS $$
DECLARE
  v_tarea tareas%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('tareas', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new tarea
  INSERT INTO tareas (
    organizacion_id,
    titulo,
    descripcion,
    prioridad,
    oportunidad_id,
    asignado_a,
    relacionado_con_bp,
    fecha_vencimiento,
    atributos
  )
  VALUES (
    p_organizacion_id,
    p_titulo,
    p_descripcion,
    p_prioridad,
    p_oportunidad_id,
    p_asignado_a,
    p_relacionado_con_bp,
    p_fecha_vencimiento,
    p_atributos
  )
  RETURNING * INTO v_tarea;

  RETURN v_tarea;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating tareas
CREATE OR REPLACE FUNCTION actualizar_tarea(
  p_tarea_id UUID,
  p_titulo TEXT DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL,
  p_prioridad prioridad_tarea_enum DEFAULT NULL,
  p_estado estado_tarea_enum DEFAULT NULL,
  p_oportunidad_id UUID DEFAULT NULL,
  p_asignado_a UUID DEFAULT NULL,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_atributos JSONB DEFAULT NULL
) RETURNS tareas AS $$
DECLARE
  v_tarea tareas%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_tarea.organizacion_id
  FROM tareas WHERE id = p_tarea_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('tareas', 'update', v_tarea.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update tarea
  UPDATE tareas
  SET
    titulo = COALESCE(p_titulo, titulo),
    descripcion = COALESCE(p_descripcion, descripcion),
    prioridad = COALESCE(p_prioridad, prioridad),
    estado = COALESCE(p_estado, estado),
    oportunidad_id = COALESCE(p_oportunidad_id, oportunidad_id),
    asignado_a = COALESCE(p_asignado_a, asignado_a),
    fecha_vencimiento = COALESCE(p_fecha_vencimiento, fecha_vencimiento),
    atributos = COALESCE(p_atributos, atributos)
  WHERE id = p_tarea_id
  RETURNING * INTO v_tarea;

  RETURN v_tarea;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.2.2 Create [`app/actions/tareas.ts`](../app/actions/tareas.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new tarea
 *
 * @param data - Tarea creation data
 * @returns Object with { success, message, tarea_id? }
 */
export async function crearTarea(data: {
  organizacion_id: string
  titulo: string
  descripcion?: string
  prioridad?: 'baja' | 'media' | 'alta' | 'critica'
  oportunidad_id?: string
  asignado_a?: string
  relacionado_con_bp?: string
  fecha_vencimiento?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: rpcResponse, error } = await supabase.rpc('crear_tarea', {
    p_organizacion_id: data.organizacion_id,
    p_titulo: data.titulo,
    p_descripcion: data.descripcion,
    p_prioridad: data.prioridad || 'media',
    p_oportunidad_id: data.oportunidad_id,
    p_asignado_a: data.asignado_a,
    p_relacionado_con_bp: data.relacionado_con_bp,
    p_fecha_vencimiento: data.fecha_vencimiento,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating tarea:', error)
    return {
      success: false,
      message: `Error al crear tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/tareas')

  return {
    success: true,
    message: 'Tarea creada correctamente',
    tarea_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update a tarea
 *
 * @param tarea_id - The UUID of the tarea
 * @param data - Partial tarea data to update
 * @returns Object with { success, message }
 */
export async function actualizarTarea(
  tarea_id: string,
  data: {
    titulo?: string
    descripcion?: string
    prioridad?: 'baja' | 'media' | 'alta' | 'critica'
    estado?: 'pendiente' | 'en_progreso' | 'bloqueada' | 'hecha' | 'cancelada'
    oportunidad_id?: string
    asignado_a?: string
    fecha_vencimiento?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_tarea', {
    p_tarea_id: tarea_id,
    p_titulo: data.titulo,
    p_descripcion: data.descripcion,
    p_prioridad: data.prioridad,
    p_estado: data.estado,
    p_oportunidad_id: data.oportunidad_id,
    p_asignado_a: data.asignado_a,
    p_fecha_vencimiento: data.fecha_vencimiento,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating tarea:', error)
    return {
      success: false,
      message: `Error al actualizar tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/tareas')
  revalidatePath(`/admin/tareas/${tarea_id}`)

  return {
    success: true,
    message: 'Tarea actualizada correctamente'
  }
}

/**
 * Soft delete a tarea
 *
 * @param tarea_id - The UUID of the tarea
 * @returns Object with { success, message }
 */
export async function softDeleteTarea(tarea_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tareas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', tarea_id)

  if (error) {
    console.error('Error soft deleting tarea:', error)
    return {
      success: false,
      message: `Error al eliminar tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/tareas')

  return {
    success: true,
    message: 'Tarea eliminada correctamente'
  }
}

/**
 * List all tareas for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @param filters - Optional filters (estado, prioridad, asignado_a)
 * @returns Array of tareas or error
 */
export async function listTareas(
  organizacion_id: string,
  filters?: {
    estado?: 'pendiente' | 'en_progreso' | 'bloqueada' | 'hecha' | 'cancelada'
    prioridad?: 'baja' | 'media' | 'alta' | 'critica'
    asignado_a?: string
    oportunidad_id?: string
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('tareas')
    .select(`
      *,
      oportunidad (
        id,
        codigo,
        tipo,
        estado
      ),
      asignado (
        id,
        email
      ),
      relacionado_con_bp (
        id,
        codigo_bp,
        tipo_actor,
        email_principal
      )
    `)
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .order('fecha_vencimiento', { ascending: true })

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.prioridad) {
    query = query.eq('prioridad', filters.prioridad)
  }

  if (filters?.asignado_a) {
    query = query.eq('asignado_a', filters.asignado_a)
  }

  if (filters?.oportunidad_id) {
    query = query.eq('oportunidad_id', filters.oportunidad_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tareas:', error)
    return {
      success: false,
      message: `Error al obtener tareas: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

## Phase 3: Access Control (Week 5-6)

### Priority: MEDIUM

### 3.1 Organizations Management

**Target:** [`organizations`](../docs/database/TABLES.md:27) table

**Status:** 0 frontend functions (only read access)

**Implementation:**

#### 3.1.1 Create [`app/actions/admin/organizations.ts`](../app/actions/admin/organizations.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new organization
 *
 * @param data - Organization creation data
 * @returns Object with { success, message, organization_id? }
 */
export async function createOrganization(data: {
  nombre: string
  slug: string
  tipo?: string
  organizacion_padre_id?: string
  email?: string
  telefono?: string
  website?: string
  direccion?: Record<string, unknown>
  configuracion?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: orgData, error } = await supabase
    .from('organizations')
    .insert({
      nombre: data.nombre,
      slug: data.slug,
      tipo: data.tipo || 'club',
      organizacion_padre_id: data.organizacion_padre_id,
      email: data.email,
      telefono: data.telefono,
      website: data.website,
      direccion: data.direccion,
      configuracion: data.configuracion
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating organization:', error)
    return {
      success: false,
      message: `Error al crear organización: ${error.message}`
    }
  }

  // Creator is automatically assigned as 'owner' via trigger
  revalidatePath('/admin/organizations')

  return {
    success: true,
    message: 'Organización creada correctamente',
    organization_id: orgData.id
  }
}

/**
 * Update an organization
 *
 * @param organization_id - The UUID of the organization
 * @param data - Partial organization data to update
 * @returns Object with { success, message }
 */
export async function updateOrganization(
  organization_id: string,
  data: Partial<{
    nombre: string
    slug: string
    tipo: string
    organizacion_padre_id: string
    email: string
    telefono: string
    website: string
    direccion: Record<string, unknown>
    configuracion: Record<string, unknown>
  }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', organization_id)

  if (error) {
    console.error('Error updating organization:', error)
    return {
      success: false,
      message: `Error al actualizar organización: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organization_id}`)

  return {
    success: true,
    message: 'Organización actualizada correctamente'
  }
}

/**
 * Soft delete an organization
 *
 * @param organization_id - The UUID of the organization
 * @returns Object with { success, message }
 */
export async function softDeleteOrganization(organization_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', organization_id)

  if (error) {
    console.error('Error soft deleting organization:', error)
    return {
      success: false,
      message: `Error al eliminar organización: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')

  return {
    success: true,
    message: 'Organización eliminada correctamente'
  }
}

/**
 * List all organizations accessible to current user
 *
 * @returns Array of organizations or error
 */
export async function listOrganizations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .is('eliminado_en', null)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching organizations:', error)
    return {
      success: false,
      message: `Error al obtener organizaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

### 3.2 Organization Members Management

**Target:** [`organization_members`](../docs/database/TABLES.md:809) table

**Status:** 0 frontend functions

**Implementation:**

#### 3.2.1 Create [`app/actions/admin/members.ts`](../app/actions/admin/members.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Add a member to an organization
 *
 * @param data - Member creation data
 * @returns Object with { success, message }
 */
export async function addMember(data: {
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'analyst' | 'auditor'
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_members')
    .insert({
      user_id: data.user_id,
      organization_id: data.organization_id,
      role: data.role
    })

  if (error) {
    console.error('Error adding member:', error)
    return {
      success: false,
      message: `Error al agregar miembro: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${data.organization_id}/members`)

  return {
    success: true,
    message: 'Miembro agregado correctamente'
  }
}

/**
 * Update a member's role
 *
 * @param user_id - The UUID of the user
 * @param organization_id - The UUID of the organization
 * @param role - New role
 * @returns Object with { success, message }
 */
export async function updateMemberRole(
  user_id: string,
  organization_id: string,
  role: 'owner' | 'admin' | 'analyst' | 'auditor'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)

  if (error) {
    console.error('Error updating member role:', error)
    return {
      success: false,
      message: `Error al actualizar rol: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organization_id}/members`)

  return {
    success: true,
    message: 'Rol actualizado correctamente'
  }
}

/**
 * Remove a member from an organization
 *
 * @param user_id - The UUID of the user
 * @param organization_id - The UUID of the organization
 * @returns Object with { success, message }
 */
export async function removeMember(
  user_id: string,
  organization_id: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)

  if (error) {
    console.error('Error removing member:', error)
    return {
      success: false,
      message: `Error al eliminar miembro: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organization_id}/members`)

  return {
    success: true,
    message: 'Miembro eliminado correctamente'
  }
}

/**
 * List all members of an organization
 *
 * @param organization_id - The UUID of the organization
 * @returns Array of members or error
 */
export async function listMembers(organization_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:auth.users (
        id,
        email,
        created_at
      )
    `)
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching members:', error)
    return {
      success: false,
      message: `Error al obtener miembros: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

### 3.3 Roles Management

**Target:** [`roles`](../docs/database/TABLES.md:867) table

**Status:** 0 frontend functions

**Implementation:**

#### 3.3.1 Create [`app/actions/admin/roles.ts`](../app/actions/admin/roles.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new role
 *
 * @param data - Role creation data
 * @returns Object with { success, message, role? }
 */
export async function createRole(data: {
  role: string
  description?: string
}) {
  const supabase = await createClient()

  const { data: roleData, error } = await supabase
    .from('roles')
    .insert({
      role: data.role,
      description: data.description
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating role:', error)
    return {
      success: false,
      message: `Error al crear rol: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')

  return {
    success: true,
    message: 'Rol creado correctamente',
    role: roleData
  }
}

/**
 * Update a role
 *
 * @param role - The role identifier
 * @param data - Partial role data to update
 * @returns Object with { success, message }
 */
export async function updateRole(
  role: string,
  data: {
    description?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('roles')
    .update(data)
    .eq('role', role)

  if (error) {
    console.error('Error updating role:', error)
    return {
      success: false,
      message: `Error al actualizar rol: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')

  return {
    success: true,
    message: 'Rol actualizado correctamente'
  }
}

/**
 * Delete a role
 *
 * @param role - The role identifier
 * @returns Object with { success, message }
 */
export async function deleteRole(role: string) {
  const supabase = await createClient()

  // Prevent deleting system roles
  if (['owner', 'admin', 'analyst', 'auditor'].includes(role)) {
    return {
      success: false,
      message: 'No se pueden eliminar los roles del sistema'
    }
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('role', role)

  if (error) {
    console.error('Error deleting role:', error)
    return {
      success: false,
      message: `Error al eliminar rol: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')

  return {
    success: true,
    message: 'Rol eliminado correctamente'
  }
}

/**
 * List all roles
 *
 * @returns Array of roles or error
 */
export async function listRoles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('role', { ascending: true })

  if (error) {
    console.error('Error fetching roles:', error)
    return {
      success: false,
      message: `Error al obtener roles: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

### 3.4 Permissions Management

**Target:** [`role_permissions`](../docs/database/TABLES.md:909) table

**Status:** 0 frontend functions

**Implementation:**

#### 3.4.1 Create [`app/actions/admin/permissions.ts`](../app/actions/admin/permissions.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Grant a permission to a role
 *
 * @param data - Permission creation data
 * @returns Object with { success, message }
 */
export async function grantPermission(data: {
  role: string
  resource: string
  action: 'select' | 'insert' | 'update' | 'delete'
  allow?: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('role_permissions')
    .insert({
      role: data.role,
      resource: data.resource,
      action: data.action,
      allow: data.allow !== undefined ? data.allow : true
    })

  if (error) {
    console.error('Error granting permission:', error)
    return {
      success: false,
      message: `Error al otorgar permiso: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')
  revalidatePath(`/admin/roles/${data.role}/permissions`)

  return {
    success: true,
    message: 'Permiso otorgado correctamente'
  }
}

/**
 * Revoke a permission from a role
 *
 * @param role - The role identifier
 * @param resource - The resource name
 * @param action - The action type
 * @returns Object with { success, message }
 */
export async function revokePermission(
  role: string,
  resource: string,
  action: 'select' | 'insert' | 'update' | 'delete'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role', role)
    .eq('resource', resource)
    .eq('action', action)

  if (error) {
    console.error('Error revoking permission:', error)
    return {
      success: false,
      message: `Error al revocar permiso: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')
  revalidatePath(`/admin/roles/${data.role}/permissions`)

  return {
    success: true,
    message: 'Permiso revocado correctamente'
  }
}

/**
 * List all permissions for a role
 *
 * @param role - The role identifier
 * @returns Array of permissions or error
 */
export async function listPermissions(role: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', role)
    .order('resource', { ascending: true })

  if (error) {
    console.error('Error fetching permissions:', error)
    return {
      success: false,
      message: `Error al obtener permisos: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}

/**
 * List all permissions across all roles
 *
 * @returns Array of all permissions or error
 */
export async function listAllPermissions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .order('role', { ascending: true })

  if (error) {
    console.error('Error fetching all permissions:', error)
    return {
      success: false,
      message: `Error al obtener todos los permisos: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

## Phase 4: Completion (Week 7-8)

### Priority: LOW

### 4.1 Geographic Locations Management

**Target:** [`geographic_locations`](../docs/database/TABLES.md:734) table

**Status:** Read access exists via LocationPicker component

**Implementation:**

#### 4.1.1 Create [`app/actions/locations.ts`](../app/actions/locations.ts)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new geographic location
 *
 * @param data - Location creation data
 * @returns Object with { success, message, location_id? }
 */
export async function createLocation(data: {
  country_code: string
  country_name: string
  state_name?: string
  city_name: string
  city_code?: string
}) {
  const supabase = await createClient()

  const search_text = `${data.city_name}, ${data.state_name || ''}, ${data.country_name}`.toLowerCase()

  const { data: locationData, error } = await supabase
    .from('geographic_locations')
    .insert({
      country_code: data.country_code,
      country_name: data.country_name,
      state_name: data.state_name,
      city_name: data.city_name,
      city_code: data.city_code,
      search_text
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating location:', error)
    return {
      success: false,
      message: `Error al crear ubicación: ${error.message}`
    }
  }

  revalidatePath('/admin/locations')

  return {
    success: true,
    message: 'Ubicación creada correctamente',
    location_id: locationData.id
  }
}

/**
 * Update a geographic location
 *
 * @param location_id - The UUID of the location
 * @param data - Partial location data to update
 * @returns Object with { success, message }
 */
export async function updateLocation(
  location_id: string,
  data: Partial<{
    country_code: string
    country_name: string
    state_name: string
    city_name: string
    city_code: string
  }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('geographic_locations')
    .update(data)
    .eq('id', location_id)

  if (error) {
    console.error('Error updating location:', error)
    return {
      success: false,
      message: `Error al actualizar ubicación: ${error.message}`
    }
  }

  revalidatePath('/admin/locations')

  return {
    success: true,
    message: 'Ubicación actualizada correctamente'
  }
}

/**
 * Soft delete a geographic location
 *
 * @param location_id - The UUID of the location
 * @returns Object with { success, message }
 */
export async function softDeleteLocation(location_id: string) {
  const supabase = await createClient()

  // Note: geographic_locations doesn't have eliminado_en field
  // This would require schema modification
  // For now, we'll skip this function

  return {
    success: false,
    message: 'La eliminación de ubicaciones no está implementada'
  }
}

/**
 * Search locations by term
 *
 * @param searchTerm - The search term
 * @param limit - Maximum results (default: 20)
 * @returns Array of locations or error
 */
export async function searchLocations(searchTerm: string, limit: number = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('geographic_locations')
    .select('*')
    .ilike('search_text', `%${searchTerm}%`)
    .limit(limit)
    .order('city_name', { ascending: true })

  if (error) {
    console.error('Error searching locations:', error)
    return {
      success: false,
      message: `Error al buscar ubicaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
```

---

## Role-Based Authorization Integration

### Authorization Architecture

The SOCIOS_ADMIN project implements a comprehensive role-based access control (RBAC) system with the following components:

1. **[`roles`](../docs/database/TABLES.md:867) table** - Defines available roles (owner, admin, analyst, auditor)
2. **[`role_permissions`](../docs/database/TABLES.md:909) table** - Maps roles to resource + action permissions
3. **[`organization_members`](../docs/database/TABLES.md:809) table** - Maps users to organizations with roles
4. **[`can_user_v2()`](../docs/database/RLS.md:808) function** - Primary permission check used by RLS policies
5. **RLS policies** - Enforce permissions at database level

### Role Hierarchy

| Role | Level | Capabilities |
|------|-------|--------------|
| `owner` | 100 | Full access, manage members, delete organization |
| `admin` | 75 | Manage data, assign roles (except owner) |
| `analyst` | 50 | Read all data, limited write access |
| `auditor` | 25 | Read-only access to all data |

### Permission Model

**Resource-Action Pattern:**
- Resource: Table name (e.g., `business_partners`, `acciones`, `oportunidades`)
- Action: CRUD operation (`select`, `insert`, `update`, `delete`)
- Allow: Boolean flag indicating permission granted

**Example Permission:**
```typescript
{
  role: 'admin',
  resource: 'business_partners',
  action: 'insert',
  allow: true
}
```

### Integration in Server Actions

All new server actions must integrate role-based authorization by:

1. **Explicit Permission Checks** (for RPC functions):
```typescript
// In RPC function
IF NOT can_user_v2('table_name', 'action', p_organizacion_id) THEN
  RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
END IF;
```

2. **RLS Policy Enforcement** (for direct database calls):
```typescript
// RLS policies automatically check permissions via can_user_v2()
// No additional checks needed in server actions
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  // RLS policy: USING (can_user_v2('table_name', 'select', organizacion_id))
```

3. **Admin-Only Operations**:
```typescript
// Check if user is admin or owner
const { data: memberData } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', auth.uid())
  .eq('organization_id', organizacion_id)
  .single()

if (!['owner', 'admin'].includes(memberData?.role)) {
  return {
    success: false,
    message: 'Acceso denegado: Se requieren privilegios de administrador'
  }
}
```

### Permission Validation Flow

```
User Action
    ↓
Server Action Called
    ↓
Supabase Client Request
    ↓
RLS Policy Evaluation
    ↓
can_user_v2() Function
    ↓
organization_members JOIN role_permissions
    ↓
Permission Check (role, resource, action)
    ↓
Access Granted/Denied
```

### Authorization Helper Function

Create a reusable authorization helper in [`lib/auth/permissions.ts`](../lib/auth/permissions.ts):

```typescript
import { createClient } from '@/lib/supabase/server'

/**
 * Check if current user has permission for a resource action
 *
 * @param resource - Table name (e.g., 'business_partners')
 * @param action - CRUD action (select, insert, update, delete)
 * @param organizacion_id - Organization ID
 * @returns Promise<boolean> - True if user has permission
 */
export async function checkPermission(
  resource: string,
  action: 'select' | 'insert' | 'update' | 'delete',
  organizacion_id: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('can_user_v2', {
    p_resource: resource,
    p_action: action,
    p_org: organizacion_id
  })

  if (error) {
    console.error('Error checking permission:', error)
    return false
  }

  return data || false
}

/**
 * Check if current user is admin or owner of organization
 *
 * @param organizacion_id - Organization ID
 * @returns Promise<boolean> - True if user is admin or owner
 */
export async function isAdmin(organizacion_id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('is_org_admin_v2', {
    p_org: organizacion_id
  })

  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }

  return data || false
}

/**
 * Check if current user is owner of organization
 *
 * @param organizacion_id - Organization ID
 * @returns Promise<boolean> - True if user is owner
 */
export async function isOwner(organizacion_id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('is_org_owner_v2', {
    p_org: organizacion_id
  })

  if (error) {
    console.error('Error checking owner status:', error)
    return false
  }

  return data || false
}

/**
 * Get current user's role in an organization
 *
 * @param organizacion_id - Organization ID
 * @returns Promise<string | null> - Role or null
 */
export async function getUserRole(organizacion_id: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizacion_id)
    .single()

  if (error) {
    console.error('Error getting user role:', error)
    return null
  }

  return data?.role || null
}
```

---

## Technical Approach for Supabase Calls

### Client Creation Pattern

All server actions use the [`createClient()`](../lib/supabase/server.ts) helper from [`@/lib/supabase/server`](../lib/supabase/server.ts):

```typescript
import { createClient } from '@/lib/supabase/server'

export async function myAction() {
  const supabase = await createClient()

  // Use supabase client for database operations
}
```

### Database Call Patterns

#### Pattern 1: RPC Functions (Complex Operations)

Use RPC functions for operations requiring business logic:

```typescript
const { data, error } = await supabase.rpc('function_name', {
  param1: value1,
  param2: value2
})
```

**When to use:**
- Multi-table operations (CTI pattern)
- Complex business logic
- Transactions requiring atomicity
- Permission validation required

**Examples:**
- `crear_persona` - Creates business_partners + personas atomically
- `crear_empresa` - Creates business_partners + empresas atomically
- `crear_relacion_bp` - Creates relationship with validation
- `transferir_accion` - Transfers ownership with side effects

#### Pattern 2: Direct Database Calls (Simple Operations)

Use direct calls for simple CRUD operations:

```typescript
// CREATE
const { data, error } = await supabase
  .from('table_name')
  .insert(data)
  .select()
  .single()

// READ
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .is('eliminado_en', null)

// UPDATE
const { error } = await supabase
  .from('table_name')
  .update(data)
  .eq('id', id)

// DELETE (soft delete)
const { error } = await supabase
  .from('table_name')
  .update({ eliminado_en: new Date().toISOString() })
  .eq('id', id)
```

**When to use:**
- Single table operations
- Simple field updates
- No complex business logic required
- RLS policies provide sufficient security

#### Pattern 3: Views (Read Operations)

Use pre-built views for optimized queries:

```typescript
const { data, error } = await supabase
  .from('v_personas_completa')
  .select('*')
  .is('bp_eliminado_en', null)
  .order('nombre_completo', { ascending: true })
```

**Available views:**
- `v_personas_completa` - Complete personas with business_partners data
- `v_empresas_completa` - Complete empresas with business_partners data
- `v_asignaciones_vigentes` - Current active assignments
- `v_asignaciones_historial` - Complete assignment history
- `v_acciones_asignadas` - Summary with dueño, titular, beneficiarios

### Error Handling Pattern

Consistent error handling across all server actions:

```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')

if (error) {
  console.error('Error description:', error)
  return {
    success: false,
    message: `User-friendly error message: ${error.message}`,
    error // Include error object for debugging
  }
}

return {
  success: true,
  message: 'Success message',
  data
}
```

### Response Type Definition

Standardize response types:

```typescript
// Success response
interface SuccessResponse<T = unknown> {
  success: true
  message: string
  data?: T
  [key: string]: unknown // For additional fields like id, codigo_bp, etc.
}

// Error response
interface ErrorResponse {
  success: false
  message: string
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

// Union type
type ActionResult<T = unknown> = SuccessResponse<T> | ErrorResponse
```

### Cache Revalidation

Always revalidate relevant paths after mutations:

```typescript
import { revalidatePath } from 'next/cache'

// After CREATE/UPDATE/DELETE
revalidatePath('/admin/path/to/list')
revalidatePath('/admin/path/to/detail/:id')
```

### Transaction Support

For operations requiring multiple steps:

```typescript
// Use RPC functions for transactions (atomic operations)
// RPC functions run in a single transaction

// For complex multi-step operations, use Supabase RPC with PL/pgSQL
// Example: Transfer action ownership
const { error } = await supabase.rpc('transferir_accion', {
  p_accion_id: accionId,
  p_nuevo_dueno_id: newOwnerId
})
// This RPC internally:
// 1. Finalizes current owner assignment
// 2. Finalizes all beneficiary assignments
// 3. Creates new owner assignment
// All in one transaction
```

---

## Error Handling and Security

### Error Handling Strategy

#### 1. Database Errors

Handle common Supabase/PostgreSQL error codes:

| Error Code | Description | Handling |
|------------|-------------|-----------|
| `42501` | Insufficient privilege | Return "Permission denied" message |
| `23505` | Unique constraint violation | Return "Duplicate entry" message |
| `23503` | Foreign key violation | Return "Referenced record not found" |
| `P0001` | Check constraint violation | Return validation error message |
| `22P02` | Not null violation | Return "Required field missing" message |

**Implementation:**
```typescript
if (error) {
  console.error('Error description:', error)
  
  let userMessage = 'Error de sistema'
  
  switch (error.code) {
    case '42501':
      userMessage = 'No tiene permisos para realizar esta acción'
      break
    case '23505':
      userMessage = 'Ya existe un registro con estos datos'
      break
    case '23503':
      userMessage = 'Registro referenciado no encontrado'
      break
    case 'P0001':
      userMessage = 'Error de validación: ' + error.message
      break
    default:
      userMessage = `Error: ${error.message}`
  }
  
  return {
    success: false,
    message: userMessage,
    error
  }
}
```

#### 2. Validation Errors

Validate input before database operations:

```typescript
// Example: Validate email format
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

if (email && !emailRegex.test(email)) {
  return {
    success: false,
    message: 'Formato de email inválido'
  }
}

// Example: Validate required fields
if (!data.nombre || !data.tipo_documento) {
  return {
    success: false,
    message: 'Los campos requeridos están faltantes'
  }
}
```

#### 3. Security Checks

Validate user permissions before operations:

```typescript
// Check if user belongs to organization
const { data: memberData } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', auth.uid())
  .eq('organization_id', organizacion_id)
  .single()

if (!memberData) {
  return {
    success: false,
    message: 'No es miembro de esta organización'
  }
}

// Check if user has required role
if (['owner', 'admin'].includes(memberData.role)) {
  return {
    success: false,
    message: 'Se requieren privilegios de administrador'
  }
}
```

### Security Measures

#### 1. RLS Enforcement

All database operations are protected by RLS policies:

```sql
-- Example RLS policy for business_partners
CREATE POLICY "bp_select"
  ON business_partners FOR SELECT
  USING (can_user_v2('business_partners', 'select', organizacion_id));
```

**Benefits:**
- Database-level security (cannot be bypassed)
- Automatic permission checks
- Multi-tenancy support

#### 2. Input Sanitization

Use parameterized queries to prevent SQL injection:

```typescript
// ✅ SAFE - Parameterized query
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id) // Parameterized

// ❌ UNSAFE - String interpolation (never do this)
const query = `SELECT * FROM table_name WHERE id = '${id}'`
```

#### 3. Audit Trail

All operations are logged via audit fields:

```typescript
// Automatic via triggers
creado_por: auth.uid() // Set on INSERT
actualizado_por: auth.uid() // Set on UPDATE
eliminado_por: auth.uid() // Set on soft delete
```

#### 4. Soft Delete Pattern

Never hard delete records:

```typescript
// ✅ SAFE - Soft delete
const { error } = await supabase
  .from('table_name')
  .update({ eliminado_en: new Date().toISOString() })
  .eq('id', id)

// ❌ UNSAFE - Hard delete (avoid unless necessary)
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id)
```

#### 5. Organization Isolation

Ensure data isolation between organizations:

```typescript
// Always filter by organization_id
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('organizacion_id', organizacion_id) // Organization filter
```

### Security Best Practices

1. **Always use RLS** - Never bypass RLS policies
2. **Validate inputs** - Check data types, formats, and required fields
3. **Use parameterized queries** - Prevent SQL injection
4. **Implement soft delete** - Preserve data for audit and recovery
5. **Check permissions** - Validate user role and permissions before operations
6. **Log errors** - Use console.error for debugging
7. **Return user-friendly messages** - Never expose internal error details to users
8. **Use transactions** - Ensure data consistency for multi-step operations
9. **Revalidate cache** - Keep UI in sync with database
10. **Test with different roles** - Verify permissions work correctly

---

## Documentation Updates

### Documentation Structure

Update the following documentation files to reflect new functions:

#### 1. Update [`docs/database/FUNCTIONS.md`](../docs/database/FUNCTIONS.md)

Add documentation for new RPC functions:

```markdown
## User-Facing RPC Functions

### Acciones Management

#### `crear_accion`

Create a new club share/action.

**Signature:**
```sql
CREATE FUNCTION crear_accion(
  p_organizacion_id UUID,
  p_codigo_accion TEXT,
  p_estado TEXT DEFAULT 'disponible'
) RETURNS acciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_organizacion_id` | UUID | ✅ | Organization ID (multi-tenancy) |
| `p_codigo_accion` | TEXT | ✅ | 4-digit action code |
| `p_estado` | TEXT | ❌ | Current status (default: disponible) |

**Returns:** Complete `acciones` record

**Business Rules:**
- Validates user has 'insert' permission for acciones
- Auto-sets `creado_por` to `auth.uid()`
- Enforces organization membership via RLS

**Errors:**
- `42501` - No permission to insert into organization
- `23505` - Duplicate codigo_accion
```

#### 2. Update [`docs/api/README.md`](../docs/api/README.md)

Add new API endpoints:

```markdown
## API Reference

### Acciones Management

| Function | Operation | File | Status |
|----------|-----------|-------|--------|
| `crearAccion()` | CREATE | [`app/actions/acciones.ts`](../app/actions/acciones.ts) | ✅ Implemented |
| `actualizarAccion()` | UPDATE | [`app/actions/acciones.ts`](../app/actions/acciones.ts) | ✅ Implemented |
| `softDeleteAccion()` | DELETE | [`app/actions/acciones.ts`](../app/actions/acciones.ts) | ✅ Implemented |
| `listAcciones()` | READ | [`app/actions/acciones.ts`](../app/actions/acciones.ts) | ✅ Implemented |

### Relationships Management

| Function | Operation | File | Status |
|----------|-----------|-------|--------|
| `crearRelacionFromForm()` | CREATE | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | ✅ Implemented |
| `actualizarRelacion()` | UPDATE | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | ✅ Implemented |
| `finalizarRelacion()` | UPDATE | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | ✅ Implemented |
| `eliminarRelacion()` | DELETE | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | ✅ Implemented |
| `obtenerRelaciones()` | READ | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | ✅ Implemented |
```

#### 3. Create New API Documentation Files

Create detailed API docs for new modules:

- [`docs/api/RELACIONES.md`](../docs/api/RELACIONES.md) - Relationship management API
- [`docs/api/ACCIONES.md`](../docs/api/ACCIONES.md) - Club shares management API
- [`docs/api/OPORTUNIDADES.md`](../docs/api/OPORTUNIDADES.md) - Opportunities management API
- [`docs/api/TAREAS.md`](../docs/api/TAREAS.md) - Tasks management API
- [`docs/api/ORGANIZATIONS.md`](../docs/api/ORGANIZATIONS.md) - Organization management API
- [`docs/api/MEMBERS.md`](../docs/api/MEMBERS.md) - Organization members API
- [`docs/api/ROLES.md`](../docs/api/ROLES.md) - Role management API
- [`docs/api/PERMISSIONS.md`](../docs/api/PERMISSIONS.md) - Permission management API

#### 4. Update [`docs/DATABASE_FUNCTIONS_AUDIT_REPORT.md`](../docs/DATABASE_FUNCTIONS_AUDIT_REPORT.md)

Re-run audit and update report:

```markdown
## CRUD Coverage Summary

### By Table

| Table | CREATE | READ | UPDATE | DELETE | Coverage | Status |
|-------|--------|-------|--------|--------|-----------|--------|
| **organizations** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **business_partners** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **personas** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **empresas** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **bp_relaciones** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **acciones** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **asignaciones_acciones** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **geographic_locations** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **organization_members** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **roles** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **role_permissions** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **oportunidades** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |
| **tareas** | ✅ | ✅ | ✅ | ✅ | 100% | ✅ Complete |

**Total Coverage:** 100% (13/13 tables with full CRUD)
```

#### 5. Update [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)

Add section on CRUD operations:

```markdown
## CRUD Operations

### Server Actions Architecture

All CRUD operations are implemented as server actions in the [`app/actions/`](../app/actions/) directory:

```
app/actions/
├── personas.ts              # Personas CRUD operations
├── empresas.ts              # Empresas CRUD operations
├── relaciones.ts           # Relationships CRUD operations
├── acciones.ts             # Club shares CRUD operations
├── oportunidades.ts         # Opportunities CRUD operations
├── tareas.ts              # Tasks CRUD operations
└── admin/
    ├── organizations.ts     # Organization CRUD operations
    ├── members.ts          # Organization members CRUD operations
    ├── roles.ts           # Role CRUD operations
    └── permissions.ts     # Permission CRUD operations
```

### Operation Patterns

1. **CREATE Operations**
   - Use RPC functions for complex operations (CTI pattern)
   - Use direct `.insert()` for simple operations
   - Validate permissions via RLS policies
   - Revalidate cache after creation

2. **READ Operations**
   - Use pre-built views for optimized queries
   - Filter by organization_id for multi-tenancy
   - Filter soft-deleted records (`eliminado_en IS NULL`)

3. **UPDATE Operations**
   - Use RPC functions for complex updates
   - Use direct `.update()` for simple field updates
   - Validate permissions via RLS policies
   - Revalidate cache after update

4. **DELETE Operations**
   - Implement soft delete pattern (set `eliminado_en`)
   - Never hard delete unless explicitly required
   - Validate permissions via RLS policies
   - Revalidate cache after deletion
```

#### 6. Update [`docs/SECURITY.md`](../docs/SECURITY.md)

Add section on authorization:

```markdown
## Role-Based Access Control (RBAC)

### Authorization Architecture

The SOCIOS_ADMIN project implements a comprehensive RBAC system:

1. **Roles** - Define access levels (owner, admin, analyst, auditor)
2. **Permissions** - Map roles to resource + action combinations
3. **Organization Members** - Map users to organizations with roles
4. **RLS Policies** - Enforce permissions at database level
5. **Permission Functions** - Helper functions for permission checks

### Permission Checking

All server actions validate permissions through:

1. **RLS Policies** - Automatic enforcement at database level
2. **Explicit Checks** - Manual validation in RPC functions
3. **Role Validation** - Check user role for admin-only operations

### Permission Helpers

Use the authorization helper functions in [`lib/auth/permissions.ts`](../lib/auth/permissions.ts):

```typescript
import { checkPermission, isAdmin, isOwner, getUserRole } from '@/lib/auth/permissions'

// Check specific permission
const canInsert = await checkPermission('business_partners', 'insert', orgId)

// Check admin status
const isAdminUser = await isAdmin(orgId)

// Check owner status
const isOwnerUser = await isOwner(orgId)

// Get user role
const role = await getUserRole(orgId)
```
```

---

## Testing Strategy

### Unit Tests

Create unit tests for each server action:

```typescript
// Example test file: __tests__/actions/personas.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { crearPersonaFromForm, softDeletePersona } from '@/app/actions/personas'

describe('personas actions', () => {
  beforeEach(() => {
    // Setup test database
  })

  it('should create a persona successfully', async () => {
    const result = await crearPersonaFromForm({
      organizacionId: 'test-org-id',
      primerNombre: 'Juan',
      primerApellido: 'Pérez',
      tipoDocumento: 'CC',
      numeroDocumento: '12345678',
      genero: 'masculino',
      fechaNacimiento: '1990-01-01'
    })

    expect(result.success).toBe(true)
    expect(result.bp_id).toBeDefined()
    expect(result.codigo_bp).toBeDefined()
  })

  it('should soft delete a persona', async () => {
    const result = await softDeletePersona('test-persona-id')

    expect(result.success).toBe(true)
    expect(result.message).toBe('Persona eliminada correctamente')
  })

  it('should return error for invalid data', async () => {
    const result = await crearPersonaFromForm({
      organizacionId: 'test-org-id',
      primerNombre: '', // Invalid: empty
      primerApellido: 'Pérez',
      tipoDocumento: 'CC',
      numeroDocumento: '12345678',
      genero: 'masculino',
      fechaNacimiento: '1990-01-01'
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('error')
  })
})
```

### Integration Tests

Test RPC functions with database:

```sql
-- Test RPC function
SELECT crear_persona(
  'test-org-id',
  'Juan',
  'Pérez',
  'juan@example.com',
  '1234567890',
  'CC',
  '12345678',
  'masculino'::text,
  '1990-01-01'::date
);

-- Verify result
SELECT * FROM personas WHERE id = (result_id);
SELECT * FROM business_partners WHERE id = (result_id);
```

### Permission Tests

Test RLS policies with different roles:

```typescript
// Test with owner role
await testAsUser('owner-user-id', async () => {
  const result = await createOrganization({ nombre: 'Test Org', slug: 'test-org' })
  expect(result.success).toBe(true)
})

// Test with analyst role
await testAsUser('analyst-user-id', async () => {
  const result = await createOrganization({ nombre: 'Test Org', slug: 'test-org' })
  expect(result.success).toBe(false) // Analyst cannot create organizations
})
```

### E2E Tests

Test complete user workflows:

```typescript
// Example: Create and manage a persona
test('complete persona workflow', async ({ page }) => {
  // Navigate to personas page
  await page.goto('/admin/socios/personas')
  
  // Click "New Person" button
  await page.click('[data-testid="new-person-button"]')
  
  // Fill form
  await page.fill('[name="primer_nombre"]', 'Juan')
  await page.fill('[name="primer_apellido"]', 'Pérez')
  await page.fill('[name="tipo_documento"]', 'CC')
  await page.fill('[name="numero_documento"]', '12345678')
  
  // Submit form
  await page.click('[data-testid="submit-button"]')
  
  // Verify persona created
  await expect(page.locator('text=Juan Pérez')).toBeVisible()
})
```

---

## Success Metrics

### Completion Goals

| Metric | Target | Current | Status |
|---------|---------|---------|--------|
| **Tables with Full CRUD** | 13/13 (100%) | 2/13 (15.4%) | ❌ In Progress |
| **CREATE Functions** | 13/13 (100%) | 4/13 (30.8%) | ❌ In Progress |
| **READ Functions** | 13/13 (100%) | 4/13 (30.8%) | ❌ In Progress |
| **UPDATE Functions** | 13/13 (100%) | 2/13 (15.4%) | ❌ In Progress |
| **DELETE Functions** | 13/13 (100%) | 0/13 (0%) | ❌ In Progress |
| **Soft Delete Coverage** | 13/13 (100%) | 0/13 (0%) | ❌ In Progress |
| **RPC Functions Exposed** | 11/11 (100%) | 3/11 (27.3%) | ❌ In Progress |
| **Documentation Updated** | 100% | Partial | ❌ In Progress |
| **Test Coverage** | 80%+ | 0% | ❌ In Progress |

### Phase Completion Criteria

**Phase 1 (Week 1-2):**
- ✅ Soft delete functions for all 13 tables
- ✅ Relationship management functions (5 functions)
- ✅ Acciones management functions (8 functions)

**Phase 2 (Week 3-4):**
- ✅ Opportunities management functions (4 functions)
- ✅ Tasks management functions (4 functions)

**Phase 3 (Week 5-6):**
- ✅ Organizations management functions (4 functions)
- ✅ Organization members functions (4 functions)
- ✅ Roles management functions (4 functions)
- ✅ Permissions management functions (4 functions)

**Phase 4 (Week 7-8):**
- ✅ Geographic locations functions (3 functions)
- ✅ All documentation updated
- ✅ Test coverage achieved
- ✅ Code review completed

### Final Success Criteria

Upon completion, the SOCIOS_ADMIN project will have:

1. **100% CRUD Coverage** - All 13 tables with complete CRUD operations
2. **47 New Functions** - All missing functions implemented
3. **Role-Based Authorization** - All functions integrate with RBAC
4. **Consistent Error Handling** - Standardized error responses
5. **Comprehensive Documentation** - All functions documented
6. **Test Coverage** - Unit, integration, and E2E tests
7. **Security Compliance** - All functions respect RLS policies
8. **Code Quality** - Follows existing patterns and conventions

---

## Appendix

### A. File Structure

```
app/actions/
├── personas.ts              # ✅ EXISTS - Add soft delete
├── empresas.ts              # ✅ EXISTS - Add update & soft delete
├── relaciones.ts           # ❌ NEW - Relationship management
├── acciones.ts             # ❌ NEW - Club shares management
├── oportunidades.ts         # ❌ NEW - Opportunities management
├── tareas.ts              # ❌ NEW - Tasks management
└── admin/
    ├── organizations.ts     # ❌ NEW - Organization CRUD
    ├── members.ts          # ❌ NEW - Organization members
    ├── roles.ts           # ❌ NEW - Role management
    └── permissions.ts     # ❌ NEW - Permission management

lib/auth/
└── permissions.ts          # ❌ NEW - Authorization helpers

docs/api/
├── RELACIONES.md          # ❌ NEW - Relationships API docs
├── ACCIONES.md            # ❌ NEW - Club shares API docs
├── OPORTUNIDADES.md       # ❌ NEW - Opportunities API docs
├── TAREAS.md              # ❌ NEW - Tasks API docs
├── ORGANIZATIONS.md       # ❌ NEW - Organizations API docs
├── MEMBERS.md             # ❌ NEW - Members API docs
├── ROLES.md              # ❌ NEW - Roles API docs
└── PERMISSIONS.md         # ❌ NEW - Permissions API docs
```

### B. Function Catalog

**Total Missing Functions: 47**

| Category | Count | Functions |
|----------|--------|-----------|
| **Soft Delete** | 13 | softDeletePersona, softDeleteEmpresa, softDeleteAccion, softDeleteOportunidad, softDeleteTarea, softDeleteOrganization, softDeleteLocation, softDeleteRelacion, softDeleteAsignacion, softDeleteMember, softDeleteBusinessPartner, softDeleteRole, softDeletePermission |
| **Business Partners** | 3 | actualizarEmpresa, actualizarBusinessPartner, softDeleteBusinessPartner |
| **Relationships** | 5 | crearRelacionFromForm, actualizarRelacion, finalizarRelacion, eliminarRelacion, obtenerRelaciones |
| **Acciones** | 8 | crearAccion, actualizarAccion, softDeleteAccion, listAcciones, crearAsignacion, transferirAccion, finalizarAsignacion, listAsignaciones, softDeleteAsignacion |
| **Organizations** | 4 | createOrganization, updateOrganization, softDeleteOrganization, listOrganizations |
| **Members** | 4 | addMember, updateMemberRole, removeMember, listMembers |
| **Roles** | 4 | createRole, updateRole, deleteRole, listRoles |
| **Permissions** | 3 | grantPermission, revokePermission, listPermissions |
| **Opportunities** | 4 | crearOportunidad, actualizarOportunidad, softDeleteOportunidad, listOportunidades |
| **Tasks** | 4 | crearTarea, actualizarTarea, softDeleteTarea, listTareas |
| **Locations** | 3 | createLocation, updateLocation, searchLocations |

### C. References

- [`DATABASE_FUNCTIONS_AUDIT_REPORT.md`](./DATABASE_FUNCTIONS_AUDIT_REPORT.md) - Audit report identifying gaps
- [`docs/database/SCHEMA.md`](./database/SCHEMA.md) - Complete schema documentation
- [`docs/database/TABLES.md`](./database/TABLES.md) - Data dictionary
- [`docs/database/FUNCTIONS.md`](./database/FUNCTIONS.md) - RPC function reference
- [`docs/database/RLS.md`](./database/RLS.md) - Row Level Security policies
- [`app/actions/personas.ts`](../app/actions/personas.ts) - Existing personas actions
- [`app/actions/empresas.ts`](../app/actions/empresas.ts) - Existing empresas actions
- [`lib/supabase/server.ts`](../lib/supabase/server.ts) - Supabase client helper

---

**Document Version:** 1.0
**Created:** 2026-01-03
**Last Updated:** 2026-01-03
**Status:** Ready for Implementation
