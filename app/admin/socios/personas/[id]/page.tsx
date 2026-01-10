import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PersonDetailHeader } from "@/components/socios/personas/person-detail-header"
import { PersonIdentityPanel } from "@/components/socios/personas/person-identity-panel"
import { PersonTabsContent } from "@/components/socios/personas/person-tabs-content"
import { Persona } from "@/features/socios/types/socios-schema"

interface PersonPageProps {
    params: Promise<{ id: string }>
}

export default async function PersonDetailPage({ params }: PersonPageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Query dm_actores directly to access all fields including JSONB profiles
    const { data: personaRaw, error } = await supabase
        .from("dm_actores")
        .select(`
            *,
            organizacion:config_organizaciones (
                nombre as organizacion_nombre
            )
        `)
        .eq("id", id)
        .eq("tipo_actor", "persona")
        .is("eliminado_en", null)
        .single()

    if (error || !personaRaw) {
        console.error("Error fetching persona:", error)
        return notFound()
    }

    // Cast to any since types_db.ts is empty
    const raw = personaRaw as any

    // Extract JSONB profile fields and map to Persona type
    const persona: Persona = {
        // Extract from JSONB profiles
        tipo_sangre: raw.perfil_salud?.tipo_sangre || null,
        eps: raw.perfil_salud?.eps || null,
        ocupacion: raw.perfil_profesional_corporativo?.ocupacion || null,
        nacionalidad: raw.perfil_identidad?.nacionalidad || null,
        linkedin_url: raw.perfil_redes?.linkedin || null,
        facebook_url: raw.perfil_redes?.facebook || null,
        instagram_handle: raw.perfil_redes?.instagram || null,
        twitter_handle: raw.perfil_redes?.twitter || null,
        whatsapp: raw.perfil_redes?.whatsapp || null,
        // Map computed/named fields for Persona type compatibility
        id: raw.id,
        codigo_bp: raw.codigo_bp,
        nombre_completo: `${raw.primer_nombre || ''} ${raw.primer_apellido || ''}`.trim(),
        numero_documento: raw.num_documento || '',
        email_principal: raw.email_principal || null,
        telefono_principal: raw.telefono_principal || null,
        estado_actor: raw.estado_actor,
        genero: raw.genero_actor || null,
        // Get organization name from JOIN
        organizacion_nombre: raw.organizacion?.organizacion_nombre || '',
        organizacion_id: raw.organizacion_id,
        tipo_actor: raw.tipo_actor,
        // Default values for fields that may be in JSONB
        fecha_expedicion: raw.perfil_identidad?.fecha_expedicion || null,
        lugar_expedicion: raw.perfil_identidad?.lugar_expedicion || null,
        lugar_expedicion_id: raw.perfil_identidad?.lugar_expedicion_id || null,
        lugar_nacimiento: raw.perfil_identidad?.lugar_nacimiento || null,
        lugar_nacimiento_id: raw.perfil_identidad?.lugar_nacimiento_id || null,
        profesion: raw.perfil_profesional_corporativo?.profesion || null,
        nivel_educacion: raw.perfil_profesional_corporativo?.nivel_educacion || null,
        foto_url: raw.perfil_redes?.foto_url || null,
        contacto_emergencia_id: raw.perfil_contacto?.contacto_emergencia_id || null,
        relacion_emergencia: raw.perfil_contacto?.relacion_emergencia || null,
        // Set default empty arrays/objects
        tags: raw.tags || [],
        atributos: raw.atributos || {},
        perfil_intereses: raw.perfil_intereses || {},
        perfil_preferencias: raw.perfil_preferencias || {},
        perfil_metricas: raw.perfil_metricas || {},
        perfil_compliance: raw.perfil_compliance || {},
        // Timestamps
        creado_en: raw.creado_en,
        actualizado_en: raw.actualizado_en,
        bp_creado_en: raw.creado_en,
        bp_actualizado_en: raw.actualizado_en,
        eliminado_en: raw.eliminado_en,
        // Required fields with defaults
        primer_nombre: raw.primer_nombre || '',
        segundo_nombre: raw.segundo_nombre || null,
        primer_apellido: raw.primer_apellido || '',
        segundo_apellido: raw.segundo_apellido || null,
        tipo_documento: raw.tipo_documento || null,
        fecha_nacimiento: raw.fecha_nacimiento || null,
        estado_civil: raw.estado_civil || null,
        fecha_socio: raw.fecha_socio || null,
        fecha_aniversario: raw.fecha_aniversario || null,
        estado_vital: raw.estado_vital || 'vivo',
        email_secundario: raw.email_secundario || null,
        telefono_secundario: raw.telefono_secundario || null,
        nombre_contacto_emergencia: raw.nombre_contacto_emergencia || null,
        deuda: raw.deuda || null,
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* 1. Header Area - Fixed at top */}
            <div className="bg-background px-6 py-4">
                <PersonDetailHeader persona={persona} />
            </div>

            {/* 2. Main Layout: Flex Container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Identity (Fixed width) */}
                <aside className="w-[300px] shrink-0 border-r border-border bg-background overflow-y-auto hidden md:block">
                    <div className="p-4">
                        <PersonIdentityPanel persona={persona} />
                    </div>
                </aside>

                {/* Main Content Area: Tabs & Grid (Flexible) */}
                <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    <PersonTabsContent persona={persona} />
                </main>
            </div>
        </div>
    )
}
