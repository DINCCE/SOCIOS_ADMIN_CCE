"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
            nit: "",
            digito_verificacion: "",
            tipo_sociedad: "SAS",
            nombre_comercial: "",
            fecha_constitucion: "",
            ciudad_constitucion: "",
            pais_constitucion: "CO",
            numero_registro: "",
            codigo_ciiu: "",
            sector_industria: "",
            actividad_economica: "",
            tamano_empresa: "",
            representante_legal_id: "",
            cargo_representante: "",
            email_principal: "",
            telefono_principal: "",
            email_secundario: "",
            telefono_secundario: "",
            whatsapp: "",
            website: "",
            linkedin_url: "",
            facebook_url: "",
            instagram_handle: "",
            twitter_handle: "",
            logo_url: "",
            ingresos_anuales: 0,
            numero_empleados: 0,
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
                            <div className="space-y-6">
                                {/* Identity Section */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-sm flex items-center gap-2">
                                        Identidad Legal
                                        <Separator className="flex-1" />
                                    </h3>

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
                                            name="digito_verificacion"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>DV</FormLabel>
                                                    <FormControl>
                                                        <Input className="font-mono" placeholder="0" {...field} maxLength={1} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                            <SelectItem value="FUNDACION">Fundación</SelectItem>
                                                            <SelectItem value="CORP">Corporación</SelectItem>
                                                            <SelectItem value="ONG">ONG</SelectItem>
                                                            <SelectItem value="SUCURSAL">Sucursal Extranjera</SelectItem>
                                                            <SelectItem value="OTRO">Otro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="nombre_comercial"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre Comercial</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nombre de Marca" {...field} />
                                                    </FormControl>
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
                                                    <FormLabel>Email Secundario</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="secundario@empresa.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="telefono_secundario"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Teléfono Secundario</FormLabel>
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
                                            name="whatsapp"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>WhatsApp</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="300..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sitio Web</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Corporate Information */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-sm flex items-center gap-2">
                                        Información Corporativa
                                        <Separator className="flex-1" />
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="fecha_constitucion"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fecha de Constitución</FormLabel>
                                                    <FormControl>
                                                        <DatePicker
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="Seleccione fecha"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ciudad_constitucion"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ciudad de Constitución</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Bogotá, etc." {...field} />
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
                                                    <FormLabel>Sector / Industria</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Tecnología, etc." {...field} />
                                                    </FormControl>
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
                                                    <FormControl>
                                                        <Input placeholder="Desarrollo de software, etc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                            <SelectItem value="micro">Microempresa</SelectItem>
                                                            <SelectItem value="pequena">Pequeña</SelectItem>
                                                            <SelectItem value="mediana">Mediana</SelectItem>
                                                            <SelectItem value="grande">Grande</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="representante_legal_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ID Representante Legal</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="UUID..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Social Networks */}
                                <div className="space-y-4 pb-4">
                                    <h3 className="font-medium text-sm flex items-center gap-2">
                                        Redes Sociales
                                        <Separator className="flex-1" />
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="linkedin_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>LinkedIn</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="instagram_handle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Instagram</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="@usuario" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
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
        </Sheet >
    )
}
