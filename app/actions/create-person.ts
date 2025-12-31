/**
 * @deprecated This file is deprecated and will be removed in a future version.
 *
 * Use `crearPersonaFromPersonFormValues` from `@/app/actions/personas` instead.
 *
 * This server action uses the legacy `create_new_person` RPC which has been
 * replaced by the new `crear_persona` RPC function.
 *
 * Migration path:
 * 1. Replace import: `createPerson` → `crearPersonaFromPersonFormValues`
 * 2. Update error handling: now returns `{data: UUID}` or `{error: string}`
 * 3. See: /app/actions/personas.ts for the new implementation
 *
 * Last Updated: 2024-12-22
 * TODO: Remove this file after verifying all references have been updated
 */

"use server"

import { createClient } from "@/lib/supabase/server"
import { personSchema, type PersonFormValues } from "@/lib/schemas/person-schema"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createPerson(data: PersonFormValues) {
    const supabase = await createClient()

    // 1. Validate input
    const validatedFields = personSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            error: "Datos inválidos",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        tipo_documento,
        numero_documento,
        fecha_expedicion,
        lugar_expedicion,
        genero,
        fecha_nacimiento,
        nacionalidad,
        estado_civil,
        email_principal,
        telefono_principal,
        estado,
    } = validatedFields.data

    // Get current user for audit fields (if we had them in the schema, but DB handles current_user usually or we pass it)
    // schema says created_por is UUID. We'll leave it null for now or fetch user if strictly required.
    // Assuming DB defaults or triggers handle simple cases, but let's stick to the prompt's simplicity unless DB complains.

    // Step 1: Create Business Partner
    // We need organization_id. For now hardcode a demo one or fetch from session context if available.

    // Fetch organization
    const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .limit(1)
        .single()

    if (orgError || !orgData) {
        console.error("Error fetching organization:", orgError)
        return { error: "No se encontró una organización activa para asociar el socio." }
    }

    const organizacion_id = orgData.id
    console.log("Creating Business Partner for Org:", organizacion_id)

    // 2. Transacción Atómica vía RPC
    // Usamos la función creada en SQL para evitar bloqueos por triggers circulares.
    console.log("Calling RPC create_new_person...")

    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_new_person', {
        p_organizacion_id: organizacion_id,
        p_datos_persona: {
            ...validatedFields.data,
            // Aseguramos formato de fechas si es necesario
            fecha_nacimiento: fecha_nacimiento,
            fecha_expedicion: fecha_expedicion || null
        }
    })

    if (rpcError) {
        console.error("RPC Error:", rpcError)
        return { error: `Error creando socio: ${rpcError.message}` }
    }

    // cast result if needed, usually rpc returns data
    const result = rpcResult as { success?: boolean; error?: string; id?: string }
    if (!result?.success) {
        console.error("RPC Business Error:", result)
        return { error: result?.error || "Error desconocido al crear persona" }
    }

    console.log("Persona created successfully via RPC:", result.id)
    revalidatePath("/admin/socios/personas")
    return { success: true, message: "Persona creada exitosamente" }
}
