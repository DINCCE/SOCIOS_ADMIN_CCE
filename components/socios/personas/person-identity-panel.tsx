import { Mail, Phone, MapPin, Calendar, Globe, Linkedin, Instagram, Facebook, Twitter } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PersonIdentityPanelProps {
    persona: Persona
}

export function PersonIdentityPanel({ persona }: PersonIdentityPanelProps) {
    return (
        <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Contacto e Identidad
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-0">
                {/* Contact Info */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                            <Mail className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Emails</p>
                            <p className="text-sm font-medium break-all">{persona.email_principal || "Principal no reg."}</p>
                            {persona.email_secundario && (
                                <p className="text-xs text-muted-foreground break-all">{persona.email_secundario}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        {persona.whatsapp && (persona.whatsapp === persona.telefono_principal || persona.whatsapp === persona.telefono_secundario) ? (
                            <div className="mt-0.5 rounded-md bg-green-500/10 p-1.5 text-green-600">
                                <Globe className="h-4 w-4" />
                            </div>
                        ) : (
                            <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                                <Phone className="h-4 w-4" />
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Teléfonos / WhatsApp</p>
                            <div className="space-y-1">
                                <div className="text-sm font-medium flex items-center gap-2">
                                    {persona.telefono_principal || "Principal no reg."}
                                    {persona.whatsapp && persona.whatsapp === persona.telefono_principal && (
                                        <Badge variant="metadata-outline">WA</Badge>
                                    )}
                                </div>
                                {persona.telefono_secundario && (
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        {persona.telefono_secundario}
                                        {persona.whatsapp && persona.whatsapp === persona.telefono_secundario && (
                                            <Badge variant="metadata-outline">WA</Badge>
                                        )}
                                    </div>
                                )}
                                {persona.whatsapp && persona.whatsapp !== persona.telefono_principal && persona.whatsapp !== persona.telefono_secundario && (
                                    <div className="text-sm font-medium text-green-700 flex items-center gap-2">
                                        {persona.whatsapp}
                                        <Badge variant="outline" className="text-[9px] h-4 py-0 bg-green-50 text-green-700 border-green-200">WA</Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/60" />

                {/* Identity Details */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Nacionalidad y Documento</p>
                            <p className="text-sm font-medium">{persona.nacionalidad === 'CO' ? 'Colombiana 🇨🇴' : persona.nacionalidad || "No registrada"}</p>
                            <p className="text-sm text-muted-foreground">{persona.tipo_documento} {persona.numero_documento}</p>
                            {persona.lugar_expedicion && (
                                <p className="text-xs text-muted-foreground italic">Exp. en {persona.lugar_expedicion}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Fechas Clave</p>
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium"><span className="text-muted-foreground">Nacimiento:</span> {persona.fecha_nacimiento}</p>
                                {persona.fecha_expedicion && (
                                    <p className="text-xs text-muted-foreground"><span className="font-medium">Expedición:</span> {persona.fecha_expedicion}</p>
                                )}
                                {persona.fecha_aniversario && (
                                    <p className="text-xs text-muted-foreground"><span className="font-medium">Aniversario:</span> {persona.fecha_aniversario}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/60" />

                {/* Social Networks */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Redes Sociales</p>
                    <div className="flex flex-wrap gap-2">
                        {persona.linkedin_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#0077b5]" asChild>
                                <a href={persona.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        {persona.instagram_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#e4405f]" asChild>
                                <a href={`https://instagram.com/${persona.instagram_handle}`} target="_blank" rel="noopener noreferrer">
                                    <Instagram className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        {persona.facebook_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#1877f2]" asChild>
                                <a href={persona.facebook_url} target="_blank" rel="noopener noreferrer">
                                    <Facebook className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        {persona.twitter_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-black" asChild>
                                <a href={`https://twitter.com/${persona.twitter_handle}`} target="_blank" rel="noopener noreferrer">
                                    <Twitter className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        {!persona.linkedin_url && !persona.instagram_handle && !persona.facebook_url && !persona.twitter_handle && (
                            <p className="text-xs italic text-muted-foreground">No registradas</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
