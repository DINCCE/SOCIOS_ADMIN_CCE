import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PersonDetailHeader } from "@/components/socios/personas/person-detail-header"
import { PersonIdentityPanel } from "@/components/socios/personas/person-identity-panel"
import { PersonTabsContent } from "@/components/socios/personas/person-tabs-content"
import { PersonContextPanel } from "@/components/socios/personas/person-context-panel"
import { Persona } from "@/features/socios/types/socios-schema"

interface PersonPageProps {
    params: Promise<{ id: string }>
}

export default async function PersonDetailPage({ params }: PersonPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: persona, error } = await supabase
        .from("v_personas_completa")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !persona) {
        console.error("Error fetching persona:", error)
        return notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            {/* 1. Header Area */}
            <PersonDetailHeader persona={persona as Persona} />

            {/* 2. Main 3-Column Content */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr_280px]">
                {/* LeftColumn: Identity Sidebar */}
                <aside className="relative">
                    <div className="sticky top-6">
                        <PersonIdentityPanel persona={persona as Persona} />
                    </div>
                </aside>

                {/* MainCenter: Main Content Area */}
                <main className="min-w-0">
                    <PersonTabsContent persona={persona as Persona} />
                </main>

                {/* RightColumn: Context Sidebar */}
                <aside className="relative">
                    <div className="sticky top-6">
                        <PersonContextPanel persona={persona as Persona} />
                    </div>
                </aside>
            </div>
        </div>
    )
}
