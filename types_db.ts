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
  public: {
    Tables: {
      acciones: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          codigo_accion: string
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: string
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
          estado?: string
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
          estado?: string
          id?: string
          organizacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asignaciones_acciones: {
        Row: {
          accion_id: string
          actualizado_en: string
          actualizado_por: string | null
          atributos: Json | null
          business_partner_id: string
          codigo_completo: string
          creado_en: string
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          es_vigente: boolean | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          notas: string | null
          organizacion_id: string
          precio_transaccion: number | null
          subcodigo: string
          subtipo_beneficiario: string | null
          tipo_asignacion: string
        }
        Insert: {
          accion_id: string
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json | null
          business_partner_id: string
          codigo_completo: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_vigente?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          organizacion_id: string
          precio_transaccion?: number | null
          subcodigo: string
          subtipo_beneficiario?: string | null
          tipo_asignacion: string
        }
        Update: {
          accion_id?: string
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json | null
          business_partner_id?: string
          codigo_completo?: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          es_vigente?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          organizacion_id?: string
          precio_transaccion?: number | null
          subcodigo?: string
          subtipo_beneficiario?: string | null
          tipo_asignacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "acciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "v_acciones_asignadas"
            referencedColumns: ["accion_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["accion_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_accion_id_fkey"
            columns: ["accion_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["accion_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "asignaciones_acciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bp_relaciones: {
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
          rol_destino: string
          rol_origen: string
          tipo_relacion: Database["public"]["Enums"]["tipo_relacion_bp"]
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
          rol_destino: string
          rol_origen: string
          tipo_relacion: Database["public"]["Enums"]["tipo_relacion_bp"]
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
          rol_destino?: string
          rol_origen?: string
          tipo_relacion?: Database["public"]["Enums"]["tipo_relacion_bp"]
        }
        Relationships: [
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_destino_id_fkey"
            columns: ["bp_destino_id"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "bp_relaciones_bp_origen_id_fkey"
            columns: ["bp_origen_id"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "bp_relaciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_partners: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          codigo_bp: string
          creado_en: string
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          email_principal: string | null
          estado: string
          id: string
          organizacion_id: string
          telefono_principal: string | null
          tipo_actor: string
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          codigo_bp: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_principal?: string | null
          estado?: string
          id?: string
          organizacion_id: string
          telefono_principal?: string | null
          tipo_actor: string
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          codigo_bp?: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_principal?: string | null
          estado?: string
          id?: string
          organizacion_id?: string
          telefono_principal?: string | null
          tipo_actor?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          actividad_economica: string | null
          actualizado_en: string
          actualizado_por: string | null
          atributos: Json | null
          cargo_representante: string | null
          ciudad_constitucion: string | null
          codigo_ciiu: string | null
          creado_en: string
          creado_por: string | null
          digito_verificacion: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          email_secundario: string | null
          facebook_url: string | null
          fecha_constitucion: string | null
          id: string
          ingresos_anuales: number | null
          instagram_handle: string | null
          linkedin_url: string | null
          logo_url: string | null
          nit: string
          nombre_comercial: string | null
          numero_empleados: number | null
          numero_registro: string | null
          pais_constitucion: string | null
          razon_social: string
          representante_legal_id: string | null
          sector_industria: string | null
          tamano_empresa: string | null
          telefono_secundario: string | null
          tipo_sociedad: string
          twitter_handle: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          actividad_economica?: string | null
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json | null
          cargo_representante?: string | null
          ciudad_constitucion?: string | null
          codigo_ciiu?: string | null
          creado_en?: string
          creado_por?: string | null
          digito_verificacion?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_secundario?: string | null
          facebook_url?: string | null
          fecha_constitucion?: string | null
          id: string
          ingresos_anuales?: number | null
          instagram_handle?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          nit: string
          nombre_comercial?: string | null
          numero_empleados?: number | null
          numero_registro?: string | null
          pais_constitucion?: string | null
          razon_social: string
          representante_legal_id?: string | null
          sector_industria?: string | null
          tamano_empresa?: string | null
          telefono_secundario?: string | null
          tipo_sociedad: string
          twitter_handle?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          actividad_economica?: string | null
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json | null
          cargo_representante?: string | null
          ciudad_constitucion?: string | null
          codigo_ciiu?: string | null
          creado_en?: string
          creado_por?: string | null
          digito_verificacion?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_secundario?: string | null
          facebook_url?: string | null
          fecha_constitucion?: string | null
          id?: string
          ingresos_anuales?: number | null
          instagram_handle?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          nit?: string
          nombre_comercial?: string | null
          numero_empleados?: number | null
          numero_registro?: string | null
          pais_constitucion?: string | null
          razon_social?: string
          representante_legal_id?: string | null
          sector_industria?: string | null
          tamano_empresa?: string | null
          telefono_secundario?: string | null
          tipo_sociedad?: string
          twitter_handle?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "empresas_representante_legal_id_fkey"
            columns: ["representante_legal_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_representante_legal_id_fkey"
            columns: ["representante_legal_id"]
            isOneToOne: false
            referencedRelation: "v_personas_completa"
            referencedColumns: ["id"]
          },
        ]
      }
      geographic_locations: {
        Row: {
          city_code: string | null
          city_name: string
          country_code: string
          country_name: string
          id: string
          search_text: string
          state_name: string
        }
        Insert: {
          city_code?: string | null
          city_name: string
          country_code: string
          country_name: string
          id?: string
          search_text: string
          state_name: string
        }
        Update: {
          city_code?: string | null
          city_name?: string
          country_code?: string
          country_name?: string
          id?: string
          search_text?: string
          state_name?: string
        }
        Relationships: []
      }
      oportunidades: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          atributos: Json
          codigo: string
          creado_en: string
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["estado_oportunidad_enum"]
          fecha_solicitud: string
          id: string
          monto_estimado: number | null
          notas: string | null
          organizacion_id: string
          responsable_id: string
          solicitante_id: string
          tipo: Database["public"]["Enums"]["tipo_oportunidad_enum"]
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json
          codigo: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_oportunidad_enum"]
          fecha_solicitud?: string
          id?: string
          monto_estimado?: number | null
          notas?: string | null
          organizacion_id: string
          responsable_id: string
          solicitante_id: string
          tipo: Database["public"]["Enums"]["tipo_oportunidad_enum"]
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          atributos?: Json
          codigo?: string
          creado_en?: string
          creado_por?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_oportunidad_enum"]
          fecha_solicitud?: string
          id?: string
          monto_estimado?: number | null
          notas?: string | null
          organizacion_id?: string
          responsable_id?: string
          solicitante_id?: string
          tipo?: Database["public"]["Enums"]["tipo_oportunidad_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          created_by: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
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
          tipo: string | null
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
          tipo?: string | null
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
          tipo?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_organizacion_padre_id_fkey"
            columns: ["organizacion_padre_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          barrio_residencia: string | null
          ciudad_residencia: string | null
          contacto_emergencia_id: string | null
          creado_en: string
          creado_por: string | null
          direccion_residencia: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          email_secundario: string | null
          eps: string | null
          estado_civil: string | null
          estado_vital: string | null
          facebook_url: string | null
          fecha_aniversario: string | null
          fecha_expedicion: string | null
          fecha_nacimiento: string
          fecha_socio: string | null
          foto_url: string | null
          genero: string
          id: string
          instagram_handle: string | null
          linkedin_url: string | null
          lugar_expedicion: string | null
          lugar_nacimiento: string | null
          nacionalidad: string | null
          nivel_educacion: string | null
          numero_documento: string
          ocupacion: string | null
          perfil_compliance: Json | null
          perfil_intereses: Json | null
          perfil_metricas: Json | null
          perfil_preferencias: Json | null
          primer_apellido: string
          primer_nombre: string
          profesion: string | null
          relacion_emergencia: string | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          tags: string[] | null
          telefono_secundario: string | null
          tipo_documento: string
          tipo_sangre: string | null
          twitter_handle: string | null
          whatsapp: string | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          barrio_residencia?: string | null
          ciudad_residencia?: string | null
          contacto_emergencia_id?: string | null
          creado_en?: string
          creado_por?: string | null
          direccion_residencia?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_secundario?: string | null
          eps?: string | null
          estado_civil?: string | null
          estado_vital?: string | null
          facebook_url?: string | null
          fecha_aniversario?: string | null
          fecha_expedicion?: string | null
          fecha_nacimiento: string
          fecha_socio?: string | null
          foto_url?: string | null
          genero: string
          id: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          lugar_expedicion?: string | null
          lugar_nacimiento?: string | null
          nacionalidad?: string | null
          nivel_educacion?: string | null
          numero_documento: string
          ocupacion?: string | null
          perfil_compliance?: Json | null
          perfil_intereses?: Json | null
          perfil_metricas?: Json | null
          perfil_preferencias?: Json | null
          primer_apellido: string
          primer_nombre: string
          profesion?: string | null
          relacion_emergencia?: string | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          tags?: string[] | null
          telefono_secundario?: string | null
          tipo_documento: string
          tipo_sangre?: string | null
          twitter_handle?: string | null
          whatsapp?: string | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          barrio_residencia?: string | null
          ciudad_residencia?: string | null
          contacto_emergencia_id?: string | null
          creado_en?: string
          creado_por?: string | null
          direccion_residencia?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          email_secundario?: string | null
          eps?: string | null
          estado_civil?: string | null
          estado_vital?: string | null
          facebook_url?: string | null
          fecha_aniversario?: string | null
          fecha_expedicion?: string | null
          fecha_nacimiento?: string
          fecha_socio?: string | null
          foto_url?: string | null
          genero?: string
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          lugar_expedicion?: string | null
          lugar_nacimiento?: string | null
          nacionalidad?: string | null
          nivel_educacion?: string | null
          numero_documento?: string
          ocupacion?: string | null
          perfil_compliance?: Json | null
          perfil_intereses?: Json | null
          perfil_metricas?: Json | null
          perfil_preferencias?: Json | null
          primer_apellido?: string
          primer_nombre?: string
          profesion?: string | null
          relacion_emergencia?: string | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          tags?: string[] | null
          telefono_secundario?: string | null
          tipo_documento?: string
          tipo_sangre?: string | null
          twitter_handle?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_contacto_emergencia_id_fkey"
            columns: ["contacto_emergencia_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_contacto_emergencia_id_fkey"
            columns: ["contacto_emergencia_id"]
            isOneToOne: false
            referencedRelation: "v_personas_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          allow: boolean
          resource: string
          role: string
        }
        Insert: {
          action: string
          allow?: boolean
          resource: string
          role: string
        }
        Update: {
          action?: string
          allow?: boolean
          resource?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role"]
          },
        ]
      }
      roles: {
        Row: {
          role: string
        }
        Insert: {
          role: string
        }
        Update: {
          role?: string
        }
        Relationships: []
      }
      tareas: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          asignado_a: string
          creado_en: string
          creado_por: string | null
          descripcion: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["estado_tarea_enum"]
          fecha_vencimiento: string | null
          id: string
          oportunidad_id: string | null
          organizacion_id: string
          prioridad: Database["public"]["Enums"]["prioridad_tarea_enum"]
          relacionado_con_bp: string | null
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          asignado_a: string
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea_enum"]
          fecha_vencimiento?: string | null
          id?: string
          oportunidad_id?: string | null
          organizacion_id: string
          prioridad?: Database["public"]["Enums"]["prioridad_tarea_enum"]
          relacionado_con_bp?: string | null
          titulo: string
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          asignado_a?: string
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          eliminado_en?: string | null
          eliminado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea_enum"]
          fecha_vencimiento?: string | null
          id?: string
          oportunidad_id?: string | null
          organizacion_id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_tarea_enum"]
          relacionado_con_bp?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
        ]
      }
    }
    Views: {
      oportunidades_view: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          atributos: Json | null
          codigo: string | null
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["estado_oportunidad_enum"] | null
          fecha_solicitud: string | null
          id: string | null
          monto_estimado: number | null
          notas: string | null
          organizacion_id: string | null
          organizacion_nombre: string | null
          responsable_email: string | null
          responsable_id: string | null
          solicitante_codigo_bp: string | null
          solicitante_id: string | null
          solicitante_nombre: string | null
          tipo: Database["public"]["Enums"]["tipo_oportunidad_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "oportunidades_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
        ]
      }
      tareas_view: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          asignado_a: string | null
          asignado_email: string | null
          creado_en: string | null
          creado_por: string | null
          descripcion: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          estado: Database["public"]["Enums"]["estado_tarea_enum"] | null
          fecha_vencimiento: string | null
          id: string | null
          oportunidad_codigo: string | null
          oportunidad_estado:
            | Database["public"]["Enums"]["estado_oportunidad_enum"]
            | null
          oportunidad_id: string | null
          organizacion_id: string | null
          organizacion_nombre: string | null
          prioridad: Database["public"]["Enums"]["prioridad_tarea_enum"] | null
          relacionado_codigo_bp: string | null
          relacionado_con_bp: string | null
          relacionado_nombre: string | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "tareas_relacionado_con_bp_fkey"
            columns: ["relacionado_con_bp"]
            isOneToOne: false
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
        ]
      }
      v_acciones_asignadas: {
        Row: {
          accion_estado: string | null
          accion_id: string | null
          beneficiarios_codigos: string[] | null
          beneficiarios_nombres: string[] | null
          codigo_accion: string | null
          dueno_codigo: string | null
          dueno_nombre: string | null
          dueno_tipo: string | null
          titular_codigo: string | null
          titular_nombre: string | null
          total_beneficiarios: number | null
        }
        Relationships: []
      }
      v_actores_unificados: {
        Row: {
          codigo: string | null
          creado_en: string | null
          eliminado_en: string | null
          email_principal: string | null
          estado: string | null
          id: string | null
          identificacion: string | null
          nombre: string | null
          organizacion_id: string | null
          tags: string[] | null
          telefono_principal: string | null
          tipo_actor: string | null
          tipo_identificacion: string | null
        }
        Relationships: []
      }
      v_asignaciones_historial: {
        Row: {
          accion_estado: string | null
          accion_id: string | null
          actualizado_en: string | null
          actualizado_por: string | null
          asignacion_id: string | null
          bp_documento: string | null
          bp_id: string | null
          bp_nombre: string | null
          bp_tipo: string | null
          codigo_accion: string | null
          codigo_bp: string | null
          codigo_completo: string | null
          creado_en: string | null
          creado_por: string | null
          eliminado_en: string | null
          eliminado_por: string | null
          es_vigente: boolean | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          notas: string | null
          precio_transaccion: number | null
          subcodigo: string | null
          subtipo_beneficiario: string | null
          tipo_asignacion: string | null
        }
        Relationships: []
      }
      v_asignaciones_vigentes: {
        Row: {
          accion_estado: string | null
          accion_id: string | null
          actualizado_en: string | null
          actualizado_por: string | null
          asignacion_id: string | null
          bp_documento: string | null
          bp_email: string | null
          bp_id: string | null
          bp_nombre: string | null
          bp_telefono: string | null
          bp_tipo: string | null
          bp_tipo_documento: string | null
          codigo_accion: string | null
          codigo_bp: string | null
          codigo_completo: string | null
          creado_en: string | null
          creado_por: string | null
          fecha_inicio: string | null
          notas: string | null
          precio_transaccion: number | null
          subcodigo: string | null
          subtipo_beneficiario: string | null
          tipo_asignacion: string | null
        }
        Relationships: []
      }
      v_empresas_completa: {
        Row: {
          actividad_economica: string | null
          actualizado_en: string | null
          bp_actualizado_en: string | null
          bp_creado_en: string | null
          bp_eliminado_en: string | null
          cargo_representante: string | null
          ciudad_constitucion: string | null
          codigo: string | null
          codigo_ciiu: string | null
          creado_en: string | null
          digito_verificacion: string | null
          email_principal: string | null
          estado: string | null
          facebook_url: string | null
          fecha_constitucion: string | null
          id: string | null
          ingresos_anuales: number | null
          instagram_handle: string | null
          linkedin_url: string | null
          logo_url: string | null
          nit: string | null
          nit_completo: string | null
          nombre_comercial: string | null
          nombre_representante_legal: string | null
          numero_empleados: number | null
          numero_registro: string | null
          organizacion_id: string | null
          organizacion_nombre: string | null
          pais_constitucion: string | null
          razon_social: string | null
          representante_legal_id: string | null
          sector_industria: string | null
          tamano_empresa: string | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_actor: string | null
          tipo_sociedad: string | null
          twitter_handle: string | null
          website: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "empresas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "empresas_representante_legal_id_fkey"
            columns: ["representante_legal_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_representante_legal_id_fkey"
            columns: ["representante_legal_id"]
            isOneToOne: false
            referencedRelation: "v_personas_completa"
            referencedColumns: ["id"]
          },
        ]
      }
      v_empresas_org: {
        Row: {
          actividad_economica: string | null
          actualizado_en: string | null
          atributos: Json | null
          business_partner_id: string | null
          cargo_representante: string | null
          ciudad_constitucion: string | null
          codigo_bp: string | null
          codigo_ciiu: string | null
          creado_en: string | null
          email_principal: string | null
          estado: string | null
          facebook_url: string | null
          fecha_constitucion: string | null
          ingresos_anuales: number | null
          instagram_handle: string | null
          linkedin_url: string | null
          logo_url: string | null
          nit: string | null
          nombre_comercial: string | null
          numero_empleados: number | null
          numero_registro: string | null
          organizacion_id: string | null
          pais_constitucion: string | null
          razon_social: string | null
          representante_legal_id: string | null
          sector_industria: string | null
          tamano_empresa: string | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_sociedad: string | null
          twitter_handle: string | null
          website: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_representante_legal_id_fkey"
            columns: ["representante_legal_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_representante_legal_id_fkey"
            columns: ["representante_legal_id"]
            isOneToOne: false
            referencedRelation: "v_personas_completa"
            referencedColumns: ["id"]
          },
        ]
      }
      v_personas_completa: {
        Row: {
          actualizado_en: string | null
          bp_actualizado_en: string | null
          bp_creado_en: string | null
          bp_eliminado_en: string | null
          codigo: string | null
          contacto_emergencia_id: string | null
          creado_en: string | null
          email_principal: string | null
          email_secundario: string | null
          eps: string | null
          estado: string | null
          estado_civil: string | null
          estado_vital: string | null
          facebook_url: string | null
          fecha_aniversario: string | null
          fecha_expedicion: string | null
          fecha_nacimiento: string | null
          fecha_socio: string | null
          foto_url: string | null
          genero: string | null
          id: string | null
          instagram_handle: string | null
          linkedin_url: string | null
          lugar_expedicion: string | null
          lugar_nacimiento: string | null
          nacionalidad: string | null
          nivel_educacion: string | null
          nombre_completo: string | null
          nombre_contacto_emergencia: string | null
          numero_documento: string | null
          ocupacion: string | null
          organizacion_id: string | null
          organizacion_nombre: string | null
          perfil_compliance: Json | null
          perfil_intereses: Json | null
          perfil_metricas: Json | null
          perfil_preferencias: Json | null
          primer_apellido: string | null
          primer_nombre: string | null
          profesion: string | null
          relacion_emergencia: string | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          tags: string[] | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_actor: string | null
          tipo_documento: string | null
          tipo_sangre: string | null
          twitter_handle: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_contacto_emergencia_id_fkey"
            columns: ["contacto_emergencia_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_contacto_emergencia_id_fkey"
            columns: ["contacto_emergencia_id"]
            isOneToOne: false
            referencedRelation: "v_personas_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_historial"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_asignaciones_vigentes"
            referencedColumns: ["bp_id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_empresas_org"
            referencedColumns: ["business_partner_id"]
          },
          {
            foreignKeyName: "personas_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_personas_org"
            referencedColumns: ["business_partner_id"]
          },
        ]
      }
      v_personas_org: {
        Row: {
          actualizado_en: string | null
          business_partner_id: string | null
          codigo_bp: string | null
          creado_en: string | null
          email_principal: string | null
          email_secundario: string | null
          estado: string | null
          estado_vital: string | null
          facebook_url: string | null
          fecha_nacimiento: string | null
          fecha_socio: string | null
          foto_url: string | null
          genero: string | null
          instagram_handle: string | null
          linkedin_url: string | null
          nacionalidad: string | null
          nivel_educacion: string | null
          numero_documento: string | null
          ocupacion: string | null
          organizacion_id: string | null
          perfil_compliance: Json | null
          perfil_intereses: Json | null
          perfil_metricas: Json | null
          perfil_preferencias: Json | null
          primer_apellido: string | null
          primer_nombre: string | null
          profesion: string | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          tags: string[] | null
          telefono_principal: string | null
          telefono_secundario: string | null
          tipo_documento: string | null
          twitter_handle: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      actualizar_relacion_bp: {
        Args: {
          p_atributos?: Json
          p_es_bidireccional?: boolean
          p_fecha_fin?: string
          p_notas?: string
          p_relacion_id: string
          p_rol_destino?: string
          p_rol_origen?: string
        }
        Returns: Json
      }
      calcular_digito_verificacion_nit: {
        Args: { nit: string }
        Returns: number
      }
      can_user: {
        Args: { action: string; org_id: string; resource: string }
        Returns: boolean
      }
      can_user_v2: {
        Args: { p_action: string; p_org: string; p_resource: string }
        Returns: boolean
      }
      can_view_org_membership: { Args: { org_id: string }; Returns: boolean }
      can_view_org_membership_v2: { Args: { p_org: string }; Returns: boolean }
      crear_asignacion_accion: {
        Args: {
          p_accion_id: string
          p_business_partner_id: string
          p_fecha_inicio?: string
          p_notas?: string
          p_precio_transaccion?: number
          p_subtipo_beneficiario?: string
          p_tipo_asignacion: string
        }
        Returns: Json
      }
      crear_empresa: {
        Args: {
          p_actividad_economica?: string
          p_ciudad_constitucion?: string
          p_email_principal?: string
          p_email_secundario?: string
          p_fecha_constitucion?: string
          p_nit: string
          p_nombre_comercial?: string
          p_organizacion_id: string
          p_razon_social: string
          p_representante_legal_id?: string
          p_sector_industria?: string
          p_tamano_empresa?: string
          p_telefono_principal?: string
          p_telefono_secundario?: string
          p_tipo_sociedad: string
          p_website?: string
          p_whatsapp?: string
        }
        Returns: Json
      }
      crear_persona: {
        Args: {
          p_contacto_emergencia_id?: string
          p_email_principal?: string
          p_email_secundario?: string
          p_eps?: string
          p_estado_civil?: string
          p_facebook_url?: string
          p_fecha_aniversario?: string
          p_fecha_expedicion?: string
          p_fecha_nacimiento: string
          p_fecha_socio?: string
          p_foto_url?: string
          p_genero: string
          p_instagram_handle?: string
          p_linkedin_url?: string
          p_lugar_expedicion?: string
          p_lugar_nacimiento?: string
          p_nacionalidad?: string
          p_nivel_educacion?: string
          p_numero_documento: string
          p_ocupacion?: string
          p_organizacion_id: string
          p_perfil_compliance?: Json
          p_perfil_intereses?: Json
          p_perfil_metricas?: Json
          p_perfil_preferencias?: Json
          p_primer_apellido: string
          p_primer_nombre: string
          p_profesion?: string
          p_relacion_emergencia?: string
          p_segundo_apellido?: string
          p_segundo_nombre?: string
          p_tags?: string[]
          p_telefono_principal?: string
          p_telefono_secundario?: string
          p_tipo_documento: string
          p_tipo_sangre?: string
          p_twitter_handle?: string
          p_whatsapp?: string
        }
        Returns: Json
      }
      crear_relacion_bp: {
        Args: {
          p_atributos?: Json
          p_bp_destino_id: string
          p_bp_origen_id: string
          p_es_bidireccional?: boolean
          p_fecha_inicio?: string
          p_notas?: string
          p_organizacion_id: string
          p_rol_destino: string
          p_rol_origen: string
          p_tipo_relacion: string
        }
        Returns: Json
      }
      eliminar_relacion_bp: {
        Args: { p_notas?: string; p_relacion_id: string }
        Returns: Json
      }
      finalizar_asignacion_accion: {
        Args: {
          p_asignacion_id: string
          p_fecha_fin?: string
          p_notas?: string
        }
        Returns: Json
      }
      finalizar_relacion_bp: {
        Args: { p_fecha_fin?: string; p_notas?: string; p_relacion_id: string }
        Returns: Json
      }
      generar_siguiente_subcodigo: {
        Args: { p_accion_id: string; p_tipo_asignacion: string }
        Returns: string
      }
      get_user_orgs: { Args: never; Returns: string[] }
      has_org_permission: {
        Args: { act: string; org_id: string; res: string }
        Returns: boolean
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_admin_v2: { Args: { p_org: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_org_owner: { Args: { org_id: string }; Returns: boolean }
      is_org_owner_v2: { Args: { p_org: string }; Returns: boolean }
      obtener_relaciones_bp: {
        Args: {
          p_bp_id: string
          p_solo_actuales?: boolean
          p_tipo_relacion?: string
        }
        Returns: {
          bp_relacionado_celular: string
          bp_relacionado_codigo: string
          bp_relacionado_email: string
          bp_relacionado_estado: string
          bp_relacionado_fecha_nac: string
          bp_relacionado_id: string
          bp_relacionado_nombre: string
          bp_relacionado_num_doc: string
          bp_relacionado_tipo_doc: string
          es_actual: boolean
          es_bidireccional: boolean
          fecha_fin: string
          fecha_inicio: string
          relacion_id: string
          rol_bp_relacionado: string
          rol_este_bp: string
          tipo_relacion: string
        }[]
      }
      org_has_other_owner: {
        Args: { exclude_user: string; org_id: string }
        Returns: boolean
      }
      org_has_other_owner_v2:
        | { Args: { p_org: string }; Returns: boolean }
        | {
            Args: { p_excluded_user_id: string; p_org_id: string }
            Returns: boolean
          }
      search_locations: {
        Args: { max_results?: number; q: string }
        Returns: {
          city_code: string | null
          city_name: string
          country_code: string
          country_name: string
          id: string
          search_text: string
          state_name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "geographic_locations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      transferir_accion: {
        Args: {
          p_accion_id: string
          p_fecha_transferencia?: string
          p_finalizar_beneficiarios?: boolean
          p_finalizar_titular?: boolean
          p_notas?: string
          p_nuevo_dueno_id: string
          p_precio_transaccion?: number
        }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      unaccent_lower: { Args: { "": string }; Returns: string }
      user_role_in_org: { Args: { org_id: string }; Returns: string }
      user_role_in_org_v2: { Args: { p_org: string }; Returns: string }
      validar_tipo_relacion_compatible: {
        Args: { tipo: string }
        Returns: boolean
      }
    }
    Enums: {
      estado_oportunidad_enum:
        | "abierta"
        | "en_proceso"
        | "ganada"
        | "perdida"
        | "cancelada"
      estado_tarea_enum:
        | "pendiente"
        | "en_progreso"
        | "bloqueada"
        | "hecha"
        | "cancelada"
      prioridad_tarea_enum: "baja" | "media" | "alta" | "critica"
      tipo_oportunidad_enum: "Solicitud Retiro" | "Solicitud Ingreso"
      tipo_relacion_bp:
        | "familiar"
        | "laboral"
        | "referencia"
        | "membresia"
        | "comercial"
        | "otra"
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
  public: {
    Enums: {
      estado_oportunidad_enum: [
        "abierta",
        "en_proceso",
        "ganada",
        "perdida",
        "cancelada",
      ],
      estado_tarea_enum: [
        "pendiente",
        "en_progreso",
        "bloqueada",
        "hecha",
        "cancelada",
      ],
      prioridad_tarea_enum: ["baja", "media", "alta", "critica"],
      tipo_oportunidad_enum: ["Solicitud Retiro", "Solicitud Ingreso"],
      tipo_relacion_bp: [
        "familiar",
        "laboral",
        "referencia",
        "membresia",
        "comercial",
        "otra",
      ],
    },
  },
} as const
