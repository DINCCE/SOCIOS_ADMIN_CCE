"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDown, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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

export function NewCompanySheet() {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: {
            razon_social: "",
            nombre_comercial: "",
            nit: "",
            digito_verificacion: "",
            tipo_sociedad: "SAS",
            email_principal: "",
            telefono_principal: "",
            email_secundario: "",
            telefono_secundario: "",
            whatsapp: "",
            website: "",
            fecha_constitucion: "",
            ciudad_constitucion: "",
            sector_industria: "",
            actividad_economica: "",
            tamano_empresa: "micro",
            estado: "activo",
        },
    })

    const router = useRouter()

    async function onSubmit(data: CompanyFormValues) {
        setIsPending(true)
        console.log("Submitting company data:", data)
        try {
            const result = await crearEmpresaFromCompanyFormValues(data)
            console.log("Create company result:", result)

            if (result.success === false) {
                toast.error("Error al crear empresa", {
                    description: result.message || "Error desconocido",
                })
                return
            }

            toast.success(result.message || "Empresa creada exitosamente")
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach((warning: string) => toast.warning(warning))
            }

            form.reset()
            setOpen(false)
            router.refresh()
        } catch (err) {
            console.error("Unexpected error submitting form:", err)
            toast.error("Error inesperado al procesar la solicitud")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Empresa
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-[90vw] p-0 flex flex-col h-full bg-background">
                {/* Header: Static */}
                <div className="z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4">
                    <SheetHeader className="text-left">
                        <SheetTitle>Nueva Empresa</SheetTitle>
                        <SheetDescription>
                            Ingrese los datos legales y de contacto. El código de socio se generará automáticamente.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Content: Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Relational / System Info */}
                            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                                <h3 className="font-medium text-sm text-foreground">Información del Sistema</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-xs font-medium text-muted-foreground">Código BP</span>
                                        <div className="font-mono text-sm">Autogenerado</div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-medium text-muted-foreground">Tipo de Actor</span>
                                        <div className="text-sm font-medium">Empresa / Persona Jurídica</div>
                                    </div>
                                </div>
                            </div>

                            {/* Legal Identity Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Identidad Legal
                                    <Separator className="flex-1" />
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="razon_social"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Razón Social <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Empresa Ejemplo S.A.S." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nombre_comercial"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Comercial (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Mi Marca" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NIT <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input className="font-mono" placeholder="900123456" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tipo_sociedad"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Sociedad <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="SAS">S.A.S.</SelectItem>
                                                        <SelectItem value="SA">S.A.</SelectItem>
                                                        <SelectItem value="LTDA">Ltda.</SelectItem>
                                                        <SelectItem value="EU">E.U.</SelectItem>
                                                        <SelectItem value="COOP">Cooperativa</SelectItem>
                                                        <SelectItem value="ESAL">ESAL</SelectItem>
                                                        <SelectItem value="OTRO">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tamano_empresa"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tamaño Empresa</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="micro">Micro</SelectItem>
                                                        <SelectItem value="pequena">Pequeña</SelectItem>
                                                        <SelectItem value="mediana">Mediana</SelectItem>
                                                        <SelectItem value="grande">Grande</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Contacto
                                    <Separator className="flex-1" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email_principal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Principal <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="admin@empresa.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="telefono_principal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono Principal <span className="text-destructive">*</span></FormLabel>
                                                <FormControl>
                                                    <Input type="tel" placeholder="601..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email_secundario"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Secundario (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="contacto@empresa.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="whatsapp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp</FormLabel>
                                                <FormControl>
                                                    <Input type="tel" placeholder="300..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sitio Web</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://www.empresa.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Additional Info Section */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    Información Adicional
                                    <Separator className="flex-1" />
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fecha_constitucion"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha Constitución</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(new Date(field.value + "T00:00:00"), "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccione una fecha</span>
                                                                )}
                                                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                            locale={es}
                                                            captionLayout="dropdown"
                                                            fromYear={1900}
                                                            toYear={new Date().getFullYear()}
                                                            classNames={{
                                                                caption_dropdowns: "flex justify-center gap-1",
                                                                caption_label: "hidden",
                                                                table: "w-full border-collapse space-y-1",
                                                                head_row: "flex",
                                                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                                                row: "flex w-full mt-2",
                                                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                                day: cn(
                                                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                                                                ),
                                                                day_range_end: "day-range-end",
                                                                day_selected:
                                                                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                                                day_today: "bg-accent text-accent-foreground",
                                                                day_outside:
                                                                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                                                day_disabled: "text-muted-foreground opacity-50",
                                                                day_range_middle:
                                                                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                                day_hidden: "invisible",
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ciudad_constitucion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ciudad Constitución</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Bogotá" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="sector_industria"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sector Industria</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione sector..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="tecnologia">Tecnología</SelectItem>
                                                        <SelectItem value="servicios">Servicios</SelectItem>
                                                        <SelectItem value="manufactura">Manufactura</SelectItem>
                                                        <SelectItem value="comercio">Comercio</SelectItem>
                                                        <SelectItem value="agricultura">Agricultura</SelectItem>
                                                        <SelectItem value="construccion">Construcción</SelectItem>
                                                        <SelectItem value="salud">Salud</SelectItem>
                                                        <SelectItem value="educacion">Educación</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="actividad_economica"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Actividad Económica</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione actividad..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="desarrollo_software">Desarrollo de Software</SelectItem>
                                                        <SelectItem value="consultoria">Consultoría</SelectItem>
                                                        <SelectItem value="marketing">Marketing Digital</SelectItem>
                                                        <SelectItem value="logistica">Logística y Transporte</SelectItem>
                                                        <SelectItem value="finanzas">Servicios Financieros</SelectItem>
                                                        <SelectItem value="retail">Venta al por menor (Retail)</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                        </form>
                    </Form>
                </div>

                {/* Footer: Static */}
                <SheetFooter className="border-t bg-background/80 backdrop-blur-md p-4 sm:justify-between flex-row items-center gap-4">
                    <SheetClose asChild>
                        <Button variant="ghost" type="button">Cancelar</Button>
                    </SheetClose>
                    <Button onClick={form.handleSubmit(onSubmit, (errors) => {
                        console.error("Form Validation Errors:", errors)
                        toast.error("Por favor completa los campos obligatorios", {
                            description: Object.values(errors).map(e => e.message).join(", ")
                        })
                    })} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Empresa
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
