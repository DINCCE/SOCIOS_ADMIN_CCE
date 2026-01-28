"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Layers } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"

// Import all sheets and dialogs
import { EditSectionDialog } from "@/components/socios/personas/edit-section-dialog"
import { NewPersonDialog } from "@/components/socios/personas/new-person-dialog"
import { NewCompanyDialog } from "@/components/socios/empresas/new-company-dialog"
import { NewTareaDialog } from "@/components/procesos/tareas/new-tarea-dialog"
import { AsignarAccionDialog } from "@/components/procesos/acciones/asignar-accion-dialog"
import { NewDocComercialDialog } from "@/components/procesos/documentos-comerciales/new-doc-comercial-dialog"

// Mock data for sheets that require it
const mockPersona: Persona = {
  id: "mock-persona-id",
  codigo_bp: "BP-001",
  organizacion_id: "mock-org-id",
  organizacion_nombre: "Mock Organization",
  tipo_actor: "persona",
  estado_actor: "activo",
  // Document fields
  tipo_documento: "CC",
  numero_documento: "123456789",
  fecha_expedicion: "2020-01-01",
  lugar_expedicion: "Bogotá",
  lugar_expedicion_id: null,
  // Name fields
  primer_nombre: "Juan",
  segundo_nombre: null,
  primer_apellido: "Pérez",
  segundo_apellido: null,
  // Personal info
  genero: "masculino",
  fecha_nacimiento: "1990-01-01",
  lugar_nacimiento: null,
  lugar_nacimiento_id: null,
  nacionalidad: "Colombiana",
  estado_civil: "soltero",
  ocupacion: null,
  profesion: null,
  nivel_educacion: null,
  tipo_sangre: null,
  eps: null,
  fecha_socio: null,
  fecha_aniversario: null,
  estado_vital: "vivo",
  // Contact
  email_principal: "juan@example.com",
  email_secundario: null,
  telefono_principal: "+57 300 123 4567",
  telefono_secundario: null,
  whatsapp: null,
  // Digital
  foto_url: null,
  linkedin_url: null,
  facebook_url: null,
  instagram_handle: null,
  twitter_handle: null,
  // Emergency
  contacto_emergencia_id: null,
  relacion_emergencia: null,
  // Attributes
  atributos: null,
  perfil_intereses: {},
  perfil_preferencias: {},
  perfil_metricas: {},
  perfil_compliance: {},
  tags: [],
  // Audit
  creado_en: "2024-01-01T00:00:00Z",
  actualizado_en: "2024-01-01T00:00:00Z",
  bp_creado_en: "2024-01-01T00:00:00Z",
  bp_actualizado_en: "2024-01-01T00:00:00Z",
  eliminado_en: null,
  // Computed
  nombre_completo: "Juan Pérez",
  nombre_contacto_emergencia: null,
}

type SheetKey =
  | "edit-section-persona"
  | "new-person"
  | "new-company"
  | "new-tarea"
  | "asignar-accion"
  | "new-doc-comercial"

const sheetsConfig = [
  {
    key: "edit-section-persona" as SheetKey,
    title: "Edit Section Dialog (Persona)",
    description: "Edit person sections (identity, profile, security)",
    category: "Personas",
    path: "components/socios/personas/edit-section-dialog.tsx",
  },
  {
    key: "new-person" as SheetKey,
    title: "New Person Dialog",
    description: "Create a new person",
    category: "Personas",
    path: "components/socios/personas/new-person-dialog.tsx",
  },
  {
    key: "new-company" as SheetKey,
    title: "New Company Dialog",
    description: "Create a new company",
    category: "Empresas",
    path: "components/socios/empresas/new-company-dialog.tsx",
  },
  {
    key: "new-tarea" as SheetKey,
    title: "New Tarea Dialog",
    description: "Create a new task",
    category: "Procesos",
    path: "components/procesos/tareas/new-tarea-dialog.tsx",
  },
  {
    key: "asignar-accion" as SheetKey,
    title: "Asignar Acción Dialog",
    description: "Assign an action to a person",
    category: "Procesos",
    path: "components/procesos/acciones/asignar-accion-dialog.tsx",
  },
  {
    key: "new-doc-comercial" as SheetKey,
    title: "New Doc Comercial Dialog",
    description: "Create a new commercial document",
    category: "Procesos",
    path: "components/procesos/documentos-comerciales/new-doc-comercial-dialog.tsx",
  },
]

const categories = Array.from(new Set(sheetsConfig.map((s) => s.category)))

export function SheetsShowcase() {
  const [openSheet, setOpenSheet] = useState<SheetKey | null>(null)
  const [editSectionKey, setEditSectionKey] = useState<string | null>(null)

  function openSheetHandler(key: SheetKey) {
    if (key === "edit-section-persona") {
      setEditSectionKey("identity")
    }
    setOpenSheet(key)
  }

  function closeSheetHandler() {
    setOpenSheet(null)
    setEditSectionKey(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sheets Showcase</h2>
          <p className="text-muted-foreground">
            Preview all sheet components in the application
          </p>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {category}
            </Badge>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheetsConfig
              .filter((s) => s.category === category)
              .map((sheet) => (
                <Card key={sheet.key} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {sheet.title}
                      <Badge variant="secondary" className="text-[10px]">
                        {sheet.key}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {sheet.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <code className="block text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {sheet.path}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => openSheetHandler(sheet.key)}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Open Sheet
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Sheet/Dialog Renderers */}
      {openSheet === "edit-section-persona" && (
        <EditSectionDialog
          sectionKey={editSectionKey}
          persona={mockPersona}
          open={openSheet === "edit-section-persona"}
          onOpenChange={closeSheetHandler}
        />
      )}

      {openSheet === "new-person" && (
        <NewPersonDialog
          open={openSheet === "new-person"}
          onOpenChange={(open) => !open && closeSheetHandler()}
        />
      )}

      {openSheet === "new-company" && (
        <NewCompanyDialog
          open={openSheet === "new-company"}
          onOpenChange={(open) => !open && closeSheetHandler()}
        />
      )}

      {openSheet === "new-tarea" && (
        <NewTareaDialog
          open={openSheet === "new-tarea"}
          onOpenChange={(open) => !open && closeSheetHandler()}
        />
      )}

      {openSheet === "asignar-accion" && (
        <AsignarAccionDialog
          open={openSheet === "asignar-accion"}
          onOpenChange={(open) => !open && closeSheetHandler()}
        />
      )}

      {openSheet === "new-doc-comercial" && (
        <NewDocComercialDialog
          open={openSheet === "new-doc-comercial"}
          onOpenChange={(open) => !open && closeSheetHandler()}
        />
      )}
    </div>
  )
}
