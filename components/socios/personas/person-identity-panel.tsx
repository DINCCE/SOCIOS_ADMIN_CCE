import { Mail, Phone, MapPin, Calendar, Globe, Linkedin, Instagram, Facebook, Twitter, Cake } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

interface PersonIdentityPanelProps {
    persona: Persona
}

export function PersonIdentityPanel({ persona }: PersonIdentityPanelProps) {
    // Helpers para formateo
    const formatDocument = (num: string) => {
        if (!num) return "No registrado";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    const formatPhone = (phone: string) => {
        if (!phone) return "";
        const cleaned = phone.replace(/\D/g, "");
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `${match[1]} ${match[2]} ${match[3]}`;
        }
        return phone;
    }

    const formatBirthDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            const formatted = format(date, "d MMM yyyy", { locale: es });

            const age = new Date().getFullYear() - date.getFullYear();
            const hasHadBirthdayThisYear = new Date().getMonth() > date.getMonth() ||
                (new Date().getMonth() === date.getMonth() && new Date().getDate() >= date.getDate());
            const finalAge = hasHadBirthdayThisYear ? age : age - 1;

            return { formatted, age: finalAge, date };
        } catch (e) {
            return null;
        }
    }

    const formatStandardDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return format(date, "d MMM yyyy", { locale: es });
        } catch (e) {
            return null;
        }
    }

    const getBirthdayCountdown = (birthDate: Date) => {
        const today = new Date();
        const thisYear = today.getFullYear();

        // Get birthday this year
        let nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());

        // If birthday already passed, use next year
        if (nextBirthday < today) {
            nextBirthday = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate());
        }

        const daysUntil = differenceInDays(nextBirthday, today);

        if (daysUntil === 0) return { show: true, text: "Hoy 🎉", days: 0 };
        if (daysUntil < 30) return { show: true, text: `en ${daysUntil} días`, days: daysUntil };

        return { show: false, text: "", days: daysUntil };
    }

    return (
        <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Contacto e Identidad
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-0">
                {/* Contact Info Group */}
                <div className="space-y-4 pt-1">
                    {/* Emails */}
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Emails</p>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2" title="Principal">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <p className="text-sm font-medium text-foreground break-all leading-tight">
                                    {persona.email_principal || "Principal no reg."}
                                </p>
                            </div>
                            {persona.email_secundario && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <p className="text-sm font-medium text-foreground break-all leading-tight">
                                        {persona.email_secundario}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teléfonos / WhatsApp */}
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Teléfonos / WhatsApp</p>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                {persona.whatsapp && (persona.whatsapp === persona.telefono_principal) ? (
                                    <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                ) : (
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                <div className="flex items-center gap-2 leading-tight">
                                    <span className="text-sm font-medium">
                                        {formatPhone(persona.telefono_principal || "") || "Principal no reg."}
                                    </span>
                                    {persona.whatsapp && persona.whatsapp === persona.telefono_principal && (
                                        <Badge variant="metadata-outline" className="h-3.5 px-1 text-[9px]">WA</Badge>
                                    )}
                                </div>
                            </div>

                            {persona.telefono_secundario && (
                                <div className="flex items-center gap-2">
                                    {persona.whatsapp && (persona.whatsapp === persona.telefono_secundario) ? (
                                        <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    ) : (
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex items-center gap-2 leading-tight">
                                        <span className="text-sm text-muted-foreground">
                                            {formatPhone(persona.telefono_secundario)}
                                        </span>
                                        {persona.whatsapp && persona.whatsapp === persona.telefono_secundario && (
                                            <Badge variant="metadata-outline" className="h-3.5 px-1 text-[9px]">WA</Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {persona.whatsapp && persona.whatsapp !== persona.telefono_principal && persona.whatsapp !== persona.telefono_secundario && (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <div className="flex items-center gap-2 leading-tight">
                                        <span className="text-sm font-medium text-green-700">
                                            {formatPhone(persona.whatsapp)}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-green-50 text-green-700 border-green-200">WA</Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Identity Details Group */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Identidad</p>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <p className="text-sm font-medium text-foreground leading-tight">
                                    {persona.tipo_documento} {formatDocument(persona.numero_documento)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 pl-5.5">
                                <p className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
                                    {persona.nacionalidad === 'CO' ? '🇨🇴 Colombiana' : (persona.nacionalidad || "No registrada")}
                                </p>
                            </div>
                            {persona.lugar_expedicion && (
                                <div className="pl-5.5">
                                    <p className="text-[10px] text-muted-foreground italic leading-tight">
                                        Exp. en {persona.lugar_expedicion}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fechas Importantes</p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {(() => {
                                const birthData = formatBirthDate(persona.fecha_nacimiento);
                                if (!birthData) return null;
                                const countdown = getBirthdayCountdown(birthData.date);
                                return (
                                    <div className="flex items-center gap-2">
                                        <Cake className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <div className="flex items-center gap-2 flex-wrap leading-tight">
                                            <p className="text-sm font-medium">
                                                <span className="text-muted-foreground font-normal">Nacimiento:</span> {birthData.formatted}
                                            </p>
                                            <span className="text-sm text-muted-foreground">({birthData.age} años)</span>
                                            {countdown.show && (
                                                <Badge className="text-[10px] px-1.5 rounded-full bg-amber-100 text-amber-700 border-none">
                                                    {countdown.text}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                            {persona.fecha_aniversario && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <p className="text-sm font-medium leading-tight">
                                        <span className="text-muted-foreground font-normal">Aniversario:</span> {formatStandardDate(persona.fecha_aniversario)}
                                    </p>
                                </div>
                            )}
                            {persona.fecha_expedicion && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <p className="text-sm font-medium leading-tight">
                                        <span className="text-muted-foreground font-normal">Expedición:</span> {formatStandardDate(persona.fecha_expedicion)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Grupo Familiar - Compact Sidebar version */}
                <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Grupo Familiar</p>
                    <div className="space-y-1.5">
                        {/* Member 1 */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">ML</div>
                                <span className="text-xs font-medium text-foreground truncate max-w-[140px]">María López</span>
                            </div>
                            <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-slate-100 text-slate-500 rounded-sm border-none shadow-none">CÓNYUGE</Badge>
                        </div>

                        {/* Member 2 */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">CP</div>
                                <span className="text-xs font-medium text-foreground truncate max-w-[140px]">Camilo Pérez</span>
                            </div>
                            <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-slate-100 text-slate-500 rounded-sm border-none shadow-none">HIJO</Badge>
                        </div>

                        {/* gestion / ver mas */}
                        <button className="text-[10px] text-primary hover:underline font-medium mt-1 cursor-pointer transition-colors text-left leading-tight">
                            Gestionar relaciones (+2 más...)
                        </button>
                    </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Social Networks Group */}
                <div className="space-y-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Presencia Digital</p>
                    <div className="flex flex-wrap gap-1.5">
                        {persona.linkedin_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#0077b5] border-slate-200 bg-white" asChild>
                                <a href={persona.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {persona.instagram_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#e4405f] border-slate-200 bg-white" asChild>
                                <a href={`https://instagram.com/${persona.instagram_handle}`} target="_blank" rel="noopener noreferrer">
                                    <Instagram className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {persona.facebook_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#1877f2] border-slate-200 bg-white" asChild>
                                <a href={persona.facebook_url} target="_blank" rel="noopener noreferrer">
                                    <Facebook className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {persona.twitter_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-900 border-slate-200 bg-white" asChild>
                                <a href={`https://twitter.com/${persona.twitter_handle}`} target="_blank" rel="noopener noreferrer">
                                    <Twitter className="h-3.5 w-3.5" />
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
