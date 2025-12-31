"use client"

import { Heart, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock data para el heatmap (28 días - 4 semanas)
const attendanceData = [
  1, 1, 0, 1, 1, 0, 0, // Semana 1
  1, 1, 1, 0, 1, 0, 0, // Semana 2
  1, 0, 1, 1, 1, 0, 0, // Semana 3
  1, 1, 0, 1, 1, 1, 0, // Semana 4
]

export function EngagementLoyaltyCard() {
  return (
    <Card className="h-full bg-card border border-border rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Comportamiento & RFM
        </h3>
      </div>

      {/* Sección Superior: Score RFM */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <p className="text-xl font-medium text-foreground">Socio Champion</p>
        </div>
        <p className="text-xs text-muted-foreground">Alta Frecuencia • Alto Valor</p>
        <Badge variant="metadata-outline" className="text-[10px] mt-1">
          Socio desde 2015 (9 años)
        </Badge>
      </div>

      {/* Sección Media: Heatmap Visual */}
      <div className="mb-4 pb-4 border-t border-border/50 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Asistencia (Últimos 30 días)
          </p>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {attendanceData.map((attended, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square rounded-sm",
                attended === 1
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-slate-100 hover:bg-slate-200"
              )}
              title={attended === 1 ? "Asistió" : "No asistió"}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Recencia: Hace 2 días</span>
        </div>
      </div>

      {/* Sección Inferior: Permanencia */}
      <div className="mt-auto">
        <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Tiempo Promedio</p>
        <p className="text-lg font-medium tabular-nums text-foreground">4.2 horas/semana</p>
      </div>
    </Card>
  )
}
