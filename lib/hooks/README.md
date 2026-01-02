# Hooks de Utilidades

## useNotify

Hook personalizado para gestionar notificaciones mejoradas en la aplicación.

### Características

- **Errores Persistentes**: Los errores permanecen en pantalla hasta que el usuario los cierre manualmente
- **Copiado Rápido**: Botón "Copiar Error" que copia toda la información del error con un clic
- **Texto Seleccionable**: Los mensajes de error pueden seleccionarse y copiarse manualmente para debugging
- **Título y Descripción**: Soporte completo para mensajes en dos niveles (breve + técnico)
- **Duración Inteligente**: 4 segundos para éxitos/info/warning, infinito para errores
- **Reporte Completo**: Al copiar, incluye título, descripción, fecha/hora, URL y navegador

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

### Copiado Rápido de Errores

Cada error incluye un botón **"Copiar Error"** que copia automáticamente toda la información relevante:

```
═══════════════════════════════════
🐛 REPORTE DE ERROR
═══════════════════════════════════

ERROR: Error al crear usuario

DETALLES TÉCNICOS:
Unique constraint violation on email field

FECHA/HORA: 02/01/2026, 10:30:45 a. m.

CONTEXTO:
URL: https://app.ejemplo.com/admin/usuarios
Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...

═══════════════════════════════════
```

**Características:**
- ✅ Un solo clic para copiar todo el contexto del error
- ✅ Feedback visual inmediato ("Error copiado")
- ✅ Incluye fecha/hora, URL actual y navegador
- ✅ Fallback automático para navegadores antiguos
- ✅ Formato limpio listo para pegar en tickets o Slack

**Flujo de Usuario:**
1. Aparece un error persistente en pantalla
2. Usuario hace clic en el botón "Copiar"
3. Aparece confirmación "Error copiado al portapapeles"
4. Usuario pega el error en su herramienta de soporte preferida

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

2. **Botón de Acción "Copiar Error"**:
   - Usa la API moderna del Clipboard (`navigator.clipboard.writeText()`)
   - Fallback automático con `document.execCommand('copy')` para navegadores antiguos
   - Icono de Copy (lucide-react) junto al texto "Copiar"
   - Feedback visual inmediato con toast de confirmación

3. **Texto Seleccionable**: Se aplican las clases CSS `select-text` y `cursor-text` para permitir selección de texto en todos los navegadores.

4. **Descripción en Monospace**: Los mensajes de descripción usan fuente monospace (`font-mono`) para facilitar la lectura de errores técnicos.

5. **Formato del Reporte**: El error copiado incluye:
   - Título del error
   - Descripción técnica (si existe)
   - Fecha/hora con formato localizado (es-CO)
   - URL completa de la página
   - User Agent del navegador

6. **Botón de Cierre Visible**: Gracias a `closeButton={true}` en la configuración global del Toaster, todos los errores muestran un botón X para cerrarlos.

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
