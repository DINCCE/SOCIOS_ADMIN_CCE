"use server"

import { createClient } from "@/lib/supabase/server"

export async function testWriteAction() {
    const supabase = await createClient()
    const logs: string[] = []

    try {
        // 0. INSPECT TRIGGERS (Diagnostic Step)
        const { data: triggerData, error: triggerError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, action_timing, event_manipulation')
            .eq('event_object_table', 'business_partners')

        if (triggerData) {
            logs.push("🔍 TRIGGERS ENCONTRADOS en business_partners:")
            triggerData.forEach((t: { trigger_name: string; action_timing: string; event_manipulation: string }) => {
                logs.push(`   - ${t.trigger_name}: ${t.action_timing} ${t.event_manipulation}`)
                if (t.action_timing === 'BEFORE' && t.event_manipulation === 'INSERT') {
                    logs.push("   ⚠️ CRÍTICO: Este trigger es el que está bloqueando. Debe ser AFTER + DEFERRABLE.")
                }
            })
        } else if (triggerError) {
            logs.push(`⚠️ No se pudieron leer triggers (esto es normal si RLS bloquea system tables client-side, pero probemos): ${triggerError.message}`)
            // Try RPC call to get triggers if direct select fails (often fails on hosted supabase client side, but we are on server component)
            // actually information_schema usually requires permissions. 
        }

        // 1. Get Org
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("id")
            .limit(1)
            .single()

        if (orgError || !org) {
            return { success: false, logs: ["❌ Error: No se encontró organización para la prueba."] }
        }
        logs.push(`✅ Org ID: ${org.id}`)

        // 2. Try Insert Business Partner
        logs.push("⏳ Intentando insertar Business Partner de prueba...")
        const bpData = {
            organizacion_id: org.id,
            tipo_actor: "persona",
            estado: "activo",
            email_principal: "test_diag@example.com"
        }

        const { data: bp, error: insertError } = await supabase
            .from("business_partners")
            .insert(bpData)
            .select()
            .single()

        if (insertError) {
            logs.push(`❌ CREATE BP FAILED: ${insertError.message}`)
            logs.push(`   Detalles: ${JSON.stringify(insertError)}`)
            return { success: false, logs }
        }

        logs.push(`✅ BP Creado ID: ${bp.id}`)
        logs.push(`   Código Generado: ${bp.codigo_bp || 'NULL (OJO: Si es null puede fallar la app)'}`)

        // 3. Try Insert Persona
        logs.push("⏳ Intentando insertar Persona relacionada...")
        const { error: personError } = await supabase
            .from("personas")
            .insert({
                id: bp.id,
                primer_nombre: "Test",
                primer_apellido: "Diagnostic",
                tipo_documento: "CC",
                numero_documento: `TEST-${Date.now()}`, // Unique
                genero: "masculino"
            })

        if (personError) {
            logs.push(`❌ CREATE PERSONA FAILED: ${personError.message}`)
        } else {
            logs.push("✅ Persona creada correctamente.")
        }

        // 4. Cleanup
        logs.push("⏳ Limpiando datos de prueba...")
        const { error: delError } = await supabase
            .from("business_partners")
            .delete()
            .eq("id", bp.id)

        if (delError) logs.push(`⚠️ Error borrando datos de prueba: ${delError.message}`)
        else logs.push("✅ Datos de prueba eliminados.")

        return { success: true, logs }

    } catch (err: unknown) {
        logs.push(`❌ EXCEPTION: ${err instanceof Error ? err.message : String(err)}`)
        return { success: false, logs }
    }
}
