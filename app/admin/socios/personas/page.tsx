import { createClient } from "@/lib/supabase/server"
import { PersonasDataTable } from "@/features/socios/personas/data-table"
import { columns } from "@/features/socios/personas/columns"
import { PageHeader } from "@/components/page-header"

export const metadata = {
  title: "Personas | SOCIOS ADMIN",
  description: "Listado de personas registradas como socios de negocio",
}

export default async function PersonasPage() {
  const supabase = await createClient()

  const { data: personas, error } = await supabase
    .from("v_personas_completa")
    .select("*")
    .is("bp_eliminado_en", null)
    .order("nombre_completo", { ascending: true })

  if (error) {
    console.error("Error fetching personas:", error)
    return (
      <div className="container mx-auto py-10">
        <PageHeader
          title="Personas"
          description="Gestiona las personas registradas como socios de negocio"
        />
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-destructive">
            Error al cargar los datos. Por favor, intente nuevamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Personas"
        description="Gestiona las personas registradas como socios de negocio"
        metadata={`${personas?.length || 0} total`}
      />
      <PersonasDataTable columns={columns} data={personas || []} />
    </div>
  )
}
