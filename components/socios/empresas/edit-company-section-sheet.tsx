"use client"

import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { Empresa } from "@/features/socios/types/socios-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, FileText, Building2, Briefcase, Link as LinkIcon, User } from "lucide-react"

interface EditCompanySectionSheetProps {
    sectionKey: string | null
    empresa: Empresa
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditCompanySectionSheet({
    sectionKey,
    open,
    onOpenChange,
}: EditCompanySectionSheetProps) {
    if (!sectionKey) return null

    const renderForm = () => {
        // Placeholder content - to be implemented with actual forms
        const sections: Record<string, { title: string; icon: React.ReactNode; description: string }> = {
            legal: {
                title: "Identidad Legal",
                icon: <FileText className="h-5 w-5" />,
                description: "Edita la razón social, nombre comercial, NIT y tipo de sociedad."
            },
            tax: {
                title: "Registro Tributario",
                icon: <FileText className="h-5 w-5" />,
                description: "Edita el número de registro, CIIU, sector y actividad económica."
            },
            representative: {
                title: "Representación Legal",
                icon: <User className="h-5 w-5" />,
                description: "Actualiza el representante legal y su cargo."
            },
            contact: {
                title: "Datos de Contacto",
                icon: <LinkIcon className="h-5 w-5" />,
                description: "Modifica emails, teléfonos y presencia digital."
            },
            metrics: {
                title: "Métricas de Negocio",
                icon: <Briefcase className="h-5 w-5" />,
                description: "Actualiza ingresos anuales y número de empleados."
            },
        }

        const section = sections[sectionKey]

        if (!section) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Edit className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground">Sección no encontrada</p>
                </div>
            )
        }

        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                    <Card className="border-none shadow-none">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    {section.icon}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed rounded-lg">
                                <Building2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                <p className="text-sm font-medium text-muted-foreground">Formulario de edición</p>
                                <p className="text-xs text-muted-foreground/60 max-w-[280px] mt-1">
                                    El formulario para editar {section.title.toLowerCase()} se implementará en la próxima fase.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="p-6 border-t bg-background shrink-0">
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="flex-1"
                            disabled
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-2xl w-full p-0">
                {renderForm()}
            </SheetContent>
        </Sheet>
    )
}
