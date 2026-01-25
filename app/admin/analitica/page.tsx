import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashTareas1 } from "./dash-tareas1"
import { PageShell } from "@/components/shell/page-shell"
import { PageHeader } from "@/components/shell/page-header"

export const metadata = {
    title: "Dashboard de Equipo - Tareas",
}

export default async function AnaliticaPage() {
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
            <DashTareas1 />
        </PageShell>
    )
}
