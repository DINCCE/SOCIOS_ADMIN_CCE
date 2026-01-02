# Hooks de Utilidades

## useNotify

Hook personalizado para gestionar notificaciones mejoradas en la aplicación.

### Características

- **Errores Persistentes**: Los errores permanecen en pantalla hasta que el usuario los cierre manualmente
- **Texto Seleccionable**: Los mensajes de error pueden seleccionarse y copiarse para debugging
- **Título y Descripción**: Soporte completo para mensajes en dos niveles (breve + técnico)
- **Duración Inteligente**: 4 segundos para éxitos/info/warning, infinito para errores

### Uso Básico

```typescript
import { useNotify } from "@/lib/hooks/use-notify"

function MyComponent() {
  const { notifyError, notifySuccess, notifyInfo, notifyWarning } = useNotify()

  // Error persistente con detalles técnicos
  const handleError = () => {
    notifyError({
      title: "Error al guardar cambios",
      description: "Unique constraint violation on email field"
    })
  }

  // Éxito simple
  const handleSuccess = () => {
    notifySuccess({
      title: "Usuario creado correctamente"
    })
  }

  // Éxito con detalles
  const handleSuccessWithDetails = () => {
    notifySuccess({
      title: "Datos sincronizados",
      description: "Se actualizaron 15 registros exitosamente"
    })
  }

  // Advertencia
  const handleWarning = () => {
    notifyWarning({
      title: "Sesión por expirar",
      description: "Tu sesión expirará en 5 minutos"
    })
  }

  // Información
  const handleInfo = () => {
    notifyInfo({
      title: "Sincronización en progreso"
    })
  }
}
```

### Ejemplo Real: Formulario con manejo de errores

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNotify } from "@/lib/hooks/use-notify"
import { createClient } from "@/lib/supabase/client"

export function CreateUserForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { notifyError, notifySuccess } = useNotify()
  const form = useForm()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('users')
        .insert(data)

      if (error) {
        // Error persistente con mensaje técnico copiable
        notifyError({
          title: "Error al crear usuario",
          description: error.message
        })
        return
      }

      // Éxito con duración estándar
      notifySuccess({
        title: "Usuario creado correctamente"
      })
    } catch (error) {
      // Error inesperado
      notifyError({
        title: "Error inesperado",
        description: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Migración desde toast directo

**Antes (❌ No recomendado):**
```typescript
import { toast } from "sonner"

// Desaparece muy rápido, no se puede copiar el error
toast.error(error.message)
```

**Después (✅ Recomendado):**
```typescript
import { useNotify } from "@/lib/hooks/use-notify"

const { notifyError } = useNotify()

// Persistente, copiable, con contexto claro
notifyError({
  title: "Error al procesar solicitud",
  description: error.message
})
```

### Notas Técnicas

1. **Duración Infinita para Errores**: Los errores usan `duration: Infinity` para asegurar que el usuario tenga tiempo de leerlos y copiarlos.

2. **Texto Seleccionable**: Se aplican las clases CSS `select-text` y `cursor-text` para permitir selección de texto en todos los navegadores.

3. **Descripción en Monospace**: Los mensajes de descripción usan fuente monospace (`font-mono`) para facilitar la lectura de errores técnicos.

4. **Botón de Cierre Visible**: Gracias a `closeButton={true}` en la configuración global del Toaster, todos los errores muestran un botón X para cerrarlos.

### Personalización Avanzada

Si necesitas sobrescribir la duración o añadir opciones personalizadas, puedes importar `toast` directamente:

```typescript
import { toast } from "sonner"

// Error con duración personalizada de 10 segundos
toast.error("Error temporal", {
  description: "Este error se cerrará automáticamente",
  duration: 10000
})
```

Sin embargo, para la mayoría de casos, se recomienda usar `useNotify()` para mantener consistencia.
