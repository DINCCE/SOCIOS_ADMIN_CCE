export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      config_ciudades: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          city_code: string | null
          city_name: string
          country_code: string
          country_name: string
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          id: string
          search_text: string
          state_name: string
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          city_code?: string | null
          city_name: string
          country_code: string
          country_name: string
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          id?: string
          search_text: string
          state_name: string
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          city_code?: string | null
          city_name?: string
          country_code?: string
          country_name?: string
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          id?: string
          search_text?: string
          state_name?: string
        }
        Relationships: []
      }
      config_organizacion_miembros: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          apellidos: string | null
          atributos: Json | null
          cargo: string | null
          creado_en: string | null
          creado_por: string | null
          created_at: string
          created_by: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          nombre_completo: string | null
          nombres: string | null
          organization_id: string
          role: string
          telefono: string | null
          user_id: string
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          apellidos?: string | null
          atributos?: Json | null
          cargo?: string | null
          creado_en?: string | null
          creado_por?: string | null
          created_at?: string
          created_by?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          nombre_completo?: string | null
          nombres?: string | null
          organization_id: string
          role: string
          telefono?: string | null
          user_id: string
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          apellidos?: string | null
          atributos?: Json | null
          cargo?: string | null
          creado_en?: string | null
          creado_por?: string | null
          created_at?: string
          created_by?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          nombre_completo?: string | null
          nombres?: string | null
          organization_id?: string
          role?: string
          telefono?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      config_organizaciones: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          configuracion: Json | null
          creado_en: string
          creado_por: string | null
          direccion: Json | null
          eliminado_en: string | null
          eliminado_por: string | null
          email: string | null
          id: string
          nombre: string
          organizacion_padre_id: string | null
          slug: string
          telefono: string | null
          tipo: Database["public"]["Enums"]["config_organizacion_tipo"] | null
          website: string | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          configuracion?: Json | null
          creado_en?: string
          creado_por?: string | null
          direccion?: Json | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email?: string | null
          id?: string
          nombre: string
          organizacion_padre_id?: string | null
          slug: string
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["config_organizacion_tipo"] | null
          website?: string | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          configuracion?: Json | null
          creado_en?: string
          creado_por?: string | null
          direccion?: Json | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email?: string | null
          id?: string
          nombre?: string
          organizacion_padre_id?: string | null
          slug?: string
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["config_organizacion_tipo"] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_organizacion_padre_id_fkey"
            columns: ["organizacion_padre_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      config_roles: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          role: string
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          role: string
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          role?: string
        }
        Relationships: []
      }
      config_roles_permisos: {
        Row: {
          action: string
          actualizado_en: string | null
          actualizado_por: string | null
          allow: boolean
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          resource: string
          role: string
        }
        Insert: {
          action: string
          actualizado_en?: string | null
          actualizado_por?: string | null
          allow?: boolean
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          resource: string
          role: string
        }
        Update: {
          action?: string
          actualizado_en?: string | null
          actualizado_por?: string | null
          allow?: boolean
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          resource?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "config_roles"
            referencedColumns: ["role"]
          },
        ]
      }
      dm_acciones: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          codigo_accion: string
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["dm_accion_estado"]
          id: string
          organizacion_id: string
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          codigo_accion: string
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["dm_accion_estado"]
          id?: string
          organizacion_id: string
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          codigo_accion?: string
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["dm_accion_estado"]
          id?: string
          organizacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_actores: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          ciudad_id: string | null
          codigo_bp: string
          creado_en: string
          creado_por: string | null
          digito_verificacion: number | null
          direccion_fisica: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          email_facturacion: string | null
          email_principal: string | null
          email_secundario: string | null
          es_cliente: boolean
          es_proveedor: boolean
          es_socio: boolean
          estado_actor: Database["public"]["Enums"]["dm_actor_estado"]
          estado_civil:
            | Database["public"]["Enums"]["dm_actor_estado_civil"]
            | null
          fecha_nacimiento: string | null
          genero_actor: Database["public"]["Enums"]["dm_actor_genero"] | null
          id: string
          nat_fiscal:
            | Database["public"]["Enums"]["dm_actor_naturaleza_fiscal"]
            | null
          nombre_comercial: string | null
          num_documento: string | null
          organizacion_id: string
          perfil_compliance: Json
          perfil_contacto: Json
          perfil_identidad: Json
          perfil_intereses: Json
          perfil_preferencias: Json
          perfil_profesional_corporativo: Json
          perfil_redes: Json
          perfil_referencias: Json
          perfil_salud: Json
          primer_apellido: string | null
          primer_nombre: string | null
          razon_social: string | null
          regimen_tributario:
            | Database["public"]["Enums"]["dm_actor_regimen_tributario"]
            | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          tags: string[] | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_actor: Database["public"]["Enums"]["tipo_actor_enum"]
          tipo_documento:
            | Database["public"]["Enums"]["dm_actor_tipo_documento"]
            | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          ciudad_id?: string | null
          codigo_bp?: string
          creado_en?: string
          creado_por?: string | null
          digito_verificacion?: number | null
          direccion_fisica?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_facturacion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          es_cliente?: boolean
          es_proveedor?: boolean
          es_socio?: boolean
          estado_actor?: Database["public"]["Enums"]["dm_actor_estado"]
          estado_civil?:
            | Database["public"]["Enums"]["dm_actor_estado_civil"]
            | null
          fecha_nacimiento?: string | null
          genero_actor?: Database["public"]["Enums"]["dm_actor_genero"] | null
          id?: string
          nat_fiscal?:
            | Database["public"]["Enums"]["dm_actor_naturaleza_fiscal"]
            | null
          nombre_comercial?: string | null
          num_documento?: string | null
          organizacion_id: string
          perfil_compliance?: Json
          perfil_contacto?: Json
          perfil_identidad?: Json
          perfil_intereses?: Json
          perfil_preferencias?: Json
          perfil_profesional_corporativo?: Json
          perfil_redes?: Json
          perfil_referencias?: Json
          perfil_salud?: Json
          primer_apellido?: string | null
          primer_nombre?: string | null
          razon_social?: string | null
          regimen_tributario?:
            | Database["public"]["Enums"]["dm_actor_regimen_tributario"]
            | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          tags?: string[] | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"]
          tipo_documento?:
            | Database["public"]["Enums"]["dm_actor_tipo_documento"]
            | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          ciudad_id?: string | null
          codigo_bp?: string
          creado_en?: string
          creado_por?: string | null
          digito_verificacion?: number | null
          direccion_fisica?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_facturacion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          es_cliente?: boolean
          es_proveedor?: boolean
          es_socio?: boolean
          estado_actor?: Database["public"]["Enums"]["dm_actor_estado"]
          estado_civil?:
            | Database["public"]["Enums"]["dm_actor_estado_civil"]
            | null
          fecha_nacimiento?: string | null
          genero_actor?: Database["public"]["Enums"]["dm_actor_genero"] | null
          id?: string
          nat_fiscal?:
            | Database["public"]["Enums"]["dm_actor_naturaleza_fiscal"]
            | null
          nombre_comercial?: string | null
          num_documento?: string | null
          organizacion_id?: string
          perfil_compliance?: Json
          perfil_contacto?: Json
          perfil_identidad?: Json
          perfil_intereses?: Json
          perfil_preferencias?: Json
          perfil_profesional_corporativo?: Json
          perfil_redes?: Json
          perfil_referencias?: Json
          perfil_salud?: Json
          primer_apellido?: string | null
          primer_nombre?: string | null
          razon_social?: string | null
          regimen_tributario?:
            | Database["public"]["Enums"]["dm_actor_regimen_tributario"]
            | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          tags?: string[] | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"]
          tipo_documento?:
            | Database["public"]["Enums"]["dm_actor_tipo_documento"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_actores_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "config_ciudades"
            referencedColumns: ["id"]
          },
        ]
      }
      tr_doc_comercial: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          asociado_id: string | null
          atributos: Json
          codigo: string
          creado_en: string
          creado_por: string | null
          documento_origen_id: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["tr_doc_comercial_estados"]
          fecha_doc: string
          fecha_venc_doc: string | null
          id: string
          items: Json
          moneda_iso: Database["public"]["Enums"]["config_moneda"] | null
          monto_estimado: number | null
          notas: string | null
          organizacion_id: string
          pagador_id: string | null
          responsable_id: string
          solicitante_id: string
          sub_tipo:
            | Database["public"]["Enums"]["tr_doc_comercial_subtipo"]
            | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["tr_doc_comercial_tipo"]
          titulo: string | null
          valor_descuento: number
          valor_impuestos: number
          valor_neto: number
          valor_total: number
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          asociado_id?: string | null
          atributos?: Json
          codigo?: string
          creado_en?: string
          creado_por?: string | null
          documento_origen_id?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["tr_doc_comercial_estados"]
          fecha_doc?: string
          fecha_venc_doc?: string | null
          id?: string
          items?: Json
          moneda_iso?: Database["public"]["Enums"]["config_moneda"] | null
          monto_estimado?: number | null
          notas?: string | null
          organizacion_id: string
          pagador_id?: string | null
          responsable_id: string
          solicitante_id: string
          sub_tipo?:
            | Database["public"]["Enums"]["tr_doc_comercial_subtipo"]
            | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["tr_doc_comercial_tipo"]
          titulo?: string | null
          valor_descuento?: number
          valor_impuestos?: number
          valor_neto?: number
          valor_total?: number
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          asociado_id?: string | null
          atributos?: Json
          codigo?: string
          creado_en?: string
          creado_por?: string | null
          documento_origen_id?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["tr_doc_comercial_estados"]
          fecha_doc?: string
          fecha_venc_doc?: string | null
          id?: string
          items?: Json
          moneda_iso?: Database["public"]["Enums"]["config_moneda"] | null
          monto_estimado?: number | null
          notas?: string | null
          organizacion_id?: string
          pagador_id?: string | null
          responsable_id?: string
          solicitante_id?: string
          sub_tipo?:
            | Database["public"]["Enums"]["tr_doc_comercial_subtipo"]
            | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["tr_doc_comercial_tipo"]
          titulo?: string | null
          valor_descuento?: number
          valor_impuestos?: number
          valor_neto?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_oportunidades_asociado"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "v_asociados_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_asociado"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "vn_asociados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_documento_origen"
            columns: ["documento_origen_id"]
            isOneToOne: false
            referencedRelation: "tr_doc_comercial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_documento_origen"
            columns: ["documento_origen_id"]
            isOneToOne: false
            referencedRelation: "v_doc_comercial_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_pagador"
            columns: ["pagador_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_pagador"
            columns: ["pagador_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
        ]
      }
      tr_tareas: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          asignado_a: string
          codigo_tarea: string | null
          creado_en: string
          creado_por: string | null
          descripcion: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["tr_tareas_estado"]
          fecha_vencimiento: string | null
          id: string
          oportunidad_id: string | null
          organizacion_id: string
          prioridad: Database["public"]["Enums"]["tr_tareas_prioridad"]
          relacionado_con_bp: string | null
          tags: string[] | null
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          asignado_a: string
          codigo_tarea?: string | null
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["tr_tareas_estado"]
          fecha_vencimiento?: string | null
          id?: string
          oportunidad_id?: string | null
          organizacion_id: string
          prioridad?: Database["public"]["Enums"]["tr_tareas_prioridad"]
          relacionado_con_bp?: string | null
          tags?: string[] | null
          titulo: string
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          asignado_a?: string
          codigo_tarea?: string | null
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["tr_tareas_estado"]
          fecha_vencimiento?: string | null
          id?: string
          oportunidad_id?: string | null
          organizacion_id?: string
          prioridad?: Database["public"]["Enums"]["tr_tareas_prioridad"]
          relacionado_con_bp?: string | null
          tags?: string[] | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "tr_doc_comercial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "v_doc_comercial_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
        ]
      }
      vn_asociados: {
        Row: {
          accion_id: string
          actualizado_en: string
          actualizado_por: string | null
          asignacion_padre_id: string | null
          asociado_id: string
          atributos: Json | null
          codigo_completo: string
          creado_en: string
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          es_vigente: boolean | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          modalidad:
            | Database["public"]["Enums"]["vn_asociados_modalidad"]
            | null
          notas: string | null
          organizacion_id: string
          plan_comercial:
            | Database["public"]["Enums"]["vn_asociados_plan_comercial"]
            | null
          subcodigo: string
          tipo_vinculo:
            | Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
            | null
        }
        Insert: {
          accion_id: string
          actualizado_en?: string
          actualizado_por?: string | null
          asignacion_padre_id?: string | null
          asociado_id: string
          atributos?: Json | null
          codigo_completo: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_vigente?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          modalidad?:
            | Database["public"]["Enums"]["vn_asociados_modalidad"]
            | null
          notas?: string | null
          organizacion_id: string
          plan_comercial?:
            | Database["public"]["Enums"]["vn_asociados_plan_comercial"]
            | null
          subcodigo: string
          tipo_vinculo?:
            | Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
            | null
        }
        Update: {
          accion_id?: string
          actualizado_en?: string
          actualizado_por?: string | null
          asignacion_padre_id?: string | null
          asociado_id?: string
          atributos?: Json | null
          codigo_completo?: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_vigente?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          modalidad?:
            | Database["public"]["Enums"]["vn_asociados_modalidad"]
            | null
          notas?: string | null
          organizacion_id?: string
          plan_comercial?:
            | Database["public"]["Enums"]["vn_asociados_plan_comercial"]
            | null
          subcodigo?: string
          tipo_vinculo?:
            | Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "dm_acciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "v_acciones_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_asociado_id_fkey"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_asociado_id_fkey"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vn_asociados_asignacion_padre_id_fkey"
            columns: ["asignacion_padre_id"]
            isOneToOne: false
            referencedRelation: "v_asociados_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vn_asociados_asignacion_padre_id_fkey"
            columns: ["asignacion_padre_id"]
            isOneToOne: false
            referencedRelation: "vn_asociados"
            referencedColumns: ["id"]
          },
        ]
      }
      vn_relaciones_actores: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          atributos: Json
          bp_destino_id: string
          bp_origen_id: string
          creado_en: string
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          es_actual: boolean | null
          es_bidireccional: boolean
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          notas: string | null
          organizacion_id: string
          rol_destino: Database["public"]["Enums"]["vn_relacion_actores_rol"]
          rol_origen: Database["public"]["Enums"]["vn_relacion_actores_rol"]
          tipo_relacion: Database["public"]["Enums"]["dm_actores_tipo_relacion"]
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json
          bp_destino_id: string
          bp_origen_id: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_actual?: boolean | null
          es_bidireccional?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          notas?: string | null
          organizacion_id: string
          rol_destino: Database["public"]["Enums"]["vn_relacion_actores_rol"]
          rol_origen: Database["public"]["Enums"]["vn_relacion_actores_rol"]
          tipo_relacion: Database["public"]["Enums"]["dm_actores_tipo_relacion"]
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json
          bp_destino_id?: string
          bp_origen_id?: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_actual?: boolean | null
          es_bidireccional?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          notas?: string | null
          organizacion_id?: string
          rol_destino?: Database["public"]["Enums"]["vn_relacion_actores_rol"]
          rol_origen?: Database["public"]["Enums"]["vn_relacion_actores_rol"]
          tipo_relacion?: Database["public"]["Enums"]["dm_actores_tipo_relacion"]
        }
        Relationships: [
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bp_relaciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_acciones_org: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          codigo_accion: string | null
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["dm_accion_estado"] | null
          id: string | null
          organizacion_id: string | null
          organizacion_nombre: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      v_actores_org: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          ciudad_id: string | null
          codigo_bp: string | null
          creado_en: string | null
          creado_por: string | null
          digito_verificacion: number | null
          direccion_fisica: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          email_facturacion: string | null
          email_principal: string | null
          email_secundario: string | null
          es_cliente: boolean | null
          es_proveedor: boolean | null
          es_socio: boolean | null
          estado_actor: Database["public"]["Enums"]["dm_actor_estado"] | null
          estado_civil:
            | Database["public"]["Enums"]["dm_actor_estado_civil"]
            | null
          fecha_nacimiento: string | null
          genero_actor: Database["public"]["Enums"]["dm_actor_genero"] | null
          id: string | null
          nat_fiscal:
            | Database["public"]["Enums"]["dm_actor_naturaleza_fiscal"]
            | null
          nombre_comercial: string | null
          num_documento: string | null
          organizacion_id: string | null
          perfil_compliance: Json | null
          perfil_contacto: Json | null
          perfil_identidad: Json | null
          perfil_intereses: Json | null
          perfil_preferencias: Json | null
          perfil_profesional_corporativo: Json | null
          perfil_redes: Json | null
          perfil_referencias: Json | null
          perfil_salud: Json | null
          primer_apellido: string | null
          primer_nombre: string | null
          razon_social: string | null
          regimen_tributario:
            | Database["public"]["Enums"]["dm_actor_regimen_tributario"]
            | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          tags: string[] | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_actor: Database["public"]["Enums"]["tipo_actor_enum"] | null
          tipo_documento:
            | Database["public"]["Enums"]["dm_actor_tipo_documento"]
            | null
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          ciudad_id?: string | null
          codigo_bp?: string | null
          creado_en?: string | null
          creado_por?: string | null
          digito_verificacion?: number | null
          direccion_fisica?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_facturacion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          es_cliente?: boolean | null
          es_proveedor?: boolean | null
          es_socio?: boolean | null
          estado_actor?: Database["public"]["Enums"]["dm_actor_estado"] | null
          estado_civil?:
            | Database["public"]["Enums"]["dm_actor_estado_civil"]
            | null
          fecha_nacimiento?: string | null
          genero_actor?: Database["public"]["Enums"]["dm_actor_genero"] | null
          id?: string | null
          nat_fiscal?:
            | Database["public"]["Enums"]["dm_actor_naturaleza_fiscal"]
            | null
          nombre_comercial?: string | null
          num_documento?: string | null
          organizacion_id?: string | null
          perfil_compliance?: Json | null
          perfil_contacto?: Json | null
          perfil_identidad?: Json | null
          perfil_intereses?: Json | null
          perfil_preferencias?: Json | null
          perfil_profesional_corporativo?: Json | null
          perfil_redes?: Json | null
          perfil_referencias?: Json | null
          perfil_salud?: Json | null
          primer_apellido?: string | null
          primer_nombre?: string | null
          razon_social?: string | null
          regimen_tributario?:
            | Database["public"]["Enums"]["dm_actor_regimen_tributario"]
            | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          tags?: string[] | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"] | null
          tipo_documento?:
            | Database["public"]["Enums"]["dm_actor_tipo_documento"]
            | null
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          ciudad_id?: string | null
          codigo_bp?: string | null
          creado_en?: string | null
          creado_por?: string | null
          digito_verificacion?: number | null
          direccion_fisica?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_facturacion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          es_cliente?: boolean | null
          es_proveedor?: boolean | null
          es_socio?: boolean | null
          estado_actor?: Database["public"]["Enums"]["dm_actor_estado"] | null
          estado_civil?:
            | Database["public"]["Enums"]["dm_actor_estado_civil"]
            | null
          fecha_nacimiento?: string | null
          genero_actor?: Database["public"]["Enums"]["dm_actor_genero"] | null
          id?: string | null
          nat_fiscal?:
            | Database["public"]["Enums"]["dm_actor_naturaleza_fiscal"]
            | null
          nombre_comercial?: string | null
          num_documento?: string | null
          organizacion_id?: string | null
          perfil_compliance?: Json | null
          perfil_contacto?: Json | null
          perfil_identidad?: Json | null
          perfil_intereses?: Json | null
          perfil_preferencias?: Json | null
          perfil_profesional_corporativo?: Json | null
          perfil_redes?: Json | null
          perfil_referencias?: Json | null
          perfil_salud?: Json | null
          primer_apellido?: string | null
          primer_nombre?: string | null
          razon_social?: string | null
          regimen_tributario?:
            | Database["public"]["Enums"]["dm_actor_regimen_tributario"]
            | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          tags?: string[] | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"] | null
          tipo_documento?:
            | Database["public"]["Enums"]["dm_actor_tipo_documento"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_actores_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "config_ciudades"
            referencedColumns: ["id"]
          },
        ]
      }
      v_asociados_org: {
        Row: {
          accion_id: string | null
          actualizado_en: string | null
          actualizado_por: string | null
          asignacion_padre_id: string | null
          asociado_id: string | null
          atributos: Json | null
          codigo_completo: string | null
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          es_vigente: boolean | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string | null
          modalidad:
            | Database["public"]["Enums"]["vn_asociados_modalidad"]
            | null
          notas: string | null
          organizacion_id: string | null
          plan_comercial:
            | Database["public"]["Enums"]["vn_asociados_plan_comercial"]
            | null
          subcodigo: string | null
          tipo_vinculo:
            | Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
            | null
        }
        Insert: {
          accion_id?: string | null
          actualizado_en?: string | null
          actualizado_por?: string | null
          asignacion_padre_id?: string | null
          asociado_id?: string | null
          atributos?: Json | null
          codigo_completo?: string | null
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_vigente?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string | null
          modalidad?:
            | Database["public"]["Enums"]["vn_asociados_modalidad"]
            | null
          notas?: string | null
          organizacion_id?: string | null
          plan_comercial?:
            | Database["public"]["Enums"]["vn_asociados_plan_comercial"]
            | null
          subcodigo?: string | null
          tipo_vinculo?:
            | Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
            | null
        }
        Update: {
          accion_id?: string | null
          actualizado_en?: string | null
          actualizado_por?: string | null
          asignacion_padre_id?: string | null
          asociado_id?: string | null
          atributos?: Json | null
          codigo_completo?: string | null
          creado_en?: string | null
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_vigente?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string | null
          modalidad?:
            | Database["public"]["Enums"]["vn_asociados_modalidad"]
            | null
          notas?: string | null
          organizacion_id?: string | null
          plan_comercial?:
            | Database["public"]["Enums"]["vn_asociados_plan_comercial"]
            | null
          subcodigo?: string | null
          tipo_vinculo?:
            | Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "dm_acciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "v_acciones_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_asociado_id_fkey"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_asociado_id_fkey"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vn_asociados_asignacion_padre_id_fkey"
            columns: ["asignacion_padre_id"]
            isOneToOne: false
            referencedRelation: "v_asociados_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vn_asociados_asignacion_padre_id_fkey"
            columns: ["asignacion_padre_id"]
            isOneToOne: false
            referencedRelation: "vn_asociados"
            referencedColumns: ["id"]
          },
        ]
      }
      v_doc_comercial_org: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          asociado_id: string | null
          atributos: Json | null
          codigo: string | null
          creado_en: string | null
          creado_por: string | null
          documento_origen_id: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["tr_doc_comercial_estados"] | null
          fecha_doc: string | null
          fecha_venc_doc: string | null
          id: string | null
          items: Json | null
          moneda_iso: Database["public"]["Enums"]["config_moneda"] | null
          monto_estimado: number | null
          notas: string | null
          organizacion_id: string | null
          pagador_id: string | null
          pagador_nombre: string | null
          responsable_id: string | null
          responsable_nombre: string | null
          solicitante_id: string | null
          solicitante_nombre: string | null
          sub_tipo:
            | Database["public"]["Enums"]["tr_doc_comercial_subtipo"]
            | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["tr_doc_comercial_tipo"] | null
          titulo: string | null
          valor_descuento: number | null
          valor_impuestos: number | null
          valor_neto: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_oportunidades_asociado"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "v_asociados_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_asociado"
            columns: ["asociado_id"]
            isOneToOne: false
            referencedRelation: "vn_asociados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_documento_origen"
            columns: ["documento_origen_id"]
            isOneToOne: false
            referencedRelation: "tr_doc_comercial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_documento_origen"
            columns: ["documento_origen_id"]
            isOneToOne: false
            referencedRelation: "v_doc_comercial_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_pagador"
            columns: ["pagador_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oportunidades_pagador"
            columns: ["pagador_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tareas_org: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          asignado_a: string | null
          codigo_tarea: string | null
          creado_en: string | null
          creado_por: string | null
          descripcion: string | null
          eliminado_en: string | null
          estado: Database["public"]["Enums"]["tr_tareas_estado"] | null
          fecha_vencimiento: string | null
          id: string | null
          oportunidad_codigo: string | null
          oportunidad_id: string | null
          oportunidad_tipo:
            | Database["public"]["Enums"]["tr_doc_comercial_tipo"]
            | null
          organizacion_id: string | null
          prioridad: Database["public"]["Enums"]["tr_tareas_prioridad"] | null
          relacionado_bp_codigo: string | null
          relacionado_bp_tipo:
            | Database["public"]["Enums"]["tipo_actor_enum"]
            | null
          relacionado_con_bp: string | null
          relacionado_nit: string | null
          relacionado_numero_documento: string | null
          relacionado_primer_apellido: string | null
          relacionado_primer_nombre: string | null
          relacionado_razon_social: string | null
          tags: string[] | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "tr_doc_comercial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "v_doc_comercial_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "config_organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "dm_actores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_actores_org"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _policy_exists: {
        Args: { pol_name: string; tbl: unknown }
        Returns: boolean
      }
      calcular_digito_verificacion_nit: {
        Args: { nit: string }
        Returns: number
      }
      can_user_v2: {
        Args: { p_action: string; p_org: string; p_resource: string }
        Returns: boolean
      }
      can_view_org_membership_v2: { Args: { p_org: string }; Returns: boolean }
      dm_actores_documento_existe: {
        Args: {
          p_excluir_id?: string
          p_num_documento: string
          p_organizacion_id: string
          p_tipo_documento: Database["public"]["Enums"]["dm_actor_tipo_documento"]
        }
        Returns: {
          actor_id: string
          codigo_bp: string
          doc_exists: boolean
          nombre_completo: string
        }[]
      }
      dm_actores_email_existe: {
        Args: {
          p_email: string
          p_excluir_id?: string
          p_organizacion_id: string
        }
        Returns: {
          actor_id: string
          codigo_bp: string
          email_encontrado: string
          email_exists: boolean
          nombre_completo: string
        }[]
      }
      dm_actores_telefono_existe: {
        Args: {
          p_excluir_id?: string
          p_organizacion_id: string
          p_telefono: string
        }
        Returns: {
          actor_id: string
          codigo_bp: string
          nombre_completo: string
          phone_exists: boolean
          telefono_encontrado: string
        }[]
      }
      generar_siguiente_subcodigo: {
        Args: { p_accion_id: string; p_tipo_asignacion: string }
        Returns: string
      }
      get_enum_values: { Args: { p_enum_name: string }; Returns: string[] }
      get_user_email: { Args: { user_id: string }; Returns: string }
      get_user_orgs: { Args: never; Returns: string[] }
      is_org_admin_v2: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_org_owner_v2: { Args: { org_id: string }; Returns: boolean }
      org_has_other_owner_v2: {
        Args: { p_excluded_user_id?: string; p_org_id: string }
        Returns: boolean
      }
      rpc_accion_disponibilidad: {
        Args: { p_accion_id: string; p_organizacion_id: string }
        Returns: Json
      }
      search_locations: {
        Args: { max_results?: number; q: string }
        Returns: {
          actualizado_en: string | null
          actualizado_por: string | null
          city_code: string | null
          city_name: string
          country_code: string
          country_name: string
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          id: string
          search_text: string
          state_name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "config_ciudades"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      soft_delete_actor: { Args: { p_actor_id: string }; Returns: Json }
      unaccent: { Args: { "": string }; Returns: string }
      unaccent_lower: { Args: { "": string }; Returns: string }
      user_role_in_org_v2: { Args: { p_org: string }; Returns: string }
      vn_asociados_crear_asignacion: {
        Args: {
          p_accion_id: string
          p_asignacion_padre_id?: string
          p_asociado_id: string
          p_atributos?: Json
          p_modalidad: Database["public"]["Enums"]["vn_asociados_modalidad"]
          p_notas?: string
          p_organizacion_id: string
          p_plan_comercial: Database["public"]["Enums"]["vn_asociados_plan_comercial"]
          p_tipo_vinculo: Database["public"]["Enums"]["vn_asociados_tipo_vinculo"]
        }
        Returns: Json
      }
      vn_asociados_finalizar_asignacion: {
        Args: { p_asignacion_id: string; p_motivo?: string }
        Returns: Json
      }
      vn_asociados_validar_accion: {
        Args: { p_accion_id: string }
        Returns: Json
      }
      vn_asociados_validar_asociado: {
        Args: { p_asociado_id: string }
        Returns: Json
      }
    }
    Enums: {
      config_moneda:
        | "COP"
        | "MXN"
        | "ARS"
        | "BRL"
        | "CLP"
        | "PEN"
        | "USD"
        | "EUR"
        | "GBP"
        | "CAD"
        | "JPY"
        | "CHF"
        | "AUD"
        | "NZD"
        | "CNY"
        | "INR"
        | "KRW"
        | "SGD"
        | "HKD"
        | "SEK"
        | "NOK"
        | "DKK"
        | "PLN"
        | "TRY"
        | "ZAR"
        | "RUB"
        | "AED"
        | "SAR"
        | "ILS"
        | "CZK"
        | "HUF"
        | "RON"
        | "BGN"
        | "HRK"
        | "MYR"
        | "THB"
        | "IDR"
        | "PHP"
        | "VND"
        | "TWD"
        | "ISK"
      config_organizacion_tipo:
        | "club"
        | "asociacion"
        | "federacion"
        | "fundacion"
        | "otro"
      dm_accion_estado:
        | "disponible"
        | "asignada"
        | "arrendada"
        | "bloqueada"
        | "inactiva"
      dm_actor_estado: "activo" | "inactivo" | "bloqueado"
      dm_actor_estado_civil:
        | "soltero"
        | "casado"
        | "union libre"
        | "divorciado"
        | "viudo"
      dm_actor_genero: "masculino" | "femenino" | "otro" | "no aplica"
      dm_actor_naturaleza_fiscal: "natural" | "jurídica"
      dm_actor_regimen_tributario:
        | "responsable de iva"
        | "no responsable de iva"
        | "regimen simple tributacion"
        | "gran contribuyente"
        | "no sujeta a impuesto"
      dm_actor_tipo_documento:
        | "CC"
        | "CE"
        | "PA"
        | "TI"
        | "RC"
        | "PEP"
        | "PPT"
        | "NIT"
      dm_actores_nivel_educacion:
        | "sin estudios"
        | "primaria"
        | "bachillerato"
        | "técnica"
        | "profesional"
        | "especialización"
        | "maestría"
        | "doctorado"
      dm_actores_tipo_relacion:
        | "familiar"
        | "laboral"
        | "referencia"
        | "membresía"
        | "comercial"
        | "otra"
      tipo_actor_enum: "persona" | "empresa"
      tr_doc_comercial_estados:
        | "Nueva"
        | "En Progreso"
        | "Ganada"
        | "Pérdida"
        | "Descartada"
      tr_doc_comercial_subtipo:
        | "sol_ingreso"
        | "sol_retiro"
        | "oferta_eventos"
        | "pedido_eventos"
      tr_doc_comercial_tipo:
        | "oportunidad"
        | "oferta"
        | "pedido_venta"
        | "reserva"
      tr_tareas_estado:
        | "Pendiente"
        | "En Progreso"
        | "Terminada"
        | "Pausada"
        | "Cancelada"
      tr_tareas_prioridad: "Baja" | "Media" | "Alta" | "Urgente"
      vn_asociados_modalidad:
        | "propiedad"
        | "comodato"
        | "asignacion_corp"
        | "convenio"
      vn_asociados_plan_comercial:
        | "regular"
        | "plan dorado"
        | "joven ejecutivo"
        | "honorifico"
      vn_asociados_tipo_vinculo:
        | "propietario"
        | "titular"
        | "beneficiario"
        | "intermediario"
      vn_relacion_actores_rol:
        | "cónyuge"
        | "padre"
        | "madre"
        | "hijo/a"
        | "suegro"
        | "suegra"
        | "hermano/a"
        | "otro"
        | "yerno"
        | "nuera"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      config_moneda: [
        "COP",
        "MXN",
        "ARS",
        "BRL",
        "CLP",
        "PEN",
        "USD",
        "EUR",
        "GBP",
        "CAD",
        "JPY",
        "CHF",
        "AUD",
        "NZD",
        "CNY",
        "INR",
        "KRW",
        "SGD",
        "HKD",
        "SEK",
        "NOK",
        "DKK",
        "PLN",
        "TRY",
        "ZAR",
        "RUB",
        "AED",
        "SAR",
        "ILS",
        "CZK",
        "HUF",
        "RON",
        "BGN",
        "HRK",
        "MYR",
        "THB",
        "IDR",
        "PHP",
        "VND",
        "TWD",
        "ISK",
      ],
      config_organizacion_tipo: [
        "club",
        "asociacion",
        "federacion",
        "fundacion",
        "otro",
      ],
      dm_accion_estado: [
        "disponible",
        "asignada",
        "arrendada",
        "bloqueada",
        "inactiva",
      ],
      dm_actor_estado: ["activo", "inactivo", "bloqueado"],
      dm_actor_estado_civil: [
        "soltero",
        "casado",
        "union libre",
        "divorciado",
        "viudo",
      ],
      dm_actor_genero: ["masculino", "femenino", "otro", "no aplica"],
      dm_actor_naturaleza_fiscal: ["natural", "jurídica"],
      dm_actor_regimen_tributario: [
        "responsable de iva",
        "no responsable de iva",
        "regimen simple tributacion",
        "gran contribuyente",
        "no sujeta a impuesto",
      ],
      dm_actor_tipo_documento: [
        "CC",
        "CE",
        "PA",
        "TI",
        "RC",
        "PEP",
        "PPT",
        "NIT",
      ],
      dm_actores_nivel_educacion: [
        "sin estudios",
        "primaria",
        "bachillerato",
        "técnica",
        "profesional",
        "especialización",
        "maestría",
        "doctorado",
      ],
      dm_actores_tipo_relacion: [
        "familiar",
        "laboral",
        "referencia",
        "membresía",
        "comercial",
        "otra",
      ],
      tipo_actor_enum: ["persona", "empresa"],
      tr_doc_comercial_estados: [
        "Nueva",
        "En Progreso",
        "Ganada",
        "Pérdida",
        "Descartada",
      ],
      tr_doc_comercial_subtipo: [
        "sol_ingreso",
        "sol_retiro",
        "oferta_eventos",
        "pedido_eventos",
      ],
      tr_doc_comercial_tipo: [
        "oportunidad",
        "oferta",
        "pedido_venta",
        "reserva",
      ],
      tr_tareas_estado: [
        "Pendiente",
        "En Progreso",
        "Terminada",
        "Pausada",
        "Cancelada",
      ],
      tr_tareas_prioridad: ["Baja", "Media", "Alta", "Urgente"],
      vn_asociados_modalidad: [
        "propiedad",
        "comodato",
        "asignacion_corp",
        "convenio",
      ],
      vn_asociados_plan_comercial: [
        "regular",
        "plan dorado",
        "joven ejecutivo",
        "honorifico",
      ],
      vn_asociados_tipo_vinculo: [
        "propietario",
        "titular",
        "beneficiario",
        "intermediario",
      ],
      vn_relacion_actores_rol: [
        "cónyuge",
        "padre",
        "madre",
        "hijo/a",
        "suegro",
        "suegra",
        "hermano/a",
        "otro",
        "yerno",
        "nuera",
      ],
    },
  },
} as const
