"use server"

import { createClient } from "@/lib/supabase/server"
import type { EstadoHistorial } from "@/lib/schemas/estado-historial-schema"

export interface EstadoHistorialItem extends EstadoHistorial {
  nombres?: string
  apellidos?: string
}

/**
 * Obtiene el historial de cambios de estado de una tarea
 * Incluye información del usuario que realizó cada cambio
 */
export async function obtenerHistorialTarea(tareaId: string): Promise<{
  success: boolean
  data?: EstadoHistorialItem[]
  message?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("tr_estados_historial")
      .select(`
        id,
        entidad_tipo,
        entidad_id,
        estado_anterior,
        estado_nuevo,
        cambiado_en,
        usuario_id,
        organizacion_id,
        duracion_segundos
      `)
      .eq("entidad_tipo", "tarea")
      .eq("entidad_id", tareaId)
      .order("cambiado_en", { ascending: false })

    if (error) {
      return { success: false, message: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, data: [] }
    }

    // Get user information for each history entry
    const userIds = [...new Set(data.map((entry) => entry.usuario_id).filter(Boolean))] as string[]

    let memberMap: Record<string, { nombres: string; apellidos: string }> = {}

    if (userIds.length > 0) {
      const { data: members } = await supabase
        .from("config_organizacion_miembros")
        .select("user_id, nombres, apellidos")
        .in("user_id", userIds)

      if (members) {
        memberMap = members.reduce((acc, member) => {
          if (member.user_id) {
            acc[member.user_id] = {
              nombres: member.nombres || "",
              apellidos: member.apellidos || "",
            }
          }
          return acc
        }, {} as Record<string, { nombres: string; apellidos: string }>)
      }
    }

    // Combine history with user info
    const historialConUsuario: EstadoHistorialItem[] = data.map((entry) => {
      const userInfo = entry.usuario_id ? memberMap[entry.usuario_id] : undefined
      return {
        ...entry,
        nombres: userInfo?.nombres,
        apellidos: userInfo?.apellidos,
      }
    })

    return { success: true, data: historialConUsuario }
  } catch (error) {
    console.error("Error al obtener historial de tarea:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al obtener historial",
    }
  }
}
