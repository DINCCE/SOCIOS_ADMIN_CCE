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

    const { data: persona, error } = await supabase
        .from("v_personas_org")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !persona) {
        console.error("Error fetching persona:", error)
        return notFound()
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* 1. Header Area - Fixed at top */}
            <div className="bg-background px-6 py-4">
                <PersonDetailHeader persona={persona as Persona} />
            </div>

            {/* 2. Main Layout: Flex Container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Identity (Fixed width) */}
                <aside className="w-[300px] shrink-0 border-r border-border bg-background overflow-y-auto hidden md:block">
                    <div className="p-4">
                        <PersonIdentityPanel persona={persona as Persona} />
                    </div>
                </aside>

                {/* Main Content Area: Tabs & Grid (Flexible) */}
                <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    <PersonTabsContent persona={persona as Persona} />
                </main>
            </div>
        </div>
    )
}
