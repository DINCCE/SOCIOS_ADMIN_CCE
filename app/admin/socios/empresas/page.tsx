import { createClient } from "@/lib/supabase/server"
import { EmpresasDataTable } from "@/features/socios/empresas/data-table"
import { columns } from "@/features/socios/empresas/columns"
import { PageHeader } from "@/components/page-header"
import { NewCompanySheet } from "@/components/socios/empresas/new-company-sheet"

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
      <div className="container mx-auto py-10">
        <PageHeader
          title="Empresas"
          description="Gestiona las empresas registradas como socios de negocio"
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
        title="Empresas"
        description="Gestiona las empresas registradas como socios de negocio"
        metadata={`${empresas?.length || 0} total`}
      >
        <NewCompanySheet />
      </PageHeader>
      <EmpresasDataTable columns={columns} data={empresas || []} />
    </div>
  )
}
