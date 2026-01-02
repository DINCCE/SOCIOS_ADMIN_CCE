"use client"

import { toast } from "sonner"

interface NotifyOptions {
  title: string
  description?: string
}

/**
 * Hook personalizado para gestionar notificaciones con configuración mejorada
 *
 * Características:
 * - Errores persistentes (duración infinita) hasta que el usuario los cierre
 * - Texto seleccionable para copiar detalles técnicos
 * - Éxitos con duración estándar de 4 segundos
 * - Soporte para título y descripción detallada
 */
export function useNotify() {
  /**
   * Muestra una notificación de error persistente
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
    toast.error(title, {
      description,
      duration: Infinity,
      // Clase personalizada para hacer el texto seleccionable
      className: "select-text cursor-text",
      classNames: {
        toast: "select-text cursor-text",
        title: "select-text cursor-text",
        description: "select-text cursor-text font-mono text-xs",
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
    })
  }

  return {
    notifyError,
    notifySuccess,
    notifyInfo,
    notifyWarning,
  }
}
