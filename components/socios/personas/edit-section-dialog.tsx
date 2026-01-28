"use client"

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Persona } from "@/features/socios/types/socios-schema"

// Legacy Forms (to be deprecated)
import { EditPersonalInfoForm } from "./edit-forms/edit-personal-info-form"
import { EditInstitutionalForm } from "./edit-forms/edit-institutional-form"
import { EditProfessionalForm } from "./edit-forms/edit-professional-form"
import { EditHealthForm } from "./edit-forms/edit-health-form"
import { EditEmergencyForm } from "./edit-forms/edit-emergency-form"
import { EditResidenceForm } from "./edit-forms/edit-residence-form"
import { EditDigitalForm } from "./edit-forms/edit-digital-form"

// New Consolidated Forms
import { EditIdentityForm } from "./edit-forms/edit-identity-form"
import { EditProfileForm } from "./edit-forms/edit-profile-form"
import { EditSecurityForm } from "./edit-forms/edit-security-form"

interface EditSectionDialogProps {
    sectionKey: string | null
    persona: Persona
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditSectionDialog({
    sectionKey,
    persona,
    open,
    onOpenChange,
}: EditSectionDialogProps) {
    if (!sectionKey) return null

    const renderForm = () => {
        const commonProps = {
            persona,
            onSuccess: () => onOpenChange(false),
            onCancel: () => onOpenChange(false),
        }

        // New consolidated forms
        switch (sectionKey) {
            case "identity": return <EditIdentityForm {...commonProps} />
            case "profile": return <EditProfileForm {...commonProps} />
            case "security": return <EditSecurityForm {...commonProps} />

            // Legacy forms (deprecated - will be removed)
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[85vh] border border-border/50 shadow-2xl rounded-xl overflow-hidden p-0 flex flex-col [&>button:last-child]:hidden">
                {renderForm()}
            </DialogContent>
        </Dialog>
    )
}
