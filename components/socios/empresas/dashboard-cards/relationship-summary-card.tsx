"use client"

import { Users, Building2, Link as LinkIcon, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RelationshipSummaryCard() {
  return (
    <Card className="h-full bg-card border border-border rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40 min-h-[32px]">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Relaciones Corporativas
        </h3>
      </div>

      {/* Sección Superior: Representante Legal */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-muted-foreground">Representante Legal</p>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Juan Pérez García</span>
            <span className="text-[10px] text-muted-foreground">Gerente General</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" asChild>
            <Link href="/admin/socios/personas/abc-123">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Sección Media: Estructura de Propiedad */}
      <div className="mb-4 pb-4 border-t border-border/50 pt-4">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Estructura de Propiedad</p>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex mb-2">
          <div className="bg-slate-800 w-[80%]" />
          <div className="bg-slate-400 w-[20%]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-800" />
            <span className="text-[10px] text-muted-foreground">Accionistas (80%)</span>
          </div>
          <span className="text-[10px] text-muted-foreground">•</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[10px] text-muted-foreground">Otros (20%)</span>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Vinculadas */}
      <div className="mt-auto grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Subsidiarias</p>
            <p className="text-lg font-medium tabular-nums text-foreground">3</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Vinculadas</p>
            <p className="text-lg font-medium tabular-nums text-foreground">7</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
