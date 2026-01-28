import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PageShell, PageDetailLayout, PageDetailSidebar, PageDetailMain } from "@/components/shell"
import { EmpresaDetailHeader } from "@/components/socios/empresas/empresa-detail-header"
import { CompanyIdentityPanel } from "@/components/socios/empresas/company-identity-panel"
import { EmpresaTabsContent } from "@/components/socios/empresas/empresa-tabs-content"
import { Empresa } from "@/features/socios/types/socios-schema"
import { extractCompanyProfiles } from "@/lib/utils/jsonb-helpers"

interface EmpresaPageProps {
    params: Promise<{ id: string }>
}

export default async function EmpresaDetailPage({ params }: EmpresaPageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Query dm_actores directly to access all fields including JSONB profiles
    const { data: empresaRaw, error } = await supabase
        .from("dm_actores")
        .select("*")
        .eq("id", id)
        .eq("tipo_actor", "empresa")
        .is("eliminado_en", null)
        .single()

    if (error || !empresaRaw) {
        console.error("Error fetching empresa:", error)
        return notFound()
    }

    // Cast to unknown then to proper type for type safety
    const raw = empresaRaw as unknown as Record<string, unknown>

    // Extract JSONB profile fields safely using helper
    const profiles = extractCompanyProfiles(raw as Record<string, unknown>)

    // Compute NIT completo
    const nit = raw.num_documento || ""
    const dv = raw.digito_verificacion
    const nit_completo = dv ? `${nit}-${dv}` : nit

    // Map dm_actores fields to Empresa type
    const empresa: Empresa = {
        // Core identity (direct from dm_actores)
        id: raw.id as string,
        codigo_bp: (raw.codigo_bp as string | null) || '',
        codigo: (raw.codigo_bp as string | null) || '', // Alias para compatibilidad
        organizacion_id: raw.organizacion_id as string,
        organizacion_nombre: 'Country Club Ejecutivos', // Hardcoded por ahora
        tipo_actor: "empresa",
        nat_fiscal: "jurídica",
        estado_actor: raw.estado_actor as "activo" | "inactivo" | "bloqueado",
        estado: raw.estado_actor as "activo" | "inactivo" | "bloqueado", // Alias para compatibilidad

        // Company names (direct from dm_actores)
        razon_social: (raw.razon_social as string) || '',
        nombre_comercial: (raw.nombre_comercial as string | null) || null,

        // Document (direct from dm_actores)
        tipo_documento: "NIT",
        num_documento: nit as string,
        digito_verificacion: (raw.digito_verificacion as number | null) || null,

        // Contact (direct from dm_actores)
        email_principal: (raw.email_principal as string | null) || null,
        email_secundario: (raw.email_secundario as string | null) || null,
        telefono_principal: (raw.telefono_principal as string | null) || null,
        telefono_secundario: (raw.telefono_secundario as string | null) || null,

        // From JSONB profiles (usando helper para extracción segura)
        ...profiles,

        // Business classifications
        es_socio: (raw.es_socio as boolean) ?? false,
        es_cliente: (raw.es_cliente as boolean) ?? false,
        es_proveedor: (raw.es_proveedor as boolean) ?? false,

        // Arrays/Objects
        tags: (raw.tags as string[]) || [],
        atributos: (raw.atributos as Record<string, unknown>) || {},
        perfil_intereses: (raw.perfil_intereses as Record<string, unknown>) || {},
        perfil_preferencias: (raw.perfil_preferencias as Record<string, unknown>) || {},
        perfil_metricas: (raw.perfil_metricas as Record<string, unknown>) || {},
        perfil_compliance: (raw.perfil_compliance as Record<string, unknown>) || {},

        // Computed fields
        nit_completo: nit_completo as string,
        nombre_representante_legal: null, // Requires separate query

        // Timestamps
        creado_en: raw.creado_en as string,
        actualizado_en: raw.actualizado_en as string,
        eliminado_en: raw.eliminado_en as string | null,
    }

    return (
        <PageShell>
            {/* Header area with custom EmpresaDetailHeader */}
            <div className="px-6 py-4 shrink-0 border-b border-border/60">
                <EmpresaDetailHeader empresa={empresa} />
            </div>

            {/* Two-column layout with ScrollArea */}
            <PageDetailLayout>
                <PageDetailSidebar>
                    <CompanyIdentityPanel empresa={empresa} />
                </PageDetailSidebar>
                <PageDetailMain>
                    <EmpresaTabsContent empresa={empresa} />
                </PageDetailMain>
            </PageDetailLayout>
        </PageShell>
    )
}
