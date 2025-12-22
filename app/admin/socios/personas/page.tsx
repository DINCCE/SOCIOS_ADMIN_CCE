import { createClient } from "@/lib/supabase/server"
import { PersonasDataTable } from "@/features/socios/personas/data-table"
import { columns } from "@/features/socios/personas/columns"

export const metadata = {
  title: "Personas | SOCIOS ADMIN",
  description: "Listado de personas registradas como socios de negocio",
}

export default async function PersonasPage() {
  const supabase = await createClient()

  const { data: personas, error } = await supabase
    .from("v_personas_completa")
    .select("*")
    .is("eliminado_en", null)
    .order("nombre_completo", { ascending: true })

  if (error) {
    console.error("Error fetching personas:", error)
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Personas</h1>
          <p className="text-muted-foreground">
            Gestiona las personas registradas como socios de negocio
          </p>
        </div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Personas</h1>
        <p className="text-muted-foreground">
          Gestiona las personas registradas como socios de negocio
        </p>
      </div>
      <PersonasDataTable columns={columns} data={personas || []} />
    </div>
  )
}
