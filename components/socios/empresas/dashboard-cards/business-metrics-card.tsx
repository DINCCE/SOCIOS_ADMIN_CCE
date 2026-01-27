"use client"

import { TrendingUp, Briefcase } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BusinessMetricsCard() {
  return (
    <Card className="h-full bg-card border border-border rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40 min-h-[32px]">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Negocio & Operaciones
        </h3>
      </div>

      {/* Sección Superior: Ingresos */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-muted-foreground">Ingresos Anuales</p>
        <p className="text-2xl font-medium tabular-nums text-foreground">$ 2.500.000.000</p>
        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <TrendingUp className="h-3 w-3" />
          <span>12% vs año anterior</span>
        </div>
      </div>

      {/* Sección Media: Clasificación */}
      <div className="mb-4 pb-4 border-t border-border/50 pt-4">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Clasificación</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tamaño</span>
            <Badge variant="metadata-outline" className="text-[10px]">Mediana</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sector</span>
            <span className="text-xs font-medium">Servicios</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Empleados</span>
            <span className="text-xs font-medium">50-200</span>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Códigos */}
      <div className="mt-auto grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">CIIU</p>
          <p className="text-sm font-medium tabular-nums text-foreground">8299</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Matriz</p>
          <p className="text-sm font-medium text-foreground">Nacional</p>
        </div>
      </div>
    </Card>
  )
}
