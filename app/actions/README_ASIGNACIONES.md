# Integración de Funciones RPC para vn_asociados

## Resumen de Implementación

### 1. Funciones RPC Creadas en PostgreSQL

#### `vn_asociados_crear_asignacion`
- **Retorna**: JSONB del registro creado (sin wrapper `{success}`)
- **Manejo de errores**: `RAISE EXCEPTION` nativo → HTTP 400/500
- **Validaciones implementadas**:
  - ✅ Autenticación (`auth.uid()`)
  - ✅ Permisos (`can_user_v2`)
  - ✅ Estado de acción (rechaza 'bloqueada'/'inactiva')
  - ✅ Unicidad para 'propietario'/'titular'
  - ✅ Jerarquía estricta: beneficiario requiere padre de la MISMA acción
  - ✅ Generación de subcódigo con `FOR UPDATE` (prevención de race conditions)

#### `vn_asociados_finalizar_asignacion`
- **Retorna**: JSONB del registro actualizado
- **Manejo de errores**: `RAISE EXCEPTION` nativo
- **Validaciones**: Autenticación, permisos, existencia, no finalizada previamente

---

### 2. Archivos Creados

#### `/app/actions/asignaciones.ts`
**Server Actions** con tipado TypeScript estricto:

```typescript
// Tipos de entrada (camelCase)
export interface CrearAsignacionParams {
  accionId: string
  asociadoId: string
  organizacionId: string
  tipoVinculo: 'propietario' | 'titular' | 'beneficiario' | 'intermediario'
  modalidad: 'propiedad' | 'comodato' | 'asignacion_corp' | 'convenio'
  planComercial: 'regular' | 'plan dorado' | 'joven ejecutivo' | 'honorifico'
  asignacionPadreId?: string | null
  notas?: string | null
  atributos?: Record<string, any> | null
}

// Función principal
export async function crearAsignacion(params: CrearAsignacionParams): Promise<AsignacionRecord>
export async function finalizarAsignacion(params: FinalizarAsignacionParams): Promise<AsignacionRecord>
export async function crearAsignacionesBatch(asignaciones: CrearAsignacionParams[]): Promise<AsignacionRecord[]>
```

**Características**:
- Mapeo automático de camelCase → snake_case para los parámetros de la RPC
- Manejo de errores con `try/catch` y re-lanzado para captura en UI
- Logging detallado para debugging
- Revalidación de caché con `revalidatePath`
- Función batch para crear múltiples asignaciones

#### `/app/actions/asignaciones.example.tsx`
Ejemplos de uso en componentes React:
- Formulario para crear asignación
- Botón para finalizar asignación
- Batch de beneficiarios
- Manejo de errores con mensajes personalizados

---

### 3. Flujo de Datos

```
┌─────────────────┐
│  Componente    │
│  React (UI)     │
└────────┬────────┘
         │ llama con params camelCase
         ▼
┌─────────────────────────────────┐
│  Server Action                  │
│  /app/actions/asignaciones.ts   │
│  - Mapea a snake_case            │
│  - Llama supabase.rpc()         │
│  - Maneja errores               │
└────────┬────────────────────────┘
         │ RPC call
         ▼
┌─────────────────────────────────┐
│  Supabase PostgreSQL            │
│  - vn_asociados_crear_asignacion│
│  - vn_asociados_finalizar_...   │
│  - RAISE EXCEPTION si error     │
└────────┬────────────────────────┘
         │ JSONB o HTTP error
         ▼
┌─────────────────────────────────┐
│  Cliente Supabase               │
│  - data (JSONB)                 │
│  - error (Error object)         │
└─────────────────────────────────┘
```

---

### 4. Manejo de Errores

#### En PostgreSQL (RPC)
```sql
RAISE EXCEPTION 'La acción está en estado "bloqueada"'
USING ERRCODE = '23514';
```

#### En Server Action
```typescript
try {
  const { data, error } = await supabase.rpc('vn_asociados_crear_asignacion', params)
  if (error) throw new Error(error.message)
  return data
} catch (err) {
  throw err // Re-lanzar para que la UI lo capture
}
```

#### En Componente React
```typescript
try {
  const asignacion = await crearAsignacion(params)
  // Éxito
} catch (err) {
  const msg = err instanceof Error ? err.message : 'Error desconocido'
  setError(msg) // Mostrar al usuario
}
```

---

### 5. Uso en Componentes

#### Crear una asignación
```typescript
import { crearAsignacion } from '@/app/actions/asignaciones'

const asignacion = await crearAsignacion({
  accionId: 'uuid-accion',
  asociadoId: 'uuid-asociado',
  organizacionId: 'uuid-org',
  tipoVinculo: 'propietario',
  modalidad: 'propiedad',
  planComercial: 'regular'
})
```

#### Finalizar una asignación
```typescript
import { finalizarAsignacion } from '@/app/actions/asignaciones'

await finalizarAsignacion({
  asignacionId: 'uuid-asignacion',
  motivo: 'Venta completada' // opcional
})
```

---

### 6. Validaciones de Negocio Implementadas

| Validación | Mensaje de Error (ejemplo) |
|-----------|---------------------------|
| No autenticado | `Usuario no autenticado` |
| Sin permisos | `No tienes permisos para crear asignaciones...` |
| Acción bloqueada/inactiva | `La acción está en estado "bloqueada"...` |
| Estado incorrecto | `Para crear un propietario la acción debe estar en estado "disponible"...` |
| Duplicado propietario/titular | `Ya existe un propietario vigente para esta acción...` |
| Padre requerido | `Para tipo_vinculo = beneficiario, debe proporcionar...` |
| Padre inválido | `La asignación padre no existe o no está vigente` |
| Padres de diferentes acciones | `La asignación padre pertenece a una acción diferente...` |
| Asignación ya finalizada | `La asignación ya está finalizada...` |

---

### 7. Próximos Pasos Recomendados

1. ✅ **Completado**: Crear funciones RPC en PostgreSQL
2. ✅ **Completado**: Crear Server Actions con tipado TypeScript
3. ⏳ **Pendiente**: Crear componentes UI (formularios, botones)
4. ⏳ **Pendiente**: Actualizar documentación (`docs/database/FUNCTIONS.md`)
5. ⏳ **Pendiente**: Generar tipos TypeScript (`types_db.ts`)
6. ⏳ **Pendiente**: Testing con diferentes escenarios

---

### 8. Testing Manual

```typescript
// Test 1: Crear propietario
await crearAsignacion({
  accionId: 'accion-disponible',
  tipoVinculo: 'propietario',
  // ...
})
// ✅ Debe crear con subcodigo '00'

// Test 2: Duplicado propietario
await crearAsignacion({
  accionId: 'accion-con-propietario',
  tipoVinculo: 'propietario',
  // ...
})
// ❌ Debe lanzar: "Ya existe un propietario vigente..."

// Test 3: Crear beneficiario sin padre
await crearAsignacion({
  tipoVinculo: 'beneficiario',
  asignacionPadreId: null,
  // ...
})
// ❌ Debe lanzar: "debe proporcionar una asignación padre..."

// Test 4: Jerarquía incorrecta
await crearAsignacion({
  tipoVinculo: 'beneficiario',
  asignacionPadreId: 'padre-de-otra-accion',
  // ...
})
// ❌ Debe lanzar: "pertenece a una acción diferente..."

// Test 5: Finalizar asignación
await finalizarAsignacion({
  asignacionId: 'asignacion-vigente',
  motivo: 'Prueba'
})
// ✅ Debe establecer fecha_fin y agregar motivo a notas
```

---

## Archivos de Referencia

- **RPC Functions**: PostgreSQL database (ejecutado vía Supabase MCP)
- **Server Actions**: `/app/actions/asignaciones.ts`
- **Ejemplos**: `/app/actions/asignaciones.example.tsx`
- **Documentación**: `/docs/database/FUNCTIONS.md` (pendiente actualización)
- **Tipos**: `/types_db.ts` (pendiente regeneración)
