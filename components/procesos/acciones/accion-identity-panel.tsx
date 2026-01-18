"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DollarSign, Calendar, ShieldCheck, ShieldAlert } from "lucide-react"
import { AccionDetail } from "@/features/procesos/acciones/types/acciones-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface AccionIdentityPanelProps {
  accion: AccionDetail
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return format(date, "d MMM yyyy", { locale: es })
  } catch {
    return dateStr
  }
}

export function AccionIdentityPanel({ accion }: AccionIdentityPanelProps) {
  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          Ficha Técnica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-0">
        {/* Card 1: Ficha Técnica */}
        <div className="space-y-4 pt-1">
          {/* Valor Nominal */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Valor Nominal
            </p>
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-lg font-bold text-foreground">{formatCurrency(accion.valor_nominal)}</p>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Fecha de Emisión / Miembro desde */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Fecha de Emisión
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium text-foreground">
                {accion.fecha_emision ? formatDate(accion.fecha_emision) : "No registrada"}
              </p>
            </div>
            <div className="flex items-center gap-2 pl-5.5">
              <p className="text-xs text-muted-foreground leading-tight">
                Miembro desde: {formatDate(accion.fecha_ingreso)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Card 2: Derechos & Estatus */}
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Derechos & Estatus
          </p>

          {/* Derechos Políticos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {accion.derechos_politicos ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-red-600" />
              )}
              <p className="text-sm font-medium text-foreground">Derechos Políticos</p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                accion.derechos_politicos
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {accion.derechos_politicos ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Estado Legal (mock) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-foreground">Estado Legal</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Libre de Gravámenes
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
