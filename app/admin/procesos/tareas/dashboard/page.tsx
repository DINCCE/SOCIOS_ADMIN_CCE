import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TareasDashboardEquipo } from "./tareas-dashboard-equipo"
import { PageShell } from "@/components/shell/page-shell"
import { PageHeader } from "@/components/shell/page-header"

export const metadata = {
    title: "Dashboard de Equipo - Tareas",
}

export default async function TeamDashboardPage() {
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
                title="Dashboard de Equipo"
                description="Vista general de productividad y carga de trabajo"
            />
            <TareasDashboardEquipo />
        </PageShell>
    )
}
