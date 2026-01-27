"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Clock, Building2, Link as LinkIcon, FileText, Briefcase, ShieldCheck, Settings, LayoutDashboard, ChevronDown, Pencil } from "lucide-react"
import { Empresa } from "@/features/socios/types/socios-schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataDate } from "@/components/ui/data-date"
import { DataEnum } from "@/components/ui/data-enum"
import { NullCell } from "@/components/ui/null-cell"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, Star } from "lucide-react"
import { BusinessMetricsCard } from "./dashboard-cards/business-metrics-card"
import { RelationshipSummaryCard } from "./dashboard-cards/relationship-summary-card"
import { ComplianceStatusCard } from "./dashboard-cards/compliance-status-card"
import { EditCompanySectionSheet } from "./edit-company-section-sheet"

interface EmpresaTabsContentProps {
    empresa: Empresa
}

export function EmpresaTabsContent({ empresa }: EmpresaTabsContentProps) {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get("tab") || "overview"
    const [activeTab, setActiveTab] = useState(initialTab)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [editingSection, setEditingSection] = useState<string | null>(null)

    // Update active tab when URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const tabParam = searchParams.get("tab")
        if (tabParam && ["overview", "profile", "relations", "documents", "opportunities", "timeline", "settings"].includes(tabParam)) {
            setActiveTab(tabParam)
        }
    }, [searchParams])

    const handleEdit = (sectionKey: string) => {
        setEditingSection(sectionKey)
        setIsEditSheetOpen(true)
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b mb-6">
                <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto gap-0">
                    <TabsTrigger
                        value="overview"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden sm:inline">Resumen</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="profile"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
                    >
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="relations"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
                    >
                        <LinkIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Relaciones</span>
                    </TabsTrigger>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex h-full items-center justify-center gap-2 py-3 text-sm font-semibold text-muted-foreground hover:bg-accent/50 transition-colors border-b-2 border-transparent">
                                <ChevronDown className="h-4 w-4" />
                                <span className="hidden sm:inline">Más</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("timeline")}>
                                <Clock className="h-4 w-4" /> Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("documents")}>
                                <FileText className="h-4 w-4" /> Documentos
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("opportunities")}>
                                <Briefcase className="h-4 w-4" /> Oportunidades
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("settings")}>
                                <Settings className="h-4 w-4" /> Configuración
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TabsList>
            </div>

            {/* --- OVERVIEW TAB --- */}
            <TabsContent value="overview" className="mt-0 space-y-6">
                {/* 1. Alerts Area - Compact & Inline */}
                <div className="flex flex-col gap-2">
                    <Alert className="border-amber-500/20 border-l-amber-500 text-amber-900 bg-amber-50/30 py-2 px-3 shadow-sm [&>svg]:top-2.5 [&>svg]:left-3 [&>svg~*]:pl-6">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold uppercase tracking-tight">Documentación:</span>
                            <span className="text-amber-800/80">Falta copia de cámara de comercio actualizada.</span>
                        </div>
                    </Alert>

                    <Alert className="border-blue-500/20 border-l-blue-500 text-blue-900 bg-blue-50/30 py-2 px-3 shadow-sm [&>svg]:top-2.5 [&>svg]:left-3 [&>svg~*]:pl-6">
                        <Star className="h-3.5 w-3.5 text-blue-600" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold uppercase tracking-tight">Membresía:</span>
                            <span className="text-blue-800/80">La anualidad vence en 30 días. Generar factura de renovación.</span>
                        </div>
                    </Alert>
                </div>

                {/* 2. Dashboard de Inteligencia de Empresa - Grid de 3 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    <BusinessMetricsCard />
                    <RelationshipSummaryCard />
                    <ComplianceStatusCard />
                </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Historial Completo</CardTitle>
                        <CardDescription>Auditoría de todos los cambios y eventos de la empresa</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <ActivityItem
                                icon={<ShieldCheck className="h-4 w-4" />}
                                title="Perfil actualizado"
                                description="Se modificó la información del representante legal"
                                date="Hace 2 días"
                                user="Admin Sistema"
                            />
                            <ActivityItem
                                icon={<Building2 className="h-4 w-4" />}
                                title="Empresa creada"
                                description="Registro inicial en el sistema"
                                date={empresa.creado_en}
                                user="Sistema Web"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-0 outline-none">
                <div className="w-full py-2 space-y-6">
                    {/* TARJETA 1: IDENTIDAD LEGAL */}
                    <ProfileSection
                        title="Identidad Legal"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        onEdit={() => handleEdit("legal")}
                    >
                        <ProfileField
                            label="Razón Social"
                            value={empresa.razon_social}
                            bold
                        />
                        <ProfileField
                            label="Nombre Comercial"
                            value={empresa.nombre_comercial}
                        />
                        <ProfileField
                            label="NIT"
                            value={empresa.nit_completo || empresa.num_documento}
                            bold
                        />
                        <ProfileField
                            label="Dígito de Verificación"
                            value={empresa.digito_verificacion}
                        />
                        <ProfileField
                            label="Tipo de Sociedad"
                            value={<DataEnum value={empresa.tipo_sociedad} />}
                        />
                        <ProfileField
                            label="Fecha de Constitución"
                            value={<DataDate date={empresa.fecha_constitucion} />}
                        />
                        <ProfileField
                            label="País de Constitución"
                            value={empresa.pais_constitucion}
                        />
                    </ProfileSection>

                    {/* TARJETA 2: REGISTRO TRIBUTARIO */}
                    <ProfileSection
                        title="Registro Tributario"
                        icon={<FileText className="h-4 w-4" />}
                        onEdit={() => handleEdit("tax")}
                    >
                        <ProfileField
                            label="Número de Registro"
                            value={empresa.numero_registro}
                        />
                        <ProfileField
                            label="Código CIIU"
                            value={empresa.codigo_ciiu}
                        />
                        <ProfileField
                            label="Sector Industria"
                            value={empresa.sector_industria}
                        />
                        <ProfileField
                            label="Actividad Económica"
                            value={empresa.actividad_economica}
                        />
                        <ProfileField
                            label="Tamaño Empresa"
                            value={
                                empresa.tamano_empresa ? (
                                    <Badge variant="metadata-outline" className="capitalize">
                                        {empresa.tamano_empresa}
                                    </Badge>
                                ) : null
                            }
                        />
                    </ProfileSection>

                    {/* TARJETA 3: REPRESENTACIÓN LEGAL */}
                    <ProfileSection
                        title="Representación Legal"
                        icon={<Building2 className="h-4 w-4" />}
                        onEdit={() => handleEdit("representative")}
                    >
                        <ProfileField
                            label="Representante Legal"
                            value={empresa.nombre_representante_legal}
                            bold
                        />
                        <ProfileField
                            label="Cargo del Representante"
                            value={empresa.cargo_representante}
                        />
                        <ProfileField
                            label="ID Representante"
                            value={
                                empresa.representante_legal_id ? (
                                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                        {empresa.representante_legal_id.substring(0, 8)}...
                                    </code>
                                ) : null
                            }
                        />
                    </ProfileSection>

                    {/* TARJETA 4: DATOS DE CONTACTO */}
                    <ProfileSection
                        title="Datos de Contacto"
                        icon={<LinkIcon className="h-4 w-4" />}
                        onEdit={() => handleEdit("contact")}
                    >
                        <ProfileField
                            label="Email Principal"
                            value={empresa.email_principal}
                            bold
                        />
                        <ProfileField
                            label="Teléfono Principal"
                            value={empresa.telefono_principal}
                            bold
                        />
                        <ProfileField
                            label="Email Secundario"
                            value={empresa.email_secundario}
                        />
                        <ProfileField
                            label="Teléfono Secundario"
                            value={empresa.telefono_secundario}
                        />
                        <ProfileField
                            label="WhatsApp"
                            value={empresa.whatsapp}
                        />
                        <ProfileField
                            label="Sitio Web"
                            value={
                                empresa.website ? (
                                    <a
                                        href={empresa.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {empresa.website}
                                    </a>
                                ) : null
                            }
                        />
                    </ProfileSection>

                    {/* TARJETA 5: MÉTRICAS DE NEGOCIO */}
                    <ProfileSection
                        title="Métricas de Negocio"
                        icon={<Briefcase className="h-4 w-4" />}
                        onEdit={() => handleEdit("metrics")}
                    >
                        <ProfileField
                            label="Ingresos Anuales"
                            value={
                                empresa.ingresos_anuales ? (
                                    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(empresa.ingresos_anuales)
                                ) : null
                            }
                        />
                        <ProfileField
                            label="Número de Empleados"
                            value={empresa.numero_empleados}
                        />
                        <ProfileField
                            label="Clasificación"
                            value={
                                empresa.tamano_empresa ? (
                                    <Badge variant="metadata-outline" className="capitalize">
                                        {empresa.tamano_empresa}
                                    </Badge>
                                ) : null
                            }
                        />
                    </ProfileSection>
                </div>

                <EditCompanySectionSheet
                    empresa={empresa}
                    sectionKey={editingSection}
                    open={isEditSheetOpen}
                    onOpenChange={setIsEditSheetOpen}
                />
            </TabsContent>

            <TabsContent value="relations" className="mt-0">
                <Card className="shadow-none border">
                    <CardHeader className="bg-muted/40 border-b py-4">
                        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Relaciones Corporativas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <LinkIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">Gestión de Relaciones</p>
                        <p className="text-xs text-muted-foreground/60">Aquí gestionará accionistas, subsidiarias y empresas vinculadas.</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
                <Card className="shadow-none border">
                    <CardHeader className="bg-muted/40 border-b py-4">
                        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documentación Empresarial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">Sin documentos registrados</p>
                        <p className="text-xs text-muted-foreground/60">Cámara de comercio, RUT, estados financieros, certificaciones.</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-0">
                <Card className="shadow-none border">
                    <CardHeader className="bg-muted/40 border-b py-4">
                        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Oportunidades de Negocio
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">Sin oportunidades registradas</p>
                        <p className="text-xs text-muted-foreground/60">Cotizaciones, pedidos, contratos vinculados a esta empresa.</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
                <Card className="shadow-none border">
                    <CardHeader className="bg-muted/40 border-b py-4">
                        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Configuración de Cuenta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground italic">Próximamente: Gestión de accesos y preferencias de privacidad.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs >
    )
}

/**
 * ProfileSection (The "Pro" Card Style)
 */
function ProfileSection({ title, icon, children, onEdit }: { title: string, icon: React.ReactNode, children: React.ReactNode, onEdit?: () => void }) {
    return (
        <Card className="border shadow-none bg-background">
            <CardHeader className="border-b bg-muted/40 px-6 py-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                    <span className="text-muted-foreground/80">{icon}</span>
                    {title}
                </CardTitle>

                {onEdit && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={onEdit}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Editar sección</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                    {children}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * ProfileField (Flat Layout with Fixed Label Width)
 */
function ProfileField({ label, value, bold }: { label: string, value: React.ReactNode, bold?: boolean }) {
    return (
        <div className="grid grid-cols-[180px_1fr] items-baseline">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className={cn(
                "text-sm font-medium min-w-0 break-words",
                bold ? "text-foreground font-bold" : "text-foreground"
            )}>
                {value !== null && value !== undefined && value !== "" ? value : <NullCell />}
            </div>
        </div>
    )
}

function ActivityItem({ icon, title, description, date, user }: { icon: React.ReactNode, title: string, description: string, date: string, user: string }) {
    return (
        <div className="flex gap-4">
            <div className="h-full w-px bg-border absolute ml-4 -z-10 mt-6" />
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm shrink-0">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="flex items-center gap-2 pt-1">
                    <Badge variant="metadata-outline">@{user}</Badge>
                    <span className="text-[11px] text-muted-foreground">{date}</span>
                </div>
            </div>
        </div>
    )
}
