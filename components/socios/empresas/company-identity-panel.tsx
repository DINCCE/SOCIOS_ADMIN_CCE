"use client"

import Link from "next/link"
import { Mail, Phone, Globe, Building2, Linkedin, Instagram, Facebook, Twitter, FileText } from "lucide-react"
import { Empresa } from "@/features/socios/types/socios-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"

interface CompanyIdentityPanelProps {
    empresa: Empresa
}

export function CompanyIdentityPanel({ empresa }: CompanyIdentityPanelProps) {
    // Helper para formatear teléfono
    const formatPhone = (phone: string) => {
        if (!phone) return ""
        const cleaned = phone.replace(/\D/g, "")
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
        if (match) {
            return `${match[1]} ${match[2]} ${match[3]}`
        }
        return phone
    }

    const formatStandardDate = (dateStr: string | null) => {
        if (!dateStr) return null
        try {
            const date = new Date(dateStr)
            return format(date, "d MMM yyyy", { locale: es })
        } catch {
            return null
        }
    }

    const getCompanyAge = (dateStr: string | null) => {
        if (!dateStr) return null
        try {
            const date = new Date(dateStr)
            const years = differenceInYears(new Date(), date)
            return years
        } catch {
            return null
        }
    }

    const companyAge = empresa.fecha_constitucion ? getCompanyAge(empresa.fecha_constitucion) : null

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
                                <a
                                    href={`mailto:${empresa.email_principal}`}
                                    className="text-sm font-medium text-foreground break-all leading-tight hover:text-primary transition-colors"
                                >
                                    {empresa.email_principal || "Principal no reg."}
                                </a>
                            </div>
                            {empresa.email_secundario && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <a
                                        href={`mailto:${empresa.email_secundario}`}
                                        className="text-sm font-medium text-foreground break-all leading-tight hover:text-primary transition-colors"
                                    >
                                        {empresa.email_secundario}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teléfonos / WhatsApp */}
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Teléfonos / WhatsApp</p>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                {empresa.whatsapp && (empresa.whatsapp === empresa.telefono_principal) ? (
                                    <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                ) : (
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                <div className="flex items-center gap-2 leading-tight">
                                    <a
                                        href={`tel:${empresa.telefono_principal}`}
                                        className="text-sm font-medium hover:text-primary transition-colors"
                                    >
                                        {formatPhone(empresa.telefono_principal || "") || "Principal no reg."}
                                    </a>
                                    {empresa.whatsapp && empresa.whatsapp === empresa.telefono_principal && (
                                        <Badge variant="metadata-outline" className="h-3.5 px-1 text-[9px]">WA</Badge>
                                    )}
                                </div>
                            </div>

                            {empresa.telefono_secundario && (
                                <div className="flex items-center gap-2">
                                    {empresa.whatsapp && (empresa.whatsapp === empresa.telefono_secundario) ? (
                                        <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    ) : (
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex items-center gap-2 leading-tight">
                                        <a
                                            href={`tel:${empresa.telefono_secundario}`}
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {formatPhone(empresa.telefono_secundario)}
                                        </a>
                                        {empresa.whatsapp && empresa.whatsapp === empresa.telefono_secundario && (
                                            <Badge variant="metadata-outline" className="h-3.5 px-1 text-[9px]">WA</Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {empresa.whatsapp && empresa.whatsapp !== empresa.telefono_principal && empresa.whatsapp !== empresa.telefono_secundario && (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    <div className="flex items-center gap-2 leading-tight">
                                        <a
                                            href={`https://wa.me/${empresa.whatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-green-700 hover:text-green-600 transition-colors"
                                        >
                                            {formatPhone(empresa.whatsapp)}
                                        </a>
                                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 dark:border-green-400/20">WA</Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Website */}
                    {empresa.website && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sitio Web</p>
                            <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <a
                                    href={empresa.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary hover:underline break-all leading-tight"
                                >
                                    {empresa.website.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="bg-border/40" />

                {/* Identity Details Group */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Identidad Legal</p>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <p className="text-sm font-medium text-foreground leading-tight">
                                    NIT: {empresa.nit_completo || empresa.num_documento}
                                </p>
                            </div>
                            {empresa.tipo_sociedad && (
                                <div className="pl-5.5">
                                    <p className="text-xs text-muted-foreground leading-tight">
                                        {empresa.tipo_sociedad}
                                    </p>
                                </div>
                            )}
                            {empresa.pais_constitucion && (
                                <div className="flex items-center gap-2 pl-5.5">
                                    <p className="text-xs text-muted-foreground leading-tight flex items-center gap-1">
                                        {empresa.pais_constitucion === 'CO' ? '🇨🇴 Colombia' : empresa.pais_constitucion}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fechas Importantes</p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {empresa.fecha_constitucion && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <div className="flex items-center gap-2 flex-wrap leading-tight">
                                        <p className="text-sm font-medium">
                                            <span className="text-muted-foreground font-normal">Constitución:</span> {formatStandardDate(empresa.fecha_constitucion)}
                                        </p>
                                        {companyAge !== null && (
                                            <span className="text-sm text-muted-foreground">({companyAge} {companyAge === 1 ? 'año' : 'años'})</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/40" />

                {/* Representante Legal */}
                {empresa.representante_legal_id && (
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Representación Legal</p>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 shrink-0 rounded-full bg-muted border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                    RL
                                </div>
                                <Link
                                    href={`/admin/socios/personas/${empresa.representante_legal_id}`}
                                    className="text-xs font-medium text-foreground truncate max-w-[140px] hover:text-primary hover:underline transition-colors"
                                >
                                    {empresa.nombre_representante_legal || "Ver representante"}
                                </Link>
                            </div>
                            {empresa.cargo_representante && (
                                <Badge className="text-[9px] px-1.5 py-0 h-4 font-normal bg-muted text-muted-foreground rounded-sm border-none shadow-none uppercase">
                                    {empresa.cargo_representante}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                <Separator className="bg-border/40" />

                {/* Social Networks Group */}
                <div className="space-y-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Presencia Digital</p>
                    <div className="flex flex-wrap gap-1.5">
                        {empresa.linkedin_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#0077b5] hover:bg-[#0077b5]/10 border-border bg-card" asChild>
                                <a href={empresa.linkedin_url} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {empresa.instagram_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#e4405f] hover:bg-[#e4405f]/10 border-border bg-card" asChild>
                                <a href={`https://instagram.com/${empresa.instagram_handle}`} target="_blank" rel="noopener noreferrer">
                                    <Instagram className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {empresa.facebook_url && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-[#1877f2] hover:bg-[#1877f2]/10 border-border bg-card" asChild>
                                <a href={empresa.facebook_url} target="_blank" rel="noopener noreferrer">
                                    <Facebook className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {empresa.twitter_handle && (
                            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-900 dark:text-slate-100 hover:bg-slate-900/10 dark:hover:bg-slate-100/10 border-border bg-card" asChild>
                                <a href={`https://twitter.com/${empresa.twitter_handle}`} target="_blank" rel="noopener noreferrer">
                                    <Twitter className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        )}
                        {!empresa.linkedin_url && !empresa.instagram_handle && !empresa.facebook_url && !empresa.twitter_handle && !empresa.website && (
                            <p className="text-xs italic text-muted-foreground">No registradas</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
