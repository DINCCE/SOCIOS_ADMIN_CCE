"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Clock, User, Users, Receipt, HeartPulse, ShieldCheck, Settings, LayoutDashboard, ChevronDown, MessageSquare, Pencil } from "lucide-react"
import { FamilyGroupSection } from "./family-group-section"
import { Persona } from "@/features/socios/types/socios-schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataDate } from "@/components/ui/data-date"
import { DataEnum } from "@/components/ui/data-enum"
import { NullCell } from "@/components/ui/null-cell"
import { cn } from "@/lib/utils"
import { EditSectionDialog } from "./edit-section-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Alert } from "@/components/ui/alert"
import { AlertCircle, Star } from "lucide-react"
import { FinancialEcosystemCard } from "./dashboard-cards/financial-ecosystem-card"
import { EngagementLoyaltyCard } from "./dashboard-cards/engagement-loyalty-card"
import { PreferencesServicesCard } from "./dashboard-cards/preferences-services-card"

interface PersonTabsContentProps {
    persona: Persona
}

export function PersonTabsContent({ persona }: PersonTabsContentProps) {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get("tab") || "overview"
    const [activeTab, setActiveTab] = useState(initialTab)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [editingSection, setEditingSection] = useState<string | null>(null)

    // Update active tab when URL changes
    useEffect(() => {
        const tabParam = searchParams.get("tab")
        if (tabParam && ["overview", "profile", "family", "consumptions", "communications", "timeline", "settings"].includes(tabParam)) {
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
                <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto gap-0">
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
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="communications"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Comunicaciones</span>
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
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("family")}>
                                <Users className="h-4 w-4" /> Grupo Familiar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("consumptions")}>
                                <Receipt className="h-4 w-4" /> Consumos
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
                            <span className="text-amber-800/80">Falta copia de carnet de salud vigente para el archivo físico.</span>
                        </div>
                    </Alert>

                    <Alert className="border-blue-500/20 border-l-blue-500 text-blue-900 bg-blue-50/30 py-2 px-3 shadow-sm [&>svg]:top-2.5 [&>svg]:left-3 [&>svg~*]:pl-6">
                        <Star className="h-3.5 w-3.5 text-blue-600" />
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold uppercase tracking-tight">Membresía:</span>
                            <span className="text-blue-800/80">La anualidad vence en 15 días. Generar factura de renovación.</span>
                        </div>
                    </Alert>
                </div>

                {/* 2. Dashboard de Inteligencia de Socio - Grid de 3 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    <FinancialEcosystemCard />
                    <EngagementLoyaltyCard />
                    <PreferencesServicesCard />
                </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Historial Completo</CardTitle>
                        <CardDescription>Auditoría de todos los cambios y eventos del socio</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <ActivityItem
                                icon={<ShieldCheck className="h-4 w-4" />}
                                title="Registro actualizado"
                                description="Se modificó la dirección de residencia"
                                date="Hace 2 días"
                                user="Admin Sistema"
                            />
                            <ActivityItem
                                icon={<User className="h-4 w-4" />}
                                title="Socio creado"
                                description="Registro inicial en el sistema"
                                date={persona.creado_en}
                                user="Sistema Web"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-0 outline-none">
                <div className="w-full py-2 space-y-6">
                    {/* TARJETA 1: IDENTIDAD & DATOS CIVILES */}
                    <ProfileSection
                        title="Identificación Personal"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        onEdit={() => handleEdit("identity")}
                    >
                        <ProfileField
                            label="Nombre Completo"
                            value={persona.nombre_completo}
                            bold
                        />
                        <ProfileField
                            label="Tipo de Documento"
                            value={persona.tipo_documento}
                        />
                        <ProfileField
                            label="Número de Documento"
                            value={persona.numero_documento}
                            bold
                        />
                        <ProfileField
                            label="Fecha de Expedición"
                            value={<DataDate date={persona.fecha_expedicion} />}
                        />
                        <ProfileField
                            label="Lugar de Expedición"
                            value={persona.lugar_expedicion}
                        />
                        <ProfileField
                            label="Nacionalidad"
                            value={persona.nacionalidad || "Colombia"}
                        />
                        <ProfileField
                            label="Género"
                            value={<DataEnum value={persona.genero} />}
                        />
                        <ProfileField
                            label="Fecha de Nacimiento"
                            value={<DataDate date={persona.fecha_nacimiento} />}
                        />
                        <ProfileField
                            label="Lugar de Nacimiento"
                            value={persona.lugar_nacimiento}
                        />
                        <ProfileField
                            label="Estado Civil"
                            value={<DataEnum value={persona.estado_civil} />}
                        />
                        <ProfileField
                            label="Tipo de Sangre"
                            value={
                                persona.tipo_sangre ? (
                                    <span className="text-red-600 font-bold">{persona.tipo_sangre}</span>
                                ) : null
                            }
                        />
                        <ProfileField
                            label="Estado Vital"
                            value={
                                <Badge variant={persona.estado_vital === 'vivo' ? 'status-active' : 'status-destructive'} showDot>
                                    {persona.estado_vital?.toUpperCase()}
                                </Badge>
                            }
                        />
                    </ProfileSection>

                    {/* TARJETA 2: PERFIL SOCIO-PROFESIONAL & CONTACTO */}
                    <ProfileSection
                        title="Vinculación & Contacto"
                        icon={<User className="h-4 w-4" />}
                        onEdit={() => handleEdit("profile")}
                    >
                        {/* Datos del Club */}
                        <div className="col-span-2">
                            <div className="border-b border-border/40 pb-3 mb-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                    Datos del Club
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                                    <ProfileField
                                        label="Código de Socio"
                                        value={
                                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {persona.codigo}
                                            </code>
                                        }
                                    />
                                    <ProfileField
                                        label="Estado del Socio"
                                        value={
                                            <Badge variant={persona.estado === 'activo' ? 'status-active' : 'status-inactive'} showDot>
                                                <DataEnum value={persona.estado} />
                                            </Badge>
                                        }
                                    />
                                    <ProfileField
                                        label="Fecha de Ingreso"
                                        value={<DataDate date={persona.fecha_socio} />}
                                    />
                                    <ProfileField
                                        label="Fecha de Aniversario"
                                        value={<DataDate date={persona.fecha_aniversario} />}
                                    />
                                    <ProfileField
                                        label="Etiquetas"
                                        value={
                                            <div className="flex flex-wrap gap-1.5">
                                                {(persona.tags || []).length > 0 ? (
                                                    persona.tags.map(tag => (
                                                        <Badge key={tag} variant="metadata-outline">{tag}</Badge>
                                                    ))
                                                ) : (
                                                    <NullCell />
                                                )}
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Perfil Profesional */}
                        <div className="col-span-2">
                            <div className="border-b border-border/40 pb-3 mb-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                    Perfil Profesional
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                                    <ProfileField
                                        label="Nivel Educativo"
                                        value={<DataEnum value={persona.nivel_educacion} />}
                                    />
                                    <ProfileField
                                        label="Profesión"
                                        value={persona.profesion}
                                    />
                                    <ProfileField
                                        label="Ocupación Actual"
                                        value={persona.ocupacion}
                                    />
                                    <ProfileField
                                        label="Redes Sociales"
                                        value={
                                            <div className="flex flex-wrap gap-1.5">
                                                {persona.linkedin_url && <Badge variant="metadata-outline">LinkedIn</Badge>}
                                                {persona.facebook_url && <Badge variant="metadata-outline">Facebook</Badge>}
                                                {persona.instagram_handle && <Badge variant="metadata-outline">@{persona.instagram_handle}</Badge>}
                                                {persona.twitter_handle && <Badge variant="metadata-outline">@{persona.twitter_handle}</Badge>}
                                                {!persona.linkedin_url && !persona.facebook_url && !persona.instagram_handle && !persona.twitter_handle && <NullCell />}
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medios de Contacto */}
                        <div className="col-span-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Medios de Contacto
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                                <ProfileField
                                    label="Email Principal"
                                    value={persona.email_principal}
                                    bold
                                />
                                <ProfileField
                                    label="Teléfono Principal"
                                    value={persona.telefono_principal}
                                    bold
                                />
                                <ProfileField
                                    label="Email Secundario"
                                    value={persona.email_secundario}
                                />
                                <ProfileField
                                    label="Teléfono Secundario"
                                    value={persona.telefono_secundario}
                                />
                                <ProfileField
                                    label="WhatsApp"
                                    value={persona.whatsapp}
                                />
                            </div>
                        </div>
                    </ProfileSection>

                    {/* TARJETA 3: SEGURIDAD Y BIENESTAR */}
                    <ProfileSection
                        title="Salud & Emergencia"
                        icon={<HeartPulse className="h-4 w-4" />}
                        onEdit={() => handleEdit("security")}
                    >
                        {/* Información Médica */}
                        <div className="col-span-2">
                            <div className="border-b border-border/40 pb-3 mb-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                    Información Médica
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                                    <ProfileField
                                        label="Grupo Sanguíneo"
                                        value={
                                            persona.tipo_sangre ? (
                                                <span className="text-red-600 font-bold">{persona.tipo_sangre}</span>
                                            ) : null
                                        }
                                    />
                                    <ProfileField
                                        label="EPS / Prepagada"
                                        value={persona.eps}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contacto de Emergencia */}
                        <div className="col-span-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Contacto de Emergencia
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                                <ProfileField
                                    label="Nombre Contacto"
                                    value={persona.nombre_contacto_emergencia}
                                    bold
                                />
                                <ProfileField
                                    label="Parentesco"
                                    value={persona.relacion_emergencia}
                                />
                                <ProfileField
                                    label="ID Contacto"
                                    value={
                                        persona.contacto_emergencia_id ? (
                                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {persona.contacto_emergencia_id.substring(0, 8)}...
                                            </code>
                                        ) : null
                                    }
                                />
                            </div>
                        </div>
                    </ProfileSection>
                </div>

                <EditSectionDialog
                    persona={persona}
                    sectionKey={editingSection}
                    open={isEditSheetOpen}
                    onOpenChange={setIsEditSheetOpen}
                />
            </TabsContent>

            <TabsContent value="family" className="mt-0">
                <FamilyGroupSection bp_id={persona.id} organizacion_id={persona.organizacion_id} />
            </TabsContent>

            <TabsContent value="consumptions" className="mt-0">
                <Card className="shadow-none border border-orange-100 bg-orange-50/10">
                    <CardHeader className="bg-orange-50/20 border-b border-orange-100 py-4">
                        <CardTitle className="text-base font-semibold tracking-tight text-orange-900 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Módulo de Consumos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <Receipt className="h-10 w-10 text-orange-300 mb-4" />
                        <p className="text-sm font-medium text-orange-950">Centralización de consumos</p>
                        <p className="text-xs text-orange-900/60 max-w-[280px]">Restaurantes, eventos y servicios en tiempo real.</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="communications" className="mt-0">
                <Card className="shadow-none border">
                    <CardHeader className="bg-muted/40 border-b py-4">
                        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Comunicaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-4" />
                            <p className="text-sm font-medium text-muted-foreground">Sin registros de comunicación</p>
                            <p className="text-xs text-muted-foreground/60">Aquí verás logs de WhatsApp, Email y notificaciones Push</p>
                        </div>
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
 * NEW: ProfileSection (The "Pro" Card Style)
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
 * NEW: ProfileField (Flat Layout with Fixed Label Width)
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
