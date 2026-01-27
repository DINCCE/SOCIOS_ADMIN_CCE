"use client"

import { ShieldCheck, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ComplianceStatusCard() {
  return (
    <Card className="h-full bg-card border border-border rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40 min-h-[32px]">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Documentación & Cumplimiento
        </h3>
      </div>

      {/* Sección Superior: Estado Documental */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-muted-foreground">Estado Documental</p>
        <p className="text-2xl font-medium tabular-nums text-foreground">75% Completo</p>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div className="bg-emerald-600 w-[75%]" />
          <div className="bg-slate-200 w-[25%]" />
        </div>
      </div>

      {/* Sección Media: Próximos Vencimientos */}
      <div className="mb-4 pb-4 border-t border-border/50 pt-4">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Próximos Vencimientos</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">Cámara de Comercio</span>
            </div>
            <Badge variant="warning" className="text-[9px] px-1.5 py-0 h-4">30 días</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">RUT</span>
            </div>
            <Badge variant="status-active" className="text-[9px] px-1.5 py-0 h-4">Vigente</Badge>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Certificaciones */}
      <div className="mt-auto">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Certificaciones</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="metadata-outline" className="text-[9px]">ISO 9001</Badge>
          <Badge variant="metadata-outline" className="text-[9px]">SASB</Badge>
          <Badge variant="metadata-outline" className="text-[9px]">B Corp</Badge>
        </div>
      </div>
    </Card>
  )
}
