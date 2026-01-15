/**
 * Database Types
 * Auto-generated from Supabase schema
 * This file exports the Database type for Supabase client
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      _任何_: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: {
      _任何_: {
        Row: Record<string, unknown>
        Relationships: []
      }
    }
    Functions: {
      _任何_: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      dm_actores_genero: 'masculino' | 'femenino' | 'otro' | 'no aplica'
      dm_actores_estado_civil: 'soltero' | 'casado' | 'union libre' | 'divorciado' | 'viudo'
      dm_actores_estado: 'activo' | 'inactivo' | 'bloqueado'
      tr_doc_comercial_estados: 'Nueva' | 'En Progreso' | 'Ganada' | 'Pérdida' | 'Descartada'
      tr_tareas_estado: 'Pendiente' | 'En Progreso' | 'Terminada' | 'Pausada' | 'Cancelada'
      tr_tareas_prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente'
      dm_accion_estado: 'disponible' | 'asignada' | 'arrendada' | 'bloqueada' | 'inactiva'
    }
  }
}

// Re-export commonly used types from lib/db-types for convenience
export type {
  TipoActorEnum,
  DmActorGenero,
  DmActorEstadoCivil,
  DmActorEstado,
  TrDocComercialEstados,
  TrTareasEstado,
  TrTareasPrioridad,
  DmAccionEstado,
} from './lib/db-types'
