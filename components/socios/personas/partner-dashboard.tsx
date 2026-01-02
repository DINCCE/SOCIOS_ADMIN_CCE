"use client"

import { Wallet, Heart, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Partner Dashboard - Advanced KPIs
 * Displays financial, engagement, and preferences metrics in a flat design
 */
export function PartnerDashboard() {
    return (
        <div className="grid grid-cols-3 gap-4">
            <FinancialEcosystemCard />
            <EngagementLoyaltyCard />
            <PreferencesServicesCard />
        </div>
    )
}

/**
 * TARJETA 1: ECOSISTEMA FINANCIERO (Wallet)
 */
function FinancialEcosystemCard() {
    return (
        <div className="bg-card border border-border rounded-lg p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Rendimiento & Consumo
                </h3>
            </div>

            {/* Sección Superior: KPI Mes */}
            <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Consumo Mes Actual</p>
                <p className="text-2xl font-medium tabular-nums text-foreground">$ 450.000</p>
                <Badge variant="status-active" className="mt-2 text-[10px]">
                    ▲ 15% vs Promedio
                </Badge>
            </div>

            {/* Sección Media: Split Familiar - Barra Visual */}
            <div className="mb-4 pb-4 border-b border-border/50">
                <p className="text-[10px] text-muted-foreground mb-2">Distribución Consumo</p>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                    <div className="bg-slate-800 w-[70%]" />
                    <div className="bg-slate-400 w-[30%]" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-800" />
                        <span className="text-[10px] text-muted-foreground">Titular (70%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-[10px] text-muted-foreground">Familia (30%)</span>
                    </div>
                </div>
            </div>

            {/* Sección Inferior: Métricas Históricas - Grid 2x2 */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        YTD (Año en curso)
                    </p>
                    <p className="text-xl font-medium text-foreground tabular-nums">$ 5.2M</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        LTV (Valor de Vida)
                    </p>
                    <p className="text-xl font-medium text-foreground tabular-nums">$ 45.8M</p>
                </div>
            </div>
        </div>
    )
}

/**
 * TARJETA 2: ENGAGEMENT & FIDELIDAD (Heart)
 */
function EngagementLoyaltyCard() {
    // Simulación de datos de asistencia (7x4 grid = 28 días)
    const attendanceData = [
        1, 1, 0, 1, 1, 1, 0, // Semana 1
        1, 1, 1, 0, 1, 0, 1, // Semana 2
        0, 1, 1, 1, 1, 0, 0, // Semana 3
        1, 1, 0, 1, 1, 1, 1, // Semana 4
    ]

    return (
        <div className="bg-card border border-border rounded-lg p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Comportamiento & RFM
                </h3>
            </div>

            {/* Sección Superior: Score RFM */}
            <div className="mb-4">
                <p className="text-xl font-medium text-foreground mb-1">Socio Champion</p>
                <p className="text-xs text-muted-foreground mb-2">Alta Frecuencia • Alto Valor</p>
                <Badge variant="metadata-outline" className="text-[10px]">
                    Socio desde 2015 (9 años)
                </Badge>
            </div>

            {/* Sección Media: Heatmap Visual */}
            <div className="mb-4 pb-4 border-t border-border/50 pt-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    Asistencia (Últimos 30 días)
                </p>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {attendanceData.map((attended, index) => (
                        <div
                            key={index}
                            className={cn(
                                "h-3 w-full rounded-sm",
                                attended ? "bg-emerald-500" : "bg-slate-100"
                            )}
                        />
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Recencia: Hace 2 días</p>
            </div>

            {/* Sección Inferior: Permanencia */}
            <div className="mt-auto">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Tiempo Promedio
                </p>
                <p className="text-lg font-medium text-foreground">4.2 horas/semana</p>
            </div>
        </div>
    )
}

/**
 * TARJETA 3: PREFERENCIAS & SERVICIOS (Action)
 */
function PreferencesServicesCard() {
    const topServices = [
        { name: "Tenis", percentage: 45 },
        { name: "Restaurante", percentage: 30 },
        { name: "Spa / Wellness", percentage: 25 },
    ]

    return (
        <div className="bg-card border border-border rounded-lg p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Top Servicios & Reservas
                </h3>
            </div>

            {/* Sección Superior: Top 3 Ranking */}
            <div className="mb-4 pb-4 border-b border-border/50 space-y-3">
                {topServices.map((service, index) => (
                    <div key={service.name}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                    {index + 1}.
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {service.name}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {service.percentage}%
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full bg-slate-800 rounded-full"
                                style={{ width: `${service.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Sección Inferior: Reservas Futuras */}
            <div className="mt-auto">
                <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        Reservas Activas
                    </p>
                    <p className="text-2xl font-medium text-foreground tabular-nums">4</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                    Ver Agenda Completa →
                </Button>
            </div>
        </div>
    )
}
