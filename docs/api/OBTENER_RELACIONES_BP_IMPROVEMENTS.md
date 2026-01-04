# obtener_relaciones_bp Function Improvements

> **Documentation of improvements made to the obtener_relaciones_bp RPC function**
>
> Last updated: 2026-01-04

---

## Overview

The [`obtener_relaciones_bp`](../database/FUNCTIONS.md#obtener_relaciones_bp) function has been significantly enhanced to provide complete relationship and partner information in a single query, eliminating the need for additional database calls.

---

## Key Improvements

### 1. Complete Partner Information

**Before:**
- Returned only basic relationship fields
- Required separate queries to fetch partner details
- Limited to relationship metadata only

**After:**
- Returns complete information for both origin and destination partners
- Includes full names, identification, contact info, and profile data
- Single query returns all necessary data

**New Fields Returned:**

#### Origin Partner Fields:
- `origen_id` - Partner UUID
- `origen_codigo_bp` - Business partner code
- `origen_tipo_actor` - Actor type (persona/empresa)
- `origen_primer_nombre` - First name
- `origen_segundo_nombre` - Second name
- `origen_primer_apellido` - First last name
- `origen_segundo_apellido` - Second last name
- `origen_nombre_completo` - Full name (computed)
- `origen_tipo_documento` - Document type
- `origen_numero_documento` - Document number
- `origen_identificacion` - Full identification (type + number)
- `origen_fecha_nacimiento` - Birth date
- `origen_foto_url` - Profile photo URL
- `origen_whatsapp` - WhatsApp number

#### Destination Partner Fields:
- `destino_id` - Partner UUID
- `destino_codigo_bp` - Business partner code
- `destino_tipo_actor` - Actor type (persona/empresa)
- `destino_primer_nombre` - First name
- `destino_segundo_nombre` - Second name
- `destino_primer_apellido` - First last name
- `destino_segundo_apellido` - Second last name
- `destino_nombre_completo` - Full name (computed)
- `destino_tipo_documento` - Document type
- `destino_numero_documento` - Document number
- `destino_identificacion` - Full identification (type + number)
- `destino_fecha_nacimiento` - Birth date
- `destino_foto_url` - Profile photo URL
- `destino_whatsapp` - WhatsApp number

### 2. Enhanced Parameters

**New Parameter:**
- `p_tipo_relacion` (TEXT, optional) - Filter by specific relationship type

**Updated Parameter Names:**
- `bp_id` → `p_bp_id` (consistent naming convention)
- `solo_vigentes` → `p_solo_actuales` (Spanish parameter name)

**Parameter Table:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_bp_id` | UUID | ✅ | Business partner ID to query relationships for |
| `p_solo_actuales` | BOOLEAN | ❌ | Only return current/active relationships (default: true) |
| `p_tipo_relacion` | TEXT | ❌ | Filter by specific relationship type (e.g., 'familiar', 'laboral') |

### 3. Richer Relationship Metadata

**Additional Fields Returned:**
- `rol_origen` - Role of origin partner in the relationship
- `rol_destino` - Role of destination partner in the relationship
- `es_bidireccional` - Whether relationship is bidirectional
- `fecha_inicio` - Relationship start date
- `fecha_fin` - Relationship end date (null if current)
- `es_actual` - Whether relationship is currently active
- `atributos` - JSONB metadata for custom attributes
- `notas` - Relationship notes
- `creado_en` - Creation timestamp
- `actualizado_en` - Last update timestamp

### 4. Improved Performance

**Query Optimization:**
- Single JOIN operation fetches all data
- Eliminates N+1 query problem
- Reduces database round trips from N+1 to 1
- Orders results by `fecha_inicio DESC`, then `creado_en DESC`

**Performance Impact:**
- **Before:** 1 query for relationships + N queries for partner details
- **After:** 1 query for everything
- **Improvement:** ~90% reduction in database queries

---

## Usage Examples

### Get All Current Relationships

```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: true
})
```

### Get All Relationships Including Historical

```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: false
})
```

### Filter by Relationship Type

```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: true,
  p_tipo_relacion: 'familiar'
})
```

### Get Work Relationships (Including Inactive)

```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: false,
  p_tipo_relacion: 'laboral'
})
```

---

## Integration with Existing Code

### Server Action Wrapper

The [`obtenerRelaciones`](../api/RELACIONES.md#obtenerrelaciones) server action in [`app/actions/relaciones.ts`](../../app/actions/relaciones.ts) has been updated to use the enhanced function:

```typescript
export async function obtenerRelaciones(
  bp_id: string,
  solo_vigentes: boolean = true,
  tipo_relacion?: string  // NEW parameter
) {
  const supabase = await createClient()

  const { data: relaciones, error: rpcError } = await supabase.rpc('obtener_relaciones_bp', {
    p_bp_id: bp_id,
    p_solo_actuales: solo_vigentes,
    p_tipo_relacion: tipo_relacion || null  // NEW parameter
  })

  // Transform RPC result to match component expectations
  const enrichedData = relaciones.map((rel: any) => ({
    id: rel.id,
    bp_origen_id: rel.bp_origen_id,
    bp_destino_id: rel.bp_destino_id,
    tipo_relacion: rel.tipo_relacion,
    rol_origen: rel.rol_origen,
    rol_destino: rel.rol_destino,
    es_bidireccional: rel.es_bidireccional,
    fecha_inicio: rel.fecha_inicio,
    fecha_fin: rel.fecha_fin,
    es_actual: rel.es_actual,
    atributos: rel.atributos || {},
    notas: rel.notas,
    creado_en: rel.creado_en,
    actualizado_en: rel.actualizado_en,
    // Complete partner data
    origen_nombre_completo: rel.origen_nombre_completo || '',
    destino_nombre_completo: rel.destino_nombre_completo || '',
    // ... all other partner fields
  }))

  return {
    success: true,
    data: enrichedData
  }
}
```

### TypeScript Types

The [`types_db.ts`](../../types_db.ts) file has been updated with the complete return type:

```typescript
obtener_relaciones_bp: {
  Args: {
    p_bp_id: string
    p_solo_actuales?: boolean
    p_tipo_relacion?: string
  }
  Returns: {
    // Relationship fields
    id: string
    bp_origen_id: string
    bp_destino_id: string
    tipo_relacion: string
    rol_origen: string
    rol_destino: string
    es_bidireccional: boolean
    fecha_inicio: string
    fecha_fin: string | null
    es_actual: boolean
    atributos: Json
    notas: string | null
    creado_en: string
    actualizado_en: string
    
    // Origin partner fields
    origen_id: string
    origen_codigo_bp: string | null
    origen_tipo_actor: string | null
    origen_primer_nombre: string | null
    origen_segundo_nombre: string | null
    origen_primer_apellido: string | null
    origen_segundo_apellido: string | null
    origen_nombre_completo: string | null
    origen_tipo_documento: string | null
    origen_numero_documento: string | null
    origen_identificacion: string | null
    origen_fecha_nacimiento: string | null
    origen_foto_url: string | null
    origen_whatsapp: string | null
    
    // Destination partner fields
    destino_id: string
    destino_codigo_bp: string | null
    destino_tipo_actor: string | null
    destino_primer_nombre: string | null
    destino_segundo_nombre: string | null
    destino_primer_apellido: string | null
    destino_segundo_apellido: string | null
    destino_nombre_completo: string | null
    destino_tipo_documento: string | null
    destino_numero_documento: string | null
    destino_identificacion: string | null
    destino_fecha_nacimiento: string | null
    destino_foto_url: string | null
    destino_whatsapp: string | null
  }[]
}
```

---

## Migration Guide

### For Existing Code

**Before:**
```typescript
const { data } = await supabase.rpc('obtener_relaciones_bp', {
  bp_id: partnerId,
  solo_vigentes: true
})

// Had to fetch partner details separately
const partnerIds = data.map(r => r.bp_destino_id)
const partners = await supabase
  .from('personas')
  .select('*')
  .in('id', partnerIds)
```

**After:**
```typescript
const { data } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: partnerId,
  p_solo_actuales: true
})

// Partner details already included in response
data.forEach(rel => {
  console.log(rel.destino_nombre_completo)  // Full name available
  console.log(rel.destino_identificacion)    // Identification available
})
```

### Breaking Changes

**Parameter Name Changes:**
- `bp_id` → `p_bp_id`
- `solo_vigentes` → `p_solo_actuales`

**Return Type Changes:**
- Returns a TABLE instead of SETOF bp_relaciones
- Includes many additional fields for partner information

**Compatibility:**
- The server action wrapper [`obtenerRelaciones`](../api/RELACIONES.md#obtenerrelaciones) maintains backward compatibility
- Components using the server action don't need changes
- Direct RPC calls need parameter name updates

---

## Benefits

### Performance
- ✅ **90% reduction** in database queries
- ✅ Eliminates N+1 query problem
- ✅ Faster page load times
- ✅ Reduced database load

### Developer Experience
- ✅ Single API call for complete data
- ✅ No need to manually join partner data
- ✅ Type-safe TypeScript definitions
- ✅ Consistent parameter naming

### Functionality
- ✅ Filter by relationship type
- ✅ Complete partner profiles
- ✅ Rich relationship metadata
- ✅ Bidirectional context

---

## Related Documentation

- **[BP_RELACIONES.md](./BP_RELACIONES.md)** - Complete API reference
- **[RELACIONES.md](./RELACIONES.md)** - Server action documentation
- **[../database/FUNCTIONS.md](../database/FUNCTIONS.md)** - Database function reference
- **[../database/TABLES.md](../database/TABLES.md)** - Table schemas

---

**Last Updated:** 2026-01-04
