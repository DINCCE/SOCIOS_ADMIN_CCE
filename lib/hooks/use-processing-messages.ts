import { useState, useCallback } from 'react'

const PROCESSING_MESSAGES = [
  'Haciendo la magia',
  'Cumpliendo tus deseos',
  'Trabajando duro',
  'Ya casi...',
  'Un poquito más',
  'Vamos con todo',
  'En proceso',
  'Trabajando',
  'Procesando',
  'Ahí vamos',
  'Espera un momentito',
  'Cosas pasando',
  'Moviendo los hilos',
  'Haciendo玲珑',
  'Preparando todo',
  'Dando el todo',
  'A full trabajo',
  'Casi listo',
  'Momentito por favor',
] as const

/**
 * Espera artificial para dar tiempo a leer mensajes de procesamiento.
 * @param ms - Milisegundos a esperar (default: 1200ms)
 */
export async function processingDelay(ms: number = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Devuelve un mensaje aleatorio de procesamiento (versión utilidad).
 */
export function getRandomProcessingMessage(): string {
  const randomIndex = Math.floor(Math.random() * PROCESSING_MESSAGES.length)
  return PROCESSING_MESSAGES[randomIndex]
}

/**
 * Hook que gestiona el estado de procesamiento con mensajes aleatorios.
 * Incluye una espera artificial mínima para que los mensajes sean legibles.
 *
 * @param minDelay - Tiempo mínimo de espera en ms (default: 1200ms)
 *
 * @example
 * const { isPending, processingMessage, withProcessing } = useProcessingState()
 *
 * async function handleSubmit() {
 *   await withProcessing(async () => {
 *     await createSomething(data)
 *   })
 * }
 */
export function useProcessingState(minDelay: number = 1200) {
  const [isPending, setIsPending] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string>('')

  const withProcessing = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setIsPending(true)
      setProcessingMessage(getRandomProcessingMessage())

      try {
        // Ejecutar la función principal y la espera en paralelo
        const [result] = await Promise.all([
          fn(),
          processingDelay(minDelay),
        ])
        return result
      } catch (error) {
        throw error
      } finally {
        setIsPending(false)
        setProcessingMessage('')
      }
    },
    [minDelay]
  )

  return {
    isPending,
    processingMessage,
    withProcessing,
    setIsPending,
  }
}
