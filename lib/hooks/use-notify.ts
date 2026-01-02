"use client"

import React from "react"
import { toast } from "sonner"
import { Copy, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"

interface NotifyOptions {
  title: string
  description?: string
}

/**
 * Formatea la información del error para copiado al portapapeles
 */
function formatErrorForClipboard(
  title: string,
  description?: string,
  url?: string
): string {
  const timestamp = new Date().toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
  })

  return `
═══════════════════════════════════
🐛 REPORTE DE ERROR
═══════════════════════════════════

ERROR: ${title}

${description ? `DETALLES TÉCNICOS:\n${description}\n` : ""}
FECHA/HORA: ${timestamp}

CONTEXTO:
URL: ${url || "N/A"}
Navegador: ${typeof window !== "undefined" ? window.navigator.userAgent : "N/A"}

═══════════════════════════════════
`.trim()
}

/**
 * Fallback para copiar texto al portapapeles en navegadores antiguos
 */
function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "fixed"
  textArea.style.left = "-999999px"
  textArea.style.top = "-999999px"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand("copy")
    if (successful) {
      toast.success("Error copiado", {
        description: "El error se copió al portapapeles",
        duration: 2000,
        icon: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />,
      })
    } else {
      toast.error("Error al copiar", {
        description: "No se pudo copiar al portapapeles",
        duration: 3000,
        icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-500" />,
      })
    }
  } catch (err) {
    console.error("Fallback: Error al copiar:", err)
    toast.error("Error al copiar", {
      description: "No se pudo copiar al portapapeles",
      duration: 3000,
      icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-500" />,
    })
  } finally {
    document.body.removeChild(textArea)
  }
}

/**
 * Hook personalizado para gestionar notificaciones con configuración mejorada
 *
 * Características:
 * - Errores persistentes (duración infinita) hasta que el usuario los cierre
 * - Texto seleccionable para copiar detalles técnicos
 * - Botón de acción para copiar error completo con un clic
 * - Éxitos con duración estándar de 4 segundos
 * - Soporte para título y descripción detallada
 */
export function useNotify() {
  /**
   * Muestra una notificación de error persistente con botón de copiado
   *
   * @param options - Título y descripción del error
   * @param options.title - Mensaje breve del error (ej: "Error al guardar cambios")
   * @param options.description - Mensaje técnico detallado (ej: "Unique constraint violation on email")
   *
   * @example
   * const { notifyError } = useNotify()
   * notifyError({
   *   title: "Error al crear usuario",
   *   description: "El email ya está registrado en el sistema"
   * })
   */
  const notifyError = ({ title, description }: NotifyOptions) => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : ""

    toast.error(title, {
      description,
      duration: Infinity,
      // Icono elegante: AlertCircle en rose-600
      icon: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-500" />,
      // Clase personalizada para hacer el texto seleccionable
      className: "select-text cursor-text",
      classNames: {
        toast: "select-text cursor-text",
        title: "select-text cursor-text",
        description: "select-text cursor-text font-mono text-xs",
      },
      // Botón de acción para copiar el error
      action: {
        label: (
          <div className="flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Copiar</span>
          </div>
        ),
        onClick: async () => {
          try {
            const errorText = formatErrorForClipboard(title, description, currentUrl)
            await navigator.clipboard.writeText(errorText)

            // Feedback visual: mostrar confirmación
            toast.success("Error copiado", {
              description: "El error se copió al portapapeles",
              duration: 2000,
              icon: <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />,
            })
          } catch (err) {
            console.error("Error al copiar al portapapeles:", err)
            // Fallback: intentar con el método antiguo
            fallbackCopyTextToClipboard(
              formatErrorForClipboard(title, description, currentUrl)
            )
          }
        },
      },
    })
  }

  /**
   * Muestra una notificación de éxito con duración estándar
   *
   * @param options - Título y descripción opcional del éxito
   * @param options.title - Mensaje del éxito
   * @param options.description - Detalles adicionales opcionales
   *
   * @example
   * const { notifySuccess } = useNotify()
   * notifySuccess({ title: "Usuario creado correctamente" })
   */
  const notifySuccess = ({ title, description }: NotifyOptions) => {
    toast.success(title, {
      description,
      // Icono elegante: CheckCircle en emerald-600
      icon: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />,
      // Usa la duración configurada globalmente (4000ms) si no se especifica
    })
  }

  /**
   * Muestra una notificación de información con duración estándar
   *
   * @param options - Título y descripción opcional
   * @param options.title - Mensaje informativo
   * @param options.description - Detalles adicionales opcionales
   *
   * @example
   * const { notifyInfo } = useNotify()
   * notifyInfo({ title: "Sincronización en progreso" })
   */
  const notifyInfo = ({ title, description }: NotifyOptions) => {
    toast.info(title, {
      description,
      // Icono elegante: Info en blue-600
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
    })
  }

  /**
   * Muestra una notificación de advertencia con duración estándar
   *
   * @param options - Título y descripción opcional
   * @param options.title - Mensaje de advertencia
   * @param options.description - Detalles adicionales opcionales
   *
   * @example
   * const { notifyWarning } = useNotify()
   * notifyWarning({
   *   title: "Sesión por expirar",
   *   description: "Tu sesión expirará en 5 minutos"
   * })
   */
  const notifyWarning = ({ title, description }: NotifyOptions) => {
    toast.warning(title, {
      description,
      // Icono elegante: AlertTriangle en amber-600
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
    })
  }

  return {
    notifyError,
    notifySuccess,
    notifyInfo,
    notifyWarning,
  }
}
