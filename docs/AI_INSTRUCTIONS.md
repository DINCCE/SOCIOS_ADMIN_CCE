# AI Instructions - Creating Business Partners via Supabase RPC

**Audience:** AI coding assistants (Claude, GPT-4, Copilot, etc.)

**Purpose:** This document provides step-by-step instructions for AI assistants to correctly create personas and empresas in the database using the Supabase RPC API.

---

## Important Context

This system uses **Class Table Inheritance (CTI)** pattern:
- Base table: `business_partners` (contains common fields)
- Specialization tables: `personas` (natural persons) and `empresas` (companies)
- Both specialization tables share the same UUID as their parent `business_partner`

**DO NOT** manually insert into both tables separately. Use the RPC functions `crear_persona` and `crear_empresa` which handle the CTI pattern atomically.

---

## Creating a Persona (Natural Person)

### Step 1: Gather Required Information

You MUST have these fields:
- `organizacion_id` (UUID) - The organization this persona belongs to
- `codigo_bp` (TEXT) - Internal code (e.g., "BP-2024-001")
- `primer_nombre` (TEXT) - First name
- `primer_apellido` (TEXT) - First last name
- `tipo_documento` (TEXT) - Document type (see valid values below)
- `numero_documento` (TEXT) - Document number

### Step 2: Validate Document Type

The `tipo_documento` MUST be one of these exact values:
- `cedula_ciudadania` (Colombian citizenship card)
- `cedula_extranjeria` (Foreign ID card)
- `pasaporte` (Passport)
- `tarjeta_identidad` (Identity card)
- `registro_civil` (Birth certificate)
- `nit` (Tax ID number)
- `nit_extranjero` (Foreign tax ID)
- `carnet_diplomatico` (Diplomatic ID)
- `pep` (Special permanent permit)
- `permiso_especial_permanencia` (Special stay permit)

**If the user provides a document type not in this list, ask them to clarify or default to the closest match.**

### Step 3: Call the RPC Function

Use this pattern in Server Actions:

```typescript
// app/actions/personas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearPersona(data: {
  organizacionId: string
  codigoBp: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  tipoDocumento: string
  numeroDocumento: string
  email?: string
  telefono?: string
  celular?: string
  fechaNacimiento?: string
  // ... other optional fields
}) {
  const supabase = await createClient()

  // Transform camelCase to snake_case for RPC params
  const { data: personaId, error } = await supabase.rpc('crear_persona', {
    p_organizacion_id: data.organizacionId,
    p_codigo_bp: data.codigoBp,
    p_primer_nombre: data.primerNombre,
    p_segundo_nombre: data.segundoNombre,
    p_primer_apellido: data.primerApellido,
    p_segundo_apellido: data.segundoApellido,
    p_tipo_documento: data.tipoDocumento,
    p_numero_documento: data.numeroDocumento,
    p_email: data.email,
    p_telefono: data.telefono,
    p_celular: data.celular,
    p_fecha_nacimiento: data.fechaNacimiento,
  })

  if (error) {
    console.error('Error creating persona:', error)
    return { error: error.message }
  }

  revalidatePath('/personas')
  return { data: personaId }
}
```

### Step 4: Handle Response

```typescript
const result = await crearPersona({
  organizacionId: 'uuid-here',
  codigoBp: 'BP-2024-001',
  primerNombre: 'Juan',
  primerApellido: 'Pérez',
  tipoDocumento: 'cedula_ciudadania',
  numeroDocumento: '1234567890'
})

if (result.error) {
  // Handle error - show to user via toast
  toast.error('Error al crear persona', { description: result.error })
} else {
  // Success - result.data contains the UUID
  toast.success('Persona creada exitosamente')
  router.push(`/personas/${result.data}`)
}
```

---

## Creating an Empresa (Company)

### Step 1: Gather Required Information

You MUST have these fields:
- `organizacion_id` (UUID) - The organization this empresa belongs to
- `codigo_bp` (TEXT) - Internal code (e.g., "BP-2024-002")
- `razon_social` (TEXT) - Legal company name
- `tipo_sociedad` (TEXT) - Company type (see valid values below)
- `nit` (TEXT) - Colombian tax ID number

### Step 2: Validate Company Type

The `tipo_sociedad` MUST be one of these exact values:
- `sociedad_anonima` (S.A.)
- `sociedad_limitada` (Ltda.)
- `sociedad_comandita_simple`
- `sociedad_comandita_acciones`
- `sociedad_colectiva`
- `sociedad_acciones_simplificada` (S.A.S.) ← Most common
- `empresa_unipersonal`
- `empresa_asociativa_trabajo`
- `entidad_sin_animo_lucro`
- `cooperativa`

**If the user provides a company type not in this list, ask them to clarify or suggest `sociedad_acciones_simplificada` as the default for Colombian companies.**

### Step 3: Note About NIT Check Digit

You can optionally provide `digito_verificacion` (check digit), but if you don't, the function will automatically calculate it using the `calcular_digito_verificacion_nit()` database function.

**Recommendation:** Let the database calculate it. Do not provide `p_digito_verificacion` unless the user explicitly provides it.

### Step 4: Call the RPC Function

```typescript
// app/actions/empresas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearEmpresa(data: {
  organizacionId: string
  codigoBp: string
  razonSocial: string
  nombreComercial?: string
  tipoSociedad: string
  nit: string
  email?: string
  telefono?: string
  sitioWeb?: string
  // ... other optional fields
}) {
  const supabase = await createClient()

  const { data: empresaId, error } = await supabase.rpc('crear_empresa', {
    p_organizacion_id: data.organizacionId,
    p_codigo_bp: data.codigoBp,
    p_razon_social: data.razonSocial,
    p_nombre_comercial: data.nombreComercial,
    p_tipo_sociedad: data.tipoSociedad,
    p_nit: data.nit,
    // p_digito_verificacion: auto-calculated
    p_email: data.email,
    p_telefono: data.telefono,
    p_sitio_web: data.sitioWeb,
  })

  if (error) {
    console.error('Error creating empresa:', error)
    return { error: error.message }
  }

  revalidatePath('/empresas')
  return { data: empresaId }
}
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Insert into Tables Directly

```typescript
// WRONG - This breaks the CTI pattern
const { data: bp } = await supabase.from('business_partners').insert({ ... })
const { data: persona } = await supabase.from('personas').insert({ id: bp.id, ... })
```

**Why wrong:** This requires two separate database calls, can fail mid-transaction, and doesn't handle validation properly.

### ✅ DO: Use the RPC Functions

```typescript
// CORRECT - Atomic operation with validation
const { data: personaId } = await supabase.rpc('crear_persona', { ... })
```

### ❌ DON'T: Use Invalid Enum Values

```typescript
// WRONG - This will throw an error
p_tipo_documento: 'CC' // Not a valid enum value
```

### ✅ DO: Use Exact Enum Values

```typescript
// CORRECT
p_tipo_documento: 'cedula_ciudadania'
```

### ❌ DON'T: Forget Required Fields

```typescript
// WRONG - Missing required fields
await supabase.rpc('crear_persona', {
  p_primer_nombre: 'Juan'
  // Missing: organizacion_id, codigo_bp, primer_apellido, tipo_documento, numero_documento
})
```

### ✅ DO: Include All Required Fields

```typescript
// CORRECT
await supabase.rpc('crear_persona', {
  p_organizacion_id: 'uuid',
  p_codigo_bp: 'BP-001',
  p_primer_nombre: 'Juan',
  p_primer_apellido: 'Pérez',
  p_tipo_documento: 'cedula_ciudadania',
  p_numero_documento: '123456'
})
```

---

## Error Handling Guide

### Common Error Messages

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| `Organization with ID % does not exist` | Invalid organization UUID | Verify the organization exists first |
| `Invalid tipo_documento: %` | Used wrong document type | Check valid enum values above |
| `Invalid tipo_sociedad: %` | Used wrong company type | Check valid enum values above |
| `A persona with document number % already exists` | Duplicate document | Document numbers must be unique per organization |
| `An empresa with NIT % already exists` | Duplicate NIT | NITs must be unique per organization |
| `User must be authenticated` | Not logged in | Ensure `auth.uid()` returns a valid user |

### Error Handling Pattern

```typescript
const result = await crearPersona(data)

if (result.error) {
  // Parse error and provide user-friendly message
  if (result.error.includes('already exists')) {
    return { error: 'Ya existe una persona con este número de documento' }
  } else if (result.error.includes('Invalid tipo_documento')) {
    return { error: 'Tipo de documento inválido. Verifique el valor.' }
  } else {
    return { error: `Error al crear persona: ${result.error}` }
  }
}

// Success
return { success: true, id: result.data }
```

---

## Form Validation Before Submission

Before calling the RPC function, validate the form data:

```typescript
// Use Zod for validation
import { z } from 'zod'

const personaSchema = z.object({
  organizacionId: z.string().uuid(),
  codigoBp: z.string().min(1),
  primerNombre: z.string().min(1),
  primerApellido: z.string().min(1),
  tipoDocumento: z.enum([
    'cedula_ciudadania',
    'cedula_extranjeria',
    'pasaporte',
    'tarjeta_identidad',
    'registro_civil',
    'nit',
    'nit_extranjero',
    'carnet_diplomatico',
    'pep',
    'permiso_especial_permanencia'
  ]),
  numeroDocumento: z.string().min(1),
  email: z.string().email().optional(),
  // ... other fields
})

// In your form handler
const validation = personaSchema.safeParse(formData)
if (!validation.success) {
  return { error: validation.error.message }
}

const result = await crearPersona(validation.data)
```

---

## Complete Workflow Example

Here's a complete example of creating a persona from a form submission:

```typescript
// features/personas/components/persona-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { crearPersona } from '@/app/actions/personas'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const schema = z.object({
  organizacionId: z.string().uuid(),
  codigoBp: z.string().min(1, 'Código es requerido'),
  primerNombre: z.string().min(1, 'Primer nombre es requerido'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'Primer apellido es requerido'),
  segundoApellido: z.string().optional(),
  tipoDocumento: z.enum([
    'cedula_ciudadania',
    'cedula_extranjeria',
    'pasaporte',
    'tarjeta_identidad',
    'registro_civil',
    'nit',
    'nit_extranjero',
    'carnet_diplomatico',
    'pep',
    'permiso_especial_permanencia'
  ]),
  numeroDocumento: z.string().min(1, 'Número de documento es requerido'),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  celular: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function PersonaForm({ organizacionId }: { organizacionId: string }) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizacionId,
      codigoBp: '',
      primerNombre: '',
      primerApellido: '',
      tipoDocumento: 'cedula_ciudadania',
      numeroDocumento: '',
    }
  })

  async function onSubmit(data: FormData) {
    const result = await crearPersona(data)

    if (result.error) {
      toast.error('Error al crear persona', {
        description: result.error
      })
    } else {
      toast.success('Persona creada exitosamente')
      router.push(`/personas/${result.data}`)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields using shadcn/ui components */}
      <FormField
        control={form.control}
        name="primerNombre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primer Nombre</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* More fields... */}
      <Button type="submit">Crear Persona</Button>
    </form>
  )
}
```

---

## JSONB Field Structures

When working with JSONB fields, use these exact structures:

### Address (`direccion`)

```typescript
const direccion = {
  calle: "Calle 123 # 45-67",
  barrio: "Chapinero",
  ciudad: "Bogotá",
  departamento: "Cundinamarca",
  codigo_postal: "110111",
  pais: "Colombia",
  complemento: "Apto 301"
}
```

### Emergency Contact (`contacto_emergencia`)

```typescript
const contactoEmergencia = {
  nombre: "María Pérez",
  parentesco: "Hermana",
  telefono: "+57 300 123 4567",
  email: "maria@example.com"
}
```

### Legal Representative (`representante_legal`)

```typescript
const representanteLegal = {
  nombre: "Juan Pérez",
  identificacion: "1234567890",
  cargo: "Gerente General",
  telefono: "+57 300 123 4567",
  email: "juan@acme.com"
}
```

### Banking Information (`informacion_bancaria`)

```typescript
const informacionBancaria = {
  banco: "Bancolombia",
  tipo_cuenta: "Ahorros",
  numero_cuenta: "12345678901",
  certificacion_bancaria_url: "https://..."
}
```

---

## Quick Reference: Required Parameters

### For `crear_persona`:
```
✅ p_organizacion_id (UUID)
✅ p_codigo_bp (TEXT)
✅ p_primer_nombre (TEXT)
✅ p_primer_apellido (TEXT)
✅ p_tipo_documento (ENUM)
✅ p_numero_documento (TEXT)
```

### For `crear_empresa`:
```
✅ p_organizacion_id (UUID)
✅ p_codigo_bp (TEXT)
✅ p_razon_social (TEXT)
✅ p_tipo_sociedad (ENUM)
✅ p_nit (TEXT)
```

---

## Testing Your Implementation

Before submitting code, test with this checklist:

- [ ] All required fields are provided
- [ ] Enum values match exactly (check spelling)
- [ ] UUIDs are valid format
- [ ] Error handling is implemented
- [ ] Success case redirects or shows confirmation
- [ ] Form validation is in place
- [ ] JSONB fields use correct structure
- [ ] Server action uses `createClient()` from `@/lib/supabase/server`
- [ ] `revalidatePath()` is called after mutation

---

## See Also

- [Supabase API Documentation](SUPABASE_API.md) - Complete API reference
- [Database Schema](../database/SCHEMA.md) - Schema details
- [Tables Dictionary](../database/TABLES.md) - All table definitions
- [Query Examples](../database/QUERIES.md) - SQL patterns

---

## When to Ask the User

If you encounter any of these situations, ASK the user instead of guessing:

1. **Unclear document type**: "¿Qué tipo de documento es? (cédula de ciudadanía, pasaporte, etc.)"
2. **Unclear company type**: "¿Qué tipo de sociedad es la empresa? (S.A.S., S.A., Ltda., etc.)"
3. **Missing required fields**: List which fields are missing and ask the user to provide them
4. **Ambiguous data**: If the user provides data that could match multiple enum values, ask for clarification

**Never guess enum values or required fields. Always confirm with the user.**
