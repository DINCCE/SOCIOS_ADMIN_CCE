"use client"

import { useState } from "react"
import { Clock, User, Users, Receipt, GraduationCap, HeartPulse, ShieldCheck, Settings, LayoutDashboard, Heart, ChevronDown, MessageSquare, Pencil } from "lucide-react"
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
import { EditSectionSheet } from "./edit-section-sheet"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Star } from "lucide-react"
import { PartnerDashboard } from "./partner-dashboard"
import { FamilyGroupTab } from "@/components/socios/personas/family/family-group-tab"

interface PersonTabsContentProps {
    persona: Persona
}

// Type helpers for JSONB fields
type PerfilPreferencias = Record<string, unknown>
type DireccionResidencia = { direccion?: string; barrio?: string; ciudad?: string }

export function PersonTabsContent({ persona }: PersonTabsContentProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [editingSection, setEditingSection] = useState<string | null>(null)

    // Extract JSONB data with proper typing
    const prefs = (persona.perfil_preferencias || {}) as PerfilPreferencias
    const direccion = (prefs.direccion_residencia || {}) as DireccionResidencia

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
                            <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("relations")}>
                                <Users className="h-4 w-4" /> Relaciones
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

                {/* 2. Partner Dashboard - Advanced KPIs */}
                <PartnerDashboard />

                {/* 3. Responsive Grid for Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                    {/* Widget: Fidelity Highlights */}
                    <Card className="h-full border border-border bg-card">
                        <CardContent className="p-4 flex flex-col h-full">
                            <div className="space-y-1 mb-4">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Nivel Membresía</p>
                                <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-rose-500" />
                                    <span className="text-2xl font-bold tracking-tight text-foreground">Gold</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-border/40 flex justify-between gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Antigüedad</p>
                                    <p className="text-sm font-semibold text-foreground">2.4 años</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Visitas/Mes</p>
                                    <p className="text-sm font-semibold text-foreground">8.4</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Widget: Latest Activity with Timeline */}
                    <Card className="h-full border border-border bg-card">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                Resumen de Actividad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-4">
                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-1 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/60 before:via-border/60 before:to-transparent">
                                <div className="relative flex items-center gap-3">
                                    <div className="absolute left-0 w-2 h-2 rounded-full bg-primary border-2 border-white shadow-sm ring-2 ring-primary/20" />
                                    <div className="pl-6">
                                        <p className="text-sm font-medium text-foreground leading-none">Ingreso a Gimnasio</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Hoy, 10:45 AM</p>
                                    </div>
                                </div>
                                <div className="relative flex items-center gap-3">
                                    <div className="absolute left-0 w-2 h-2 rounded-full bg-muted-foreground/30 border-2 border-white shadow-sm" />
                                    <div className="pl-6">
                                        <p className="text-sm font-medium text-foreground leading-none">Reserva de Canva</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Ayer, 4:20 PM</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground mt-6 pt-3 border-t border-border/40">
                                +24 interacciones este mes
                            </p>
                        </CardContent>
                    </Card>

                    {/* Widget: Health & Emergency Highlight */}
                    <Card className="h-full border border-border bg-card">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                                <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                                Información Médica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-1 mb-4">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tipo Sangre</p>
                                <p className="text-xl font-bold text-foreground">{persona.tipo_sangre || "N/A"}</p>
                            </div>
                            <div className="pt-4 border-t border-border/40">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Contacto de Emergencia</p>
                                <p className="text-sm font-semibold text-foreground leading-tight">
                                    {persona.nombre_contacto_emergencia || "No asignado"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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
                    {/* SECCIÓN 1: IDENTIDAD LEGAL */}
                    <ProfileSection
                        title="Identificación Legal"
                        icon={<ShieldCheck className="h-4 w-4" />}
                    >
                        <ProfileField label="Tipo de Documento" value={persona.tipo_documento} />
                        <ProfileField label="Número de Documento" value={persona.numero_documento} bold />
                        <ProfileField label="Fecha de Expedición" value={<DataDate date={persona.fecha_expedicion} />} />
                        <ProfileField label="Lugar de Expedición" value={persona.lugar_expedicion} />
                        <ProfileField label="Nacionalidad" value={persona.nacionalidad || "Colombia"} />
                        <ProfileField
                            label="Estado Vital"
                            value={
                                <Badge variant={persona.estado_vital === 'vivo' ? 'status-active' : 'status-destructive'} showDot>
                                    {persona.estado_vital?.toUpperCase()}
                                </Badge>
                            }
                        />
                    </ProfileSection>

                    {/* SECCIÓN 2: BIOGRAFÍA PERSONAL */}
                    <ProfileSection
                        title="Información Personal"
                        icon={<User className="h-4 w-4" />}
                        onEdit={() => handleEdit("personal")}
                    >
                        <ProfileField label="Género" value={<DataEnum value={persona.genero} />} />
                        <ProfileField label="Fecha de Nacimiento" value={<DataDate date={persona.fecha_nacimiento} />} />
                        <ProfileField label="Lugar de Nacimiento" value={persona.lugar_nacimiento} />
                        <ProfileField label="Estado Civil" value={<DataEnum value={persona.estado_civil} />} />
                        <ProfileField label="Fecha de Aniversario" value={<DataDate date={persona.fecha_aniversario} />} />
                    </ProfileSection>

                    {/* SECCIÓN 3: RELACIÓN CON EL CLUB */}
                    <ProfileSection
                        title="Vínculo Institucional"
                        icon={<Star className="h-4 w-4" />}
                        onEdit={() => handleEdit("institutional")}
                    >
                        <ProfileField label="Código de Socio" value={<code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{persona.codigo}</code>} />
                        <ProfileField label="Fecha de Ingreso" value={<DataDate date={persona.fecha_socio} />} />
                        <ProfileField
                            label="Estado del Socio"
                            value={
                                <Badge variant={persona.estado === 'activo' ? 'status-active' : 'status-inactive'} showDot>
                                    <DataEnum value={persona.estado} />
                                </Badge>
                            }
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
                    </ProfileSection>

                    {/* SECCIÓN 4: EDUCACIÓN Y EMPLEO */}
                    <ProfileSection
                        title="Perfil Profesional"
                        icon={<GraduationCap className="h-4 w-4" />}
                        onEdit={() => handleEdit("professional")}
                    >
                        <ProfileField label="Nivel Educativo" value={<DataEnum value={persona.nivel_educacion} />} />
                        <ProfileField label="Profesión" value={persona.profesion} />
                        <ProfileField label="Ocupación Actual" value={persona.ocupacion} />
                    </ProfileSection>

                    {/* SECCIÓN 5: SALUD */}
                    <ProfileSection
                        title="Salud y Médica"
                        icon={<HeartPulse className="h-4 w-4" />}
                        onEdit={() => handleEdit("health")}
                    >
                        <ProfileField label="Grupo Sanguíneo" value={<span className="text-red-600 font-bold">{persona.tipo_sangre || "—"}</span>} />
                        <ProfileField label="EPS / Prepagada" value={persona.eps} />
                        <ProfileField label="Intereses Médicos" value={Object.keys(persona.perfil_intereses || {}).length > 0 ? Object.keys(persona.perfil_intereses).join(", ") : null} />
                    </ProfileSection>

                    {/* SECCIÓN 6: EMERGENCIA */}
                    <ProfileSection
                        title="Contacto de Emergencia"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        onEdit={() => handleEdit("emergency")}
                    >
                        <ProfileField label="Nombre Contacto" value={persona.nombre_contacto_emergencia} bold />
                        <ProfileField label="Parentesco" value={persona.relacion_emergencia} />
                        <ProfileField label="Protocolo" value={(prefs.protocolo_emergencia as string | undefined) || "Estándar"} />
                    </ProfileSection>

                    {/* SECCIÓN 7: UBICACIÓN */}
                    <ProfileSection
                        title="Residencia"
                        icon={<Settings className="h-4 w-4" />}
                        onEdit={() => handleEdit("residence")}
                    >
                        <ProfileField label="Dirección" value={direccion.direccion} />
                        <ProfileField label="Barrio" value={direccion.barrio} />
                        <ProfileField label="Ciudad" value={direccion.ciudad} />
                    </ProfileSection>

                    {/* SECCIÓN 8: PRESENCIA DIGITAL */}
                    <ProfileSection
                        title="Ecosistema Digital"
                        icon={<MessageSquare className="h-4 w-4" />}
                        onEdit={() => handleEdit("digital")}
                    >
                        <ProfileField label="Email Secundario" value={persona.email_secundario} />
                        <ProfileField label="WhatsApp" value={persona.whatsapp} />
                        <ProfileField
                            label="Redes Sociales"
                            value={
                                <div className="flex gap-2">
                                    {persona.linkedin_url && <Badge variant="metadata-outline">LinkedIn</Badge>}
                                    {persona.facebook_url && <Badge variant="metadata-outline">Facebook</Badge>}
                                    {persona.instagram_handle && <Badge variant="metadata-outline">@{persona.instagram_handle}</Badge>}
                                    {!persona.linkedin_url && !persona.facebook_url && !persona.instagram_handle && <NullCell />}
                                </div>
                            }
                        />
                    </ProfileSection>
                </div>

                <EditSectionSheet
                    persona={persona}
                    sectionKey={editingSection}
                    open={isEditSheetOpen}
                    onOpenChange={setIsEditSheetOpen}
                />
            </TabsContent>

            <TabsContent value="relations" className="m-0 h-full p-0 outline-none">
                <FamilyGroupTab />
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

function ActivitySnippet({ title, time }: { title: string, time: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{title}</p>
                <p className="text-[10px] text-muted-foreground italic">{time}</p>
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
