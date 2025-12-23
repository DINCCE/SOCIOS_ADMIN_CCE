# API Documentación: `crear_persona` (RPC)

Esta función es el punto de entrada central para la creación de personas en el sistema. Asegura la integridad de los datos, la atomicidad de las transacciones y aplica reglas de negocio críticas.

## 🎯 Propósito
La API `crear_persona` implementa el patrón de herencia (Class Table Inheritance) creando de forma atómica:
1. Un registro en la tabla `business_partners` (Base).
2. Un registro vinculado en la tabla `personas` (Especialización) con el mismo UUID.
3. Genera automáticamente el código de negocio (e.g., `BP-0000015`).

---

## 🛠️ Detalles Técnicos
- **Tipo**: Stored Procedure (RPC)
- **Lenguaje**: PL/pgSQL
- **Esquema**: `public`
- **Permisos**: `SECURITY DEFINER` (Ejecuta con privilegios de sistema, permitiendo bypass de RLS controlado).

---

## 📥 Parámetros

### Obligatorios (NOT NULL)
| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `p_organizacion_id` | `UUID` | ID de la organización dueña del registro. |
| `p_primer_nombre` | `TEXT` | Primer nombre de la persona. |
| `p_primer_apellido` | `TEXT` | Primer apellido de la persona. |
| `p_tipo_documento` | `TEXT` | Tipo (CC, CE, TI, PA, NIT, PEP). |
| `p_numero_documento` | `TEXT` | Número (Solo dígitos, 5-20 caracteres). |
| `p_genero` | `TEXT` | Género (masculino, femenino, otro, no_especifica). |
| `p_fecha_nacimiento` | `DATE` | Fecha de nacimiento (Debe ser > 18 años). |
| `p_email_principal` | `TEXT` | Email único en el sistema. |
| `p_telefono_principal`| `TEXT` | Teléfono único (10 dígitos exactos). |

### Opcionales
| Parámetro | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `p_segundo_nombre` | `TEXT` | `NULL` | |
| `p_segundo_apellido` | `TEXT` | `NULL` | |
| `p_email_secundario` | `TEXT` | `NULL` | |
| `p_telefono_secundario`| `TEXT` | `NULL` | 10 dígitos. |
| `p_whatsapp` | `TEXT` | `NULL` | 10 dígitos. |
| `p_nacionalidad` | `TEXT` | `'CO'` | |
| `p_estado_civil` | `TEXT` | `NULL` | soltero, casado, etc. |
| `p_ocupacion` | `TEXT` | `NULL` | |
| `p_profesion` | `TEXT` | `NULL` | |
| `p_nivel_educacion` | `TEXT` | `NULL` | técnico, pregrado, etc. |

---

## 📤 Respuesta (JSONB)
La función siempre retorna un objeto con la siguiente estructura:

```json
{
  "success": true,           // true si se creó, false si hubo error.
  "bp_id": "uuid",           // ID del nuevo registro (null si falla).
  "codigo_bp": "BP-XXXXXXX", // Código generado (null si falla).
  "message": "Mensaje...",   // Descripción del resultado o error.
  "warnings": ["..."]        // Lista de advertencias no bloqueantes.
}
```

---

## 🛡️ Validaciones y Reglas de Negocio

### Errores Críticos (Bloquean la creación)
1. **Unicidad de Contacto**: No permite crear si el `email_principal` o `telefono_principal` ya existen en otro registro activo.
2. **Unicidad de Documento**: No permite documentos duplicados dentro de la misma organización.
3. **Formatos**:
   - **Teléfonos**: Deben ser exactamente **10 dígitos** numéricos (Sin prefijos, espacios ni guiones).
   - **Email**: Patrón `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`.
   - **Documento**: Solo números, longitud entre 5 y 20 caracteres.
4. **Edad**: La persona debe ser mayor de **18 años**.

### Valores Permitidos (Enums)
- **`p_tipo_documento`**: `CC`, `CE`, `TI`, `PA`, `RC`, `NIT`, `PEP`, `PPT`, `DNI`, `NUIP`.
- **`p_genero`**: `masculino`, `femenino`, `otro`, `no_especifica`.
- **`p_estado_civil`**: `soltero`, `casado`, `union_libre`, `divorciado`, `viudo`, `separado`.
- **`p_nivel_educacion`**: `primaria`, `bachillerato`, `tecnico`, `tecnologo`, `pregrado`, `posgrado`, `maestria`, `doctorado`.

---

## 💻 Implementación en Next.js

Para proyectos Next.js (App Router), se recomienda encapsular la llamada en un **Server Action** para mayor seguridad y validación adicional con Zod.

### 1. Server Action (`create-person-action.ts`)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPersonAction(formData: any) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_persona', {
    p_organizacion_id: formData.organizacion_id,
    p_primer_nombre: formData.primer_nombre,
    p_primer_apellido: formData.primer_apellido,
    p_tipo_documento: formData.tipo_documento,
    p_numero_documento: formData.numero_documento,
    p_genero: formData.genero,
    p_fecha_nacimiento: formData.fecha_nacimiento, // formato ISO: YYYY-MM-DD
    p_email_principal: formData.email,
    p_telefono_principal: formData.telefono,
    // ... campos opcionales
  })

  if (error) {
    return { success: false, message: error.message }
  }

  if (data.success) {
    revalidatePath('/dashboard/business-partners')
  }

  return data // Retorna { success, bp_id, codigo_bp, message, warnings }
}
```

### 2. Componente de Formulario (Client Side)

```tsx
'use client'

import { createPersonAction } from './actions'
import { toast } from 'sonner'

export function CreatePersonForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = Object.fromEntries(new FormData(e.currentTarget))
    
    const result = await createPersonAction(formData)

    if (result.success) {
      toast.success(`¡Éxito! ${result.message}`)
      // El mensaje ya incluye el código BP: "Persona creada exitosamente con código BP-0000018"
    } else {
      toast.error(result.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Inputs del formulario */}
      <button type="submit">Crear Persona</button>
    </form>
  )
}
```

> [!TIP]
> Esta API es atómica. Si algo falla durante la inserción en la tabla `personas`, el registro de `business_partners` se revierte automáticamente, evitando datos huérfanos.
