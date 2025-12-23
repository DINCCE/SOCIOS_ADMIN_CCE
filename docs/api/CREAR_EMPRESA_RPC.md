# API Documentación: `crear_empresa` (RPC)

Esta función es el punto de entrada central para la creación de empresas en el sistema. Asegura la integridad de los datos, la atomicidad de las transacciones y aplica reglas de negocio críticas como el cálculo del NIT.

## 🎯 Propósito
La API `crear_empresa` implementa el patrón de herencia (Class Table Inheritance) creando de forma atómica:
1. Un registro en la tabla `business_partners` (Base).
2. Un registro vinculado en la tabla `empresas` (Especialización) con el mismo UUID.
3. Calcula automáticamente el dígito de verificación del NIT si no se proporciona.
4. Genera automáticamente el código de negocio (e.g., `BP-0000022`).

---

## 🛠️ Detalles Técnicos
- **Tipo**: Stored Procedure (RPC)
- **Lenguaje**: PL/pgSQL
- **Esquema**: `public`
- **Permisos**: `SECURITY DEFINER`.

---

## 📥 Parámetros

### Obligatorios (NOT NULL)
| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `p_organizacion_id` | `UUID` | ID de la organización dueña del registro. |
| `p_razon_social` | `TEXT` | Nombre legal de la empresa. |
| `p_nit` | `TEXT` | NIT (Solo números, entre 7 y 12 dígitos). |
| `p_tipo_sociedad` | `TEXT` | Tipo (SA, SAS, LTDA, EU, COOP, etc.). |
| `p_email_principal` | `TEXT` | Email único en el sistema. |
| `p_telefono_principal`| `TEXT` | Teléfono único (10 dígitos exactos). |

### Opcionales
| Parámetro | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `p_nombre_comercial` | `TEXT` | `NULL` | |
| `p_digito_verificacion`| `TEXT` | `NULL` | Se calcula automáticamente si es null. |
| `p_fecha_constitucion` | `DATE` | `NULL` | |
| `p_ciudad_constitucion`| `TEXT` | `NULL` | |
| `p_sector_industria` | `TEXT` | `NULL` | |
| `p_actividad_economica`| `TEXT` | `NULL` | |
| `p_tamano_empresa` | `TEXT` | `NULL` | micro, pequena, mediana, grande. |
| `p_email_secundario` | `TEXT` | `NULL` | |
| `p_telefono_secundario`| `TEXT` | `NULL` | 10 dígitos locales. |
| `p_whatsapp` | `TEXT` | `NULL` | 10 dígitos. |
| `p_website` | `TEXT` | `NULL` | |
| `p_representante_legal_id` | `UUID` | `NULL` | ID del business_partner de tipo persona. |

---

## 📤 Respuesta (JSONB)
```json
{
  "success": true,
  "bp_id": "uuid",
  "codigo_bp": "BP-XXXXXXX",
  "message": "Empresa creada exitosamente...",
  "warnings": ["Warning if DV does not match..."]
}
```

---

## 🛡️ Validaciones y Reglas de Negocio

### Errores Críticos
1. **Unicidad de NIT**: No permite duplicar el NIT dentro de la misma organización.
2. **Unicidad de Contacto**: `email_principal` y `telefono_principal` deben ser únicos.
3. **Formatos**:
   - **NIT**: Solo números, 7-12 dígitos.
   - **Teléfonos**: Exactamente 10 dígitos.
   - **Email**: Formato estándar de correo.

### Lógica de NIT (Colombia)
- La función utiliza el algoritmo de **Módulo 11** para calcular el dígito de verificación.
- Si proporcionas un `p_digito_verificacion` que no coincide con el calculado, la empresa se crea pero se retorna un **Warning** informativo.

---

## 💻 Implementación en Next.js

### Server Action (`create-company-action.ts`)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCompanyAction(formData: any) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_empresa', {
    p_organizacion_id: formData.organizacion_id,
    p_razon_social: formData.razon_social,
    p_nit: formData.nit,
    p_tipo_sociedad: formData.tipo_sociedad,
    p_email_principal: formData.email,
    p_telefono_principal: formData.telefono,
    // Opcionales
    p_nombre_comercial: formData.nombre_comercial,
    p_website: formData.website
  })

  if (error) return { success: false, message: error.message }

  if (data.success) {
    revalidatePath('/dashboard/business-partners')
  }

  return data
}
```
