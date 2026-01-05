import { EmpresasPageClient } from "./empresas-page-client"

export const metadata = {
  title: "Empresas | SOCIOS ADMIN",
  description: "Listado de empresas registradas como socios de negocio",
}

export default function EmpresasPage() {
  return <EmpresasPageClient />
}
