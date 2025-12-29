"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Persona } from "@/features/socios/types/socios-schema"

// Forms
import { EditPersonalInfoForm } from "./edit-forms/edit-personal-info-form"
import { EditInstitutionalForm } from "./edit-forms/edit-institutional-form"
import { EditProfessionalForm } from "./edit-forms/edit-professional-form"
import { EditHealthForm } from "./edit-forms/edit-health-form"
import { EditEmergencyForm } from "./edit-forms/edit-emergency-form"
import { EditResidenceForm } from "./edit-forms/edit-residence-form"
import { EditDigitalForm } from "./edit-forms/edit-digital-form"

interface EditSectionSheetProps {
    sectionKey: string | null
    persona: Persona
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditSectionSheet({
    sectionKey,
    persona,
    open,
    onOpenChange,
}: EditSectionSheetProps) {
    if (!sectionKey) return null

    const getSectionTitle = (key: string) => {
        switch (key) {
            case "personal": return "Información Personal"
            case "institutional": return "Vínculo Institucional"
            case "professional": return "Perfil Profesional"
            case "health": return "Salud y Médica"
            case "emergency": return "Contacto de Emergencia"
            case "residence": return "Información de Residencia"
            case "digital": return "Ecosistema Digital"
            default: return "Sección"
        }
    }

    const renderForm = () => {
        const commonProps = {
            persona,
            onSuccess: () => onOpenChange(false),
            onCancel: () => onOpenChange(false),
        }

        switch (sectionKey) {
            case "personal": return <EditPersonalInfoForm {...commonProps} />
            case "institutional": return <EditInstitutionalForm {...commonProps} />
            case "professional": return <EditProfessionalForm {...commonProps} />
            case "health": return <EditHealthForm {...commonProps} />
            case "emergency": return <EditEmergencyForm {...commonProps} />
            case "residence": return <EditResidenceForm {...commonProps} />
            case "digital": return <EditDigitalForm {...commonProps} />
            default: return null
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
                <SheetHeader className="text-left pb-4">
                    <SheetTitle>Editar {getSectionTitle(sectionKey)}</SheetTitle>
                    <SheetDescription>
                        Actualiza los datos de esta sección. Los cambios se reflejarán inmediatamente tras guardar.
                    </SheetDescription>
                </SheetHeader>

                <Separator className="mb-6" />

                <div className="pb-8">
                    {renderForm()}
                </div>
            </SheetContent>
        </Sheet>
    )
}
