import { createClient } from "@/lib/supabase/server"
import { EmpresasPageClient } from "./empresas-page-client"
import { columns } from "@/features/socios/empresas/columns"

export const metadata = {
  title: "Empresas | SOCIOS ADMIN",
  description: "Listado de empresas registradas como socios de negocio",
}

export default async function EmpresasPage() {
  const supabase = await createClient()

  const { data: empresas, error } = await supabase
    .from("v_empresas_completa")
    .select("*")
    .is("bp_eliminado_en", null)
    .order("razon_social", { ascending: true })

  if (error) {
    console.error("Error fetching empresas:", error)
    return (
      <div className="p-8">
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-destructive">
            Error al cargar los datos. Por favor, intente nuevamente.
          </p>
        </div>
      </div>
    )
  }

  return <EmpresasPageClient initialData={empresas || []} columns={columns} />
}
