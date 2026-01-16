/**
 * EJEMPLO DE USO DE LAS ACCIONES DE ASIGNACIONES
 *
 * Este archivo muestra cómo usar las Server Actions para crear y finalizar
 * asignaciones de acciones desde componentes React.
 *
 * Ubicación: app/actions/asignaciones.ts
 */

'use client'

import { useState } from 'react'
import { crearAsignacion, finalizarAsignacion } from '@/app/actions/asignaciones'
import type { CrearAsignacionParams } from '@/app/actions/asignaciones'

// ============================================================================
// EJEMPLO 1: Componente para crear una asignación
// ============================================================================

export function CrearAsignacionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      // Preparar parámetros (camelCase)
      const params: CrearAsignacionParams = {
        accionId: formData.get('accionId') as string,
        asociadoId: formData.get('asociadoId') as string,
        organizacionId: formData.get('organizacionId') as string,
        tipoVinculo: formData.get('tipoVinculo') as any,
        modalidad: formData.get('modalidad') as any,
        planComercial: formData.get('planComercial') as any,
        asignacionPadreId: (formData.get('asignacionPadreId') as string) || null,
        notas: (formData.get('notas') as string) || null,
        atributos: {}, // Opcional
      }

      // Llamar a la Server Action
      const asignacion = await crearAsignacion(params)

      console.log('✅ Asignación creada:', asignacion)

      // Mostrar éxito al usuario
      alert(`Asignación creada exitosamente\nCódigo: ${asignacion.codigo_completo}`)
    } catch (err) {
      // La RPC usa RAISE EXCEPTION, así que el error viene aquí
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      console.error('❌ Error creando asignación:', errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campos del formulario */}
      <input name="accionId" placeholder="ID Acción" required />
      <input name="asociadoId" placeholder="ID Asociado" required />
      <select name="tipoVinculo" required>
        <option value="propietario">Propietario</option>
        <option value="titular">Titular</option>
        <option value="beneficiario">Beneficiario</option>
        <option value="intermediario">Intermediario</option>
      </select>

      {/* Mensaje de error */}
      {error && <div className="text-red-500">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creando...' : 'Crear Asignación'}
      </button>
    </form>
  )
}

// ============================================================================
// EJEMPLO 2: Componente para finalizar una asignación
// ============================================================================

export function FinalizarAsignacionButton({ asignacionId }: { asignacionId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFinalizar = async () => {
    if (!confirm('¿Está seguro de finalizar esta asignación?')) return

    setIsLoading(true)

    try {
      // Llamar a la Server Action
      const asignacionFinalizada = await finalizarAsignacion({
        asignacionId,
        motivo: 'Venta completada', // Opcional
      })

      console.log('✅ Asignación finalizada:', asignacionFinalizada)

      // Mostrar éxito o redirigir
      alert('Asignación finalizada exitosamente')
      window.location.reload() // Revalidará los datos
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error finalizando:', errorMsg)
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleFinalizar} disabled={isLoading}>
      {isLoading ? 'Finalizando...' : 'Finalizar Asignación'}
    </button>
  )
}

// ============================================================================
// EJEMPLO 3: Crear múltiples beneficiarios en lote
// ============================================================================

export function CrearBeneficiariosBatchButton({
  accionId,
  asignacionPadreId,
  beneficiarioIds,
}: {
  accionId: string
  asignacionPadreId: string
  beneficiarioIds: string[]
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCrearBatch = async () => {
    setIsLoading(true)

    try {
      // Importar la función de batch
      const { crearAsignacionesBatch } = await import('@/app/actions/asignaciones')

      // Preparar parámetros para cada beneficiario
      const params = beneficiarioIds.map((asociadoId) => ({
        accionId,
        asociadoId,
        organizacionId: 'uuid-org', // Debe venir del contexto
        tipoVinculo: 'beneficiario' as const,
        modalidad: 'asignacion_corp' as const,
        planComercial: 'regular' as const,
        asignacionPadreId,
      }))

      // Crear todos en lote
      const resultados = await crearAsignacionesBatch(params)

      console.log(`✅ ${resultados.length} beneficiarios creados`)

      alert(`${resultados.length} beneficiarios creados exitosamente`)
      window.location.reload()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error en batch:', errorMsg)
      alert(`Error: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleCrearBatch} disabled={isLoading}>
      {isLoading
        ? 'Creando beneficiarios...'
        : `Crear ${beneficiarioIds.length} Beneficiarios`}
    </button>
  )
}

// ============================================================================
// EJEMPLO 4: Manejo de errores específicos con mensajes personalizados
// ============================================================================

export function getErrorMessage(error: Error): string {
  const msg = error.message.toLowerCase()

  // Errores de unicidad
  if (msg.includes('ya existe un propietario')) {
    return 'Ya existe un propietario vigente para esta acción. Solo puede haber uno.'
  }

  if (msg.includes('ya existe un titular')) {
    return 'Ya existe un titular vigente para esta acción.'
  }

  // Errores de jerarquía
  if (msg.includes('pertenece a una acción diferente')) {
    return 'La asignación padre debe pertenecer a la misma acción que el beneficiario.'
  }

  if (msg.includes('debe proporcionar una asignación padre')) {
    return 'Para crear un beneficiario, debe seleccionar una asignación padre (titular o propietario).'
  }

  // Errores de estado de acción
  if (msg.includes('bloqueada') || msg.includes('inactiva')) {
    return 'La acción está bloqueada o inactiva y no permite nuevas asignaciones.'
  }

  if (msg.includes('debe estar en estado')) {
    return 'El estado actual de la acción no permite este tipo de asignación.'
  }

  // Errores de permisos
  if (msg.includes('no tienes permisos')) {
    return 'No tiene permisos para realizar esta acción. Contacte al administrador.'
  }

  // Errores de autenticación
  if (msg.includes('no autenticado')) {
    return 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
  }

  // Error genérico
  return error.message
}
