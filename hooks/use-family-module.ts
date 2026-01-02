import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Type for the relationship payload
interface CreateRelationshipParams {
    bp_origen_id: string
    bp_destino_id: string
    tipo_relacion: string
    rol_origen: string
    rol_destino: string
}

/**
 * Helper to calculate age from date string
 */
function calculateAge(dateString: string | null): string | null {
    if (!dateString) return null
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return `${age} años`
}

/**
 * Hook to fetch family group relationships for a specific Business Partner (Socio)
 */
export function useFamilyGroup(bpId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ["relationships", bpId],
        queryFn: async () => {
            if (!bpId) return []

            const { data, error } = await supabase.rpc("obtener_relaciones_bp", {
                p_bp_id: bpId,
                p_solo_actuales: true
            })

            if (error) {
                console.error("Error fetching family group:", error)
                throw error
            }

            // Map RPC result to FamilyMember interface
            return (data || [])
                .filter((rel: any) => rel.tipo_relacion === "familiar")
                .map((rel: any) => ({
                    id: rel.relacion_id, // Mapped from RPC 'relacion_id'
                    person_id: rel.bp_relacionado_id, // Mapped from RPC 'bp_relacionado_id'
                    nombre_completo: rel.bp_relacionado_nombre || "Desconocido",
                    rol_destino: rel.rol_bp_relacionado, // The role the OTHER person plays (e.g. "Hijo")
                    estado: rel.bp_relacionado_estado,    // NEW
                    tipo_documento: rel.bp_relacionado_tipo_doc, // NEW
                    numero_documento: rel.bp_relacionado_num_doc, // NEW
                    fecha_nacimiento: rel.bp_relacionado_fecha_nac, // NEW
                    edad: calculateAge(rel.bp_relacionado_fecha_nac), // NEW Helper
                    email: rel.bp_relacionado_email, // NEW
                    celular: rel.bp_relacionado_celular, // NEW
                    // RPC doesn't currently return foto_url for the related person. 
                    // We might need to update RPC or fetch it separately. For now, avatar fallback will use initials.
                    foto_url: null
                }))
        },
        enabled: !!bpId,
    })
}

/**
 * Hook to search for persons using v_personas_completa (formerly v_personas_org)
 */
export function usePersonSearch(searchTerm: string, orgId?: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ["personSearch", searchTerm, orgId],
        queryFn: async () => {
            // Return empty if search term is too short
            if (!searchTerm || searchTerm.length < 2) return []

            let query = supabase
                .from("v_personas_completa")
                .select("id, nombre_completo, numero_documento, tipo_documento, foto_url, organizacion_id")
                .or(`nombre_completo.ilike.%${searchTerm}%,numero_documento.ilike.%${searchTerm}%`)
                .limit(10)

            // Add organization filter if provided
            if (orgId) {
                query = query.eq("organizacion_id", orgId)
            }

            const { data, error } = await query

            if (error) {
                console.error("Error searching persons:", error)
                throw error
            }

            return data || []
        },
        // Only fetch if term is valid
        enabled: searchTerm.length >= 2,
        // Add logic for keeping previous data while typing if needed, 
        // but standard useQuery is fine. Debounce is handled in the component.
        staleTime: 1000 * 60 * 1 // Cache results for 1 minute
    })
}

/**
 * Hook to create a new relationship
 */
/**
 * Hook to fetch basic metadata for a Business Partner (like organization_id)
 */
export function useBusinessPartnerMeta(bpId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ["bp_meta", bpId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("business_partners")
                .select("organizacion_id")
                .eq("id", bpId)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!bpId
    })
}

/**
 * Hook to create a new relationship
 */
export function useCreateRelationship() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: CreateRelationshipParams & { organizacion_id: string }) => {
            const { error } = await supabase.rpc("crear_relacion_bp", {
                p_organizacion_id: params.organizacion_id,
                p_bp_origen_id: params.bp_origen_id,
                p_bp_destino_id: params.bp_destino_id,
                p_tipo_relacion: params.tipo_relacion,
                p_rol_origen: params.rol_origen,
                p_rol_destino: params.rol_destino
            })

            if (error) throw error
        },
        onSuccess: (_, variables) => {
            toast.success("Familiar añadido correctamente")
            // Invalidate the family group query for the origin BP
            queryClient.invalidateQueries({ queryKey: ["relationships", variables.bp_origen_id] })
        },
        onError: (error: any) => {
            console.error("Error creating relationship:", error)
            toast.error(error.message || "Error al crear la relación")
        }
    })
}
