"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { crearEmpresaFromCompanyFormValues } from "@/app/actions/empresas"
import { companySchema, type CompanyFormValues } from "@/lib/schemas/company-schema"

interface NewCompanyDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: (bp_id: string) => void
}

export function NewCompanyDialog({ open: controlledOpen, onOpenChange, onSuccess }: NewCompanyDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    // Use controlled open if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const form = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: {
            razon_social: "",
            nombre_comercial: "",
            nit: "",
            tipo_sociedad: "SAS",
            email_principal: "",
            telefono_principal: "",
            estado: "activo",
        },
    })

    async function onSubmit(data: CompanyFormValues) {
        setIsPending(true)
        try {
            const result = await crearEmpresaFromCompanyFormValues(data)

            if (result.success === false) {
                toast.error("Error al crear empresa", {
                    description: result.message || "Error desconocido",
                })
                return
            }

            toast.success("Empresa creada correctamente. Completa su perfil ahora.")

            form.reset()
            setOpen(false)

            // Call onSuccess callback if provided (for nested dialog usage)
            if (onSuccess && result.bp_id) {
                onSuccess(result.bp_id)
            }
            // Otherwise navigate to the newly created company detail page (default behavior)
            else if (result.bp_id) {
                router.push(`/admin/socios/empresas/${result.bp_id}?tab=profile`)
            } else {
                router.refresh()
            }
        } catch (err) {
            console.error("Unexpected error submitting form:", err)
            toast.error("Error inesperado al procesar la solicitud")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Only show trigger if not controlled (i.e., used as standalone) */}
            {controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Empresa
                    </Button>
                </DialogTrigger>
            )}
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm bg-background/40" />
                <DialogContent className="max-w-xl h-[85vh] border border-border/50 shadow-2xl rounded-xl overflow-hidden p-0 flex flex-col [&>button:last-child]:hidden">
                    {/* Custom close button in top-right */}
                    <div className="absolute top-6 right-6 z-10">
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Header Section */}
                    <div className="bg-background shrink-0 px-8 py-6 border-b">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Nueva Empresa</DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground mt-1">
                                Ingresa los datos básicos para el alta. Podrás completar el perfil detallado después.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Form Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-8 py-8">
                        <Form {...form}>
                            <form id="new-company-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                                {/* SECCIÓN 1: IDENTIDAD LEGAL */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">1</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Identidad Legal</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="razon_social"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Razón Social</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={cn(
                                                            "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                        )}
                                                        placeholder="Empresa Ejemplo S.A.S."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="nombre_comercial"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Nombre Comercial (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={cn(
                                                            "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                        )}
                                                        placeholder="Ej: MiEmpresa"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="nit"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">NIT</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className={cn(
                                                            "h-11 bg-muted/30 border-muted-foreground/20 font-mono tracking-widest focus-visible:ring-primary/20",
                                                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                        )}
                                                        placeholder="900123456"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tipo_sociedad"
                                        render={({ field, fieldState }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Tipo de Sociedad</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className={cn(
                                                            "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                                                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                        )}>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="SAS">S.A.S.</SelectItem>
                                                        <SelectItem value="SA">S.A.</SelectItem>
                                                        <SelectItem value="LTDA">Ltda.</SelectItem>
                                                        <SelectItem value="EU">E.U.</SelectItem>
                                                        <SelectItem value="COOP">Cooperativa</SelectItem>
                                                        <SelectItem value="FUNDACION">Fundación</SelectItem>
                                                        <SelectItem value="CORP">Corporación</SelectItem>
                                                        <SelectItem value="ONG">ONG</SelectItem>
                                                        <SelectItem value="SUCURSAL">Sucursal Extranjera</SelectItem>
                                                        <SelectItem value="OTRO">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* SECCIÓN 2: DATOS DE CONTACTO */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-primary font-bold text-sm">2</span>
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Datos de Contacto</h3>
                                        <Separator className="flex-1" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="email_principal"
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Correo Electrónico</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className={cn(
                                                                "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                                                                fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                                                            )}
                                                            type="email"
                                                            placeholder="admin@empresa.com"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px]" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex-1">
                                            <PhoneInput
                                                name="telefono_principal"
                                                label="Teléfono Principal"
                                                defaultCountry="CO"
                                                className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                        <Button
                            type="submit"
                            form="new-company-form"
                            className="w-full h-12 font-bold tracking-tight text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Procesando Alta...
                                </>
                            ) : (
                                "Crear Empresa"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
