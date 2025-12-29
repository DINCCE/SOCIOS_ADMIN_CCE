"use client"

import { useState } from "react"
import { Clock, User, Users, Receipt, GraduationCap, HeartPulse, ShieldCheck, Settings, LayoutDashboard, Heart, Star, ChevronDown, MessageSquare, Pencil } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PersonTabsContentProps {
    persona: Persona
}

export function PersonTabsContent({ persona }: PersonTabsContentProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const [openSection, setOpenSection] = useState<string | null>(null)

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Widget: Fidelity Highlights */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500" />
                                Programa de Fidelidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center py-2">
                                <span className="text-3xl font-bold">Gold</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Nivel de Membresía</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Antigüedad</p>
                                    <p className="font-semibold">2.4 años</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Visitas/Mes</p>
                                    <p className="font-semibold">8.4</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Widget: Family Snippet */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Grupo Familiar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">ML</div>
                                    <span className="font-medium truncate max-w-[100px]">María López</span>
                                </div>
                                <Badge variant="secondary" className="text-[9px] h-4">CÓNYUGE</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">CP</div>
                                    <span className="font-medium truncate max-w-[100px]">Camilo Pérez</span>
                                </div>
                                <Badge variant="secondary" className="text-[9px] h-4">HIJO</Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-[10px] h-7 mt-2" asChild>
                                <button onClick={() => { }}>Gestionar Relaciones</button>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Widget: Quick Stats / Latest Activity */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Resumen de Actividad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <ActivitySnippet
                                    title="Ingreso a Gimnasio"
                                    time="Hoy, 10:45 AM"
                                />
                                <ActivitySnippet
                                    title="Reserva de Canva"
                                    time="Ayer, 4:20 PM"
                                />
                            </div>
                            <div className="pt-2 border-t text-center">
                                <p className="text-[11px] font-medium text-muted-foreground">Más de 24 interacciones este mes</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Widget: Health & Emergency Highlight */}
                    <Card className="shadow-sm border-red-100 bg-red-50/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800">
                                <HeartPulse className="h-4 w-4" />
                                Salud Crítica
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-red-900/70">Tipo Sangre:</span>
                                <span className="text-sm font-bold text-red-600">{persona.tipo_sangre || "N/A"}</span>
                            </div>
                            <div className="text-xs border-t border-red-100 pt-2">
                                <p className="font-semibold text-red-900">Contacto de Emergencia:</p>
                                <p className="text-red-800/80">{persona.nombre_contacto_emergencia || "No asignado"}</p>
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
                <div className="max-w-5xl mx-auto py-4 space-y-4">
                    {/* SECCIÓN 1: IDENTIDAD LEGAL */}
                    <AccordionSection
                        id="legal"
                        title="Identificación Legal"
                        icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}
                        isOpen={openSection === "legal"}
                        onToggle={() => setOpenSection(openSection === "legal" ? null : "legal")}
                    >
                        <DataRow label="Tipo de Documento" value={persona.tipo_documento} />
                        <DataRow label="Número" value={persona.numero_documento} bold />
                        <DataRow label="Fecha de Expedición" value={persona.fecha_expedicion} />
                        <DataRow label="Lugar de Expedición" value={persona.lugar_expedicion} />
                        <DataRow label="Nacionalidad" value={persona.nacionalidad || "Colombia"} />
                        <DataRow
                            label="Estado Vital"
                            value={
                                <Badge variant={persona.estado_vital === 'vivo' ? 'outline' : 'destructive'} className="text-[10px] py-0 font-semibold h-5">
                                    {persona.estado_vital?.toUpperCase()}
                                </Badge>
                            }
                        />
                    </AccordionSection>

                    {/* SECCIÓN 2: BIOGRAFÍA PERSONAL */}
                    <AccordionSection
                        id="personal"
                        title="Información Personal"
                        icon={<User className="h-4 w-4 text-purple-600" />}
                        isOpen={openSection === "personal"}
                        onToggle={() => setOpenSection(openSection === "personal" ? null : "personal")}
                    >
                        <DataRow label="Género" value={persona.genero} capitalize />
                        <DataRow label="Fecha de Nacimiento" value={persona.fecha_nacimiento} />
                        <DataRow label="Lugar de Nacimiento" value={persona.lugar_nacimiento} />
                        <DataRow label="Estado Civil" value={persona.estado_civil} capitalize />
                        <DataRow label="Fecha de Aniversario" value={persona.fecha_aniversario} />
                    </AccordionSection>

                    {/* SECCIÓN 3: RELACIÓN CON EL CLUB */}
                    <AccordionSection
                        id="club"
                        title="Vínculo Institucional"
                        icon={<Star className="h-4 w-4 text-yellow-600" />}
                        isOpen={openSection === "club"}
                        onToggle={() => setOpenSection(openSection === "club" ? null : "club")}
                    >
                        <DataRow label="Código de Socio" value={<code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{persona.codigo}</code>} />
                        <DataRow label="Fecha de Ingreso" value={persona.fecha_socio} />
                        <DataRow
                            label="Estado del Socio"
                            value={
                                <Badge className="text-[10px] py-0 h-5" variant={persona.estado === 'activo' ? 'default' : 'secondary'}>
                                    {persona.estado?.toUpperCase()}
                                </Badge>
                            }
                        />
                        <DataRow
                            label="Etiquetas de Segmentación"
                            value={
                                <div className="flex flex-wrap gap-1.5">
                                    {(persona.tags || []).length > 0 ? (
                                        persona.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] font-medium bg-secondary/50">{tag}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground italic">Sin etiquetas</span>
                                    )}
                                </div>
                            }
                        />
                    </AccordionSection>

                    {/* SECCIÓN 4: EDUCACIÓN Y EMPLEO */}
                    <AccordionSection
                        id="professional"
                        title="Perfil Profesional"
                        icon={<GraduationCap className="h-4 w-4 text-emerald-600" />}
                        isOpen={openSection === "professional"}
                        onToggle={() => setOpenSection(openSection === "professional" ? null : "professional")}
                    >
                        <DataRow label="Nivel Educativo" value={persona.nivel_educacion} capitalize />
                        <DataRow label="Profesión" value={persona.profesion} />
                        <DataRow label="Ocupación Actual" value={persona.ocupacion} />
                    </AccordionSection>

                    {/* SECCIÓN 5: SALUD */}
                    <AccordionSection
                        id="health"
                        title="Salud y Médica"
                        icon={<HeartPulse className="h-4 w-4 text-red-600" />}
                        isOpen={openSection === "health"}
                        onToggle={() => setOpenSection(openSection === "health" ? null : "health")}
                    >
                        <DataRow label="Grupo Sanguíneo" value={<span className="text-red-600 font-bold">{persona.tipo_sangre || "—"}</span>} />
                        <DataRow label="EPS" value={persona.eps} />
                        <DataRow label="Intereses Médicos" value={Object.keys(persona.perfil_intereses || {}).length > 0 ? Object.keys(persona.perfil_intereses).join(", ") : "Sin registrar"} />
                    </AccordionSection>

                    {/* SECCIÓN 6: EMERGENCIA */}
                    <AccordionSection
                        id="emergency"
                        title="Contacto de Emergencia"
                        icon={<ShieldCheck className="h-4 w-4 text-orange-600" />}
                        isOpen={openSection === "emergency"}
                        onToggle={() => setOpenSection(openSection === "emergency" ? null : "emergency")}
                    >
                        <DataRow label="Nombre del Contacto" value={persona.nombre_contacto_emergencia} bold />
                        <DataRow label="Parentesco / Relación" value={persona.relacion_emergencia} />
                        <DataRow label="Protocolo Emergencia" value={(persona.perfil_preferencias as any)?.protocolo_emergencia || "Estándar"} />
                    </AccordionSection>

                    {/* SECCIÓN 7: UBICACIÓN */}
                    <AccordionSection
                        id="location"
                        title="Información de Residencia"
                        icon={<Settings className="h-4 w-4 text-muted-foreground" />}
                        isOpen={openSection === "location"}
                        onToggle={() => setOpenSection(openSection === "location" ? null : "location")}
                    >
                        <DataRow label="Dirección Principal" value={(persona.perfil_preferencias as any)?.direccion_residencia?.direccion} />
                        <DataRow label="Barrio" value={(persona.perfil_preferencias as any)?.direccion_residencia?.barrio} />
                        <DataRow label="Ciudad" value={(persona.perfil_preferencias as any)?.direccion_residencia?.ciudad} />
                        <DataRow label="Dirección de Correspondencia" value={(persona.perfil_preferencias as any)?.direccion_correspondencia?.direccion || "Misma que residencia"} />
                    </AccordionSection>

                    {/* SECCIÓN 8: PRESENCIA DIGITAL */}
                    <AccordionSection
                        id="digital"
                        title="Ecosistema Digital"
                        icon={<Settings className="h-4 w-4 text-muted-foreground" />}
                        isOpen={openSection === "digital"}
                        onToggle={() => setOpenSection(openSection === "digital" ? null : "digital")}
                    >
                        <DataRow label="Email Secundario" value={persona.email_secundario} />
                        <DataRow label="WhatsApp" value={persona.whatsapp} />
                        <DataRow
                            label="Redes Sociales"
                            value={
                                <div className="flex gap-2">
                                    {persona.linkedin_url && <Badge variant="outline">LinkedIn</Badge>}
                                    {persona.facebook_url && <Badge variant="outline">Facebook</Badge>}
                                    {persona.instagram_handle && <Badge variant="outline">@{persona.instagram_handle}</Badge>}
                                </div>
                            }
                        />
                    </AccordionSection>

                    {/* SECCIÓN 9: MÉTRICAS Y SEGMENTACIÓN */}
                    <AccordionSection
                        id="metrics"
                        title="Métricas y Analytics"
                        icon={<LayoutDashboard className="h-4 w-4 text-muted-foreground" />}
                        isOpen={openSection === "metrics"}
                        onToggle={() => setOpenSection(openSection === "metrics" ? null : "metrics")}
                    >
                        <DataRow label="Intereses Declarados" value={Object.keys(persona.perfil_intereses || {}).length > 0 ? Object.keys(persona.perfil_intereses).join(", ") : "Sin intereses mapeados"} />
                        <DataRow label="Score IA" value={(persona.perfil_metricas as any)?.score || "Sin analizar"} />
                    </AccordionSection>
                </div>
            </TabsContent>

            <TabsContent value="relations" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Red de Relaciones</CardTitle>
                        <CardDescription>Business Partners vinculados a este socio</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted">
                            <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No hay relaciones vinculadas aún</p>
                            <p className="text-xs text-muted-foreground/70">Aquí se mostrarán hijos, cónyuges y relaciones laborales</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="consumptions" className="mt-0">
                <Card className="overflow-hidden border-orange-100 bg-orange-50/20">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center text-center">
                        <Receipt className="h-12 w-12 text-orange-400 mb-4 opacity-70" />
                        <h3 className="text-lg font-semibold text-orange-950">Módulo de Consumos</h3>
                        <p className="text-sm text-orange-900/70 max-w-[320px]">
                            Centralización de consumos en restaurantes, eventos y servicios en tiempo real.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="communications" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Comunicaciones</CardTitle>
                        <CardDescription>Historial de contactos y mensajes enviados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">Sin registros de comunicación</p>
                            <p className="text-xs text-muted-foreground/70">Aquí verás logs de WhatsApp, Email y notificaciones Push</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Configuración de Cuenta</CardTitle>
                        <CardDescription>Ajustes de privacidad y preferencias</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground italic">Próximamente: Gestión de accesos y preferencias de privacidad.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}

/**
 * Helper: AccordionSection (Focused Style)
 */
function AccordionSection({ id, title, icon, children, isOpen, onToggle }: { id: string, title: string, icon: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
    const [isEditing, setIsEditing] = useState(false)

    // Reset editing state when closing
    const handleToggle = () => {
        if (isOpen) setIsEditing(false)
        onToggle()
    }

    return (
        <Card className={`overflow-hidden transition-all duration-300 border shadow-none ${isOpen ? 'ring-1 ring-primary/20 border-primary/20' : 'bg-muted/5'}`}>
            <div className="flex items-center justify-between p-4 group">
                <button
                    onClick={handleToggle}
                    className="flex-1 flex items-center gap-3 text-left"
                >
                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-primary/10' : 'bg-background border'}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold tracking-tight uppercase ${isOpen ? 'text-primary' : 'text-foreground/70'}`}>{title}</h3>
                        {!isOpen && <p className="text-[10px] text-muted-foreground">Click para expandir y visualizar datos</p>}
                    </div>
                </button>

                <div className="flex items-center gap-3">
                    {isOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-full transition-colors ${isEditing ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    <button onClick={handleToggle} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[1000px] border-t bg-background px-4 py-2' : 'max-h-0'}`}>
                <div className="grid grid-cols-1 gap-px pb-4">
                    {children}
                </div>

                {isEditing && (
                    <div className="flex justify-end pt-4 pb-2 border-t gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={() => setIsEditing(false)}
                        >
                            Descartar
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 text-xs px-4 font-semibold"
                            onClick={() => setIsEditing(false)}
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    )
}

/**
 * Helper: DataRow (Label | Value) - Ledger Style (Inside Accordion)
 */
function DataRow({ label, value, bold, capitalize }: { label: string, value: React.ReactNode, bold?: boolean, capitalize?: boolean }) {
    return (
        <div className="group flex items-center justify-between py-3 px-2 hover:bg-muted/30 transition-colors rounded-sm border-b border-muted/30 last:border-0 overflow-hidden">
            <span className="text-xs font-medium text-muted-foreground w-1/3 min-w-[120px] shrink-0">
                {label}
            </span>
            <div className={`text-sm flex-1 text-right truncate ${bold ? 'font-semibold text-foreground' : 'text-foreground/90'} ${capitalize ? 'capitalize' : ''}`}>
                {value || <span className="text-muted-foreground/50 italic font-normal">No registra</span>}
            </div>
        </div>
    )
}

function InfoRow({ label, value, bold, capitalize }: { label: string, value: React.ReactNode, bold?: boolean, capitalize?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{label}</span>
            <div className={`text-xs truncate ${bold ? 'font-bold' : 'font-medium'} ${capitalize ? 'capitalize' : ''}`}>
                {value || <span className="text-muted-foreground italic font-normal">No registrado</span>}
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
            <div className="h-full w-px bg-border absolute ml-4 -z-10 mt-6" /> {/* Vertical line hack */}
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm shrink-0">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal opacity-70">@{user}</Badge>
                    <span className="text-[11px] text-muted-foreground">{date}</span>
                </div>
            </div>
        </div>
    )
}
