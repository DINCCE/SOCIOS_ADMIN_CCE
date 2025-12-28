import { Mail, Phone, MapPin, Calendar, Globe, Linkedin, Instagram, Facebook, Twitter } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

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
                            <p className="text-xs font-medium text-muted-foreground">Email Principal</p>
                            <p className="text-sm font-medium break-all">{persona.email_principal || "No registrado"}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                            <Phone className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Teléfono Principal</p>
                            <p className="text-sm font-medium">{persona.telefono_principal || "No registrado"}</p>
                        </div>
                    </div>

                    {persona.whatsapp && (
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-md bg-green-500/10 p-1.5 text-green-600">
                                <Globe className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">WhatsApp</p>
                                <p className="text-sm font-medium">{persona.whatsapp}</p>
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="bg-border/60" />

                {/* Identity Details */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Nacionalidad</p>
                            <p className="text-sm font-medium">{persona.nacionalidad === 'CO' ? 'Colombiana 🇨🇴' : persona.nacionalidad || "No registrada"}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Fecha de Nacimiento</p>
                            <p className="text-sm font-medium">{persona.fecha_nacimiento}</p>
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
