import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashFlowHealth } from "./dash-flow-health"
import { PageShell } from "@/components/shell/page-shell"
import { PageHeader } from "@/components/shell/page-header"

export const metadata = {
    title: "Salud de Tareas",
}

export default async function FlowHealthPage() {
    const supabase = await createClient()

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: membership } = await supabase
        .from("config_organizacion_miembros")
        .select("role")
        .eq("user_id", user.id)
        .single()

    // Only admin and owner can access
    if (!membership || !["owner", "admin"].includes(membership.role)) {
        redirect("/admin/mis-tareas")
    }

    return (
        <PageShell>
            <PageHeader
                title="Salud de Tareas"
                description="Métricas de sostenibilidad, cuellos de botella y estancamientos del equipo"
            />
            <DashFlowHealth />
        </PageShell>
    )
}
