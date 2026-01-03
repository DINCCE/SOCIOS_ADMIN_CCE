"use client"

import { Zap, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Mock data para top servicios
const topServices = [
  { name: "Tenis", percentage: 45 },
  { name: "Restaurante", percentage: 30 },
  { name: "Spa / Wellness", percentage: 25 },
]

export function PreferencesServicesCard() {
  return (
    <Card className="h-full bg-card border border-border rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40 min-h-[32px]">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Top Servicios & Reservas
        </h3>
      </div>

      {/* Sección Superior: Top 3 Ranking */}
      <div className="space-y-3 mb-6">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">
          Servicios Más Utilizados
        </p>
        {topServices.map((service, index) => (
          <div key={service.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-4">
                  {index + 1}.
                </span>
                <span className="text-sm font-medium text-foreground">
                  {service.name}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {service.percentage}%
              </span>
            </div>
            {/* Barra de porcentaje */}
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-6">
              <div
                className="h-full transition-all bg-slate-800"
                style={{ width: `${service.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sección Inferior: Reservas Futuras */}
      <div className="mt-auto pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Reservas Activas
            </p>
          </div>
          <Badge variant="metadata-outline" className="text-xs font-semibold">
            4
          </Badge>
        </div>
        <Link
          href="#"
          className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
        >
          Ver Agenda Completa →
        </Link>
      </div>
    </Card>
  )
}
