import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PageShell, PageDetailLayout, PageDetailSidebar, PageDetailMain } from "@/components/shell"
import { PersonDetailHeader } from "@/components/socios/personas/person-detail-header"
import { PersonIdentityPanel } from "@/components/socios/personas/person-identity-panel"
import { PersonTabsContent } from "@/components/socios/personas/person-tabs-content"
import { Persona } from "@/features/socios/types/socios-schema"
import { extractPersonaProfiles } from "@/lib/utils/jsonb-helpers"

interface PersonPageProps {
    params: Promise<{ id: string }>
}

export default async function PersonDetailPage({ params }: PersonPageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Query dm_actores directly to access all fields including JSONB profiles
    const { data: personaRaw, error } = await supabase
        .from("dm_actores")
        .select("*")
        .eq("id", id)
        .eq("tipo_actor", "persona")
        .is("eliminado_en", null)
        .single()

    if (error || !personaRaw) {
        console.error("Error fetching persona:", error)
        return notFound()
    }

    // Cast to any since types_db.ts may need updating
    const raw = personaRaw as any

    // Extract JSONB profile fields safely using helper
    const profiles = extractPersonaProfiles(raw)

    // Map dm_actores fields to Persona type
    const persona: Persona = {
        // Core identity (direct from dm_actores)
        id: raw.id,
        codigo_bp: raw.codigo_bp,
        codigo: raw.codigo_bp,  // Alias para compatibilidad con personaSchema
        organizacion_id: raw.organizacion_id,
        organizacion_nombre: 'Country Club Ejecutivos',  // Hardcoded por ahora, se puede obtener de config_organizaciones después
        tipo_actor: raw.tipo_actor,
        estado_actor: raw.estado_actor,
        estado: raw.estado_actor,  // Alias para compatibilidad con personaSchema

        // Nombres (direct from dm_actores)
        primer_nombre: raw.primer_nombre || '',
        segundo_nombre: raw.segundo_nombre || null,
        primer_apellido: raw.primer_apellido || '',
        segundo_apellido: raw.segundo_apellido || null,
        nombre_completo: `${raw.primer_nombre || ''} ${raw.primer_apellido || ''}`.trim(),

        // Documento (direct from dm_actores)
        tipo_documento: raw.tipo_documento || null,
        numero_documento: raw.num_documento || '',

        // Contacto (direct from dm_actores)
        email_principal: raw.email_principal || null,
        email_secundario: raw.email_secundario || null,
        telefono_principal: raw.telefono_principal || null,
        telefono_secundario: raw.telefono_secundario || null,

        // Info personal (direct from dm_actores)
        genero: raw.genero_actor || null,
        fecha_nacimiento: raw.fecha_nacimiento || null,
        estado_civil: raw.estado_civil || null,

        // From JSONB profiles (usando helper para extracción segura)
        ...profiles,

        // Arrays/Objects
        tags: raw.tags || [],
        atributos: raw.atributos || {},
        perfil_intereses: raw.perfil_intereses || {},
        perfil_preferencias: raw.perfil_preferencias || {},
        perfil_metricas: raw.perfil_metricas || {},
        perfil_compliance: raw.perfil_compliance || {},

        // Campo calculado (requiere query separada a dm_actores, null por ahora)
        nombre_contacto_emergencia: null,

        // Timestamps
        creado_en: raw.creado_en,
        actualizado_en: raw.actualizado_en,
        bp_creado_en: raw.creado_en,
        bp_actualizado_en: raw.actualizado_en,
        eliminado_en: raw.eliminado_en,
    }

    return (
        <PageShell>
            {/* Header area with custom PersonDetailHeader */}
            <div className="px-6 py-4 shrink-0 border-b border-border/60">
                <PersonDetailHeader persona={persona} />
            </div>

            {/* Two-column layout with ScrollArea */}
            <PageDetailLayout>
                <PageDetailSidebar>
                    <PersonIdentityPanel persona={persona} />
                </PageDetailSidebar>
                <PageDetailMain>
                    <PersonTabsContent persona={persona} />
                </PageDetailMain>
            </PageDetailLayout>
        </PageShell>
    )
}
