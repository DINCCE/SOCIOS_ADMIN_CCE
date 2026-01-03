"use client"

import { Wallet, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

export function FinancialEcosystemCard() {
  return (
    <Card className="h-full bg-card border border-border rounded-lg p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40 min-h-[32px]">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Rendimiento & Consumo
        </h3>
      </div>

      {/* Sección Superior: KPI Mes */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-muted-foreground">Consumo Mes Actual</p>
        <p className="text-2xl font-medium tabular-nums text-foreground">$ 450.000</p>
        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          <TrendingUp className="h-3 w-3" />
          <span>15% vs Promedio</span>
        </div>
      </div>

      {/* Sección Media: Split Familiar - Barra Visual */}
      <div className="mb-4 pb-4 border-t border-border/50 pt-4">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Distribución Familiar</p>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div className="bg-slate-800 w-[70%]" />
          <div className="bg-slate-400 w-[30%]" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-800" />
            <span className="text-[10px] text-muted-foreground">Titular (70%)</span>
          </div>
          <span className="text-[10px] text-muted-foreground">•</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[10px] text-muted-foreground">Familia (30%)</span>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Métricas Históricas - Grid 2x2 */}
      <div className="mt-auto grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">YTD (Año en curso)</p>
          <p className="text-lg font-medium tabular-nums text-foreground">$ 5.2M</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">LTV (Valor de Vida)</p>
          <p className="text-lg font-medium tabular-nums text-foreground">$ 45.8M</p>
        </div>
      </div>
    </Card>
  )
}
