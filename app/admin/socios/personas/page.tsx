import { PersonasPageClient } from "./personas-page-client"

export const metadata = {
  title: "Personas | SOCIOS ADMIN",
  description: "Listado de personas registradas como socios de negocio",
}

export default function PersonasPage() {
  return <PersonasPageClient />
}
