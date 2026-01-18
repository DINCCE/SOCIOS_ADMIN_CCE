"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Receipt,
  Clock,
  FileText,
  ChevronDown,
  Plus,
  Download,
} from "lucide-react"
import { AccionDetail } from "@/features/procesos/acciones/types/acciones-schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { FamilyGroupSection } from "@/components/socios/personas/family-group-section"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

interface AccionTabsContentProps {
  accion: AccionDetail
}

// Mock data for cartera (invoices)
const MOCK_CARTERA = [
  {
    id: "inv-1",
    periodo: "Ene 2025",
    concepto: "Cuota Mensual",
    valor: 450000,
    estado: "Pagado",
  },
  {
    id: "inv-2",
    periodo: "Dic 2024",
    concepto: "Cuota Mensual",
    valor: 450000,
    estado: "Pagado",
  },
  {
    id: "inv-3",
    periodo: "Nov 2024",
    concepto: "Cuota Mensual",
    valor: 450000,
    estado: "Pagado",
  },
  {
    id: "inv-4",
    periodo: "Oct 2024",
    concepto: "Cuota Mensual",
    valor: 450000,
    estado: "Pagado",
  },
  {
    id: "inv-5",
    periodo: "Sep 2024",
    concepto: "Cuota Mensual",
    valor: 450000,
    estado: "Pagado",
  },
]

// Mock data for historial
const MOCK_HISTORIAL = [
  {
    id: "h-1",
    icon: <Users className="h-4 w-4" />,
    title: "Transferencia de Propiedad",
    description: "La acción fue transferida a Ana Lucía García López",
    date: "12 Abr 2015",
    user: "Sistema Web",
  },
  {
    id: "h-2",
    icon: <FileText className="h-4 w-4" />,
    title: "Emisión de Título",
    description: "Título A-00459 emitido y registrado en Caja Fuerte 2",
    date: "10 Abr 2015",
    user: "Administración",
  },
]

// Mock data for documentos
const MOCK_DOCUMENTOS = [
  {
    id: "doc-1",
    nombre: "Certificado de Propiedad.pdf",
    tamaño: "245 KB",
    fecha: "15 Ene 2025",
  },
  {
    id: "doc-2",
    nombre: "Carnet del Socio.pdf",
    tamaño: "1.2 MB",
    fecha: "10 Dic 2024",
  },
  {
    id: "doc-3",
    nombre: "Estado de Cuenta 2024.pdf",
    tamaño: "890 KB",
    fecha: "01 Ene 2025",
  },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)
}

function getSolvenciaAlertVariant(solvencia: string): "default" | "destructive" {
  if (solvencia === "al_dia") return "default"
  return "destructive"
}

function getSolvenciaAlertTitle(solvencia: string): string {
  switch (solvencia) {
    case "al_dia":
      return ""
    case "pendiente":
      return "Pago Pendiente"
    case "mora_30":
      return "Mora 30 Días"
    case "mora_60":
      return "Mora 60 Días"
    case "cobro_juridico":
      return "Cobro Jurídico"
    default:
      return "Atención Requerida"
  }
}

function getSolvenciaAlertDescription(solvencia: string): string | null {
  switch (solvencia) {
    case "al_dia":
      return null
    case "pendiente":
      return "Tiene un pago pendiente por procesar. Regularizar para mantener beneficios."
    case "mora_30":
      return "Tiene pagos pendientes de más de 30 días. Puede perder beneficios temporalmente."
    case "mora_60":
      return "Tiene pagos pendientes de más de 60 días. Sus servicios pueden ser suspendidos."
    case "cobro_juridico":
      return "La acción está en proceso de cobro jurídico por morosidad prolongada."
    default:
      return null
  }
}

export function AccionTabsContent({ accion }: AccionTabsContentProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const solvenciaAlert = getSolvenciaAlertDescription(accion.solvencia)
  const solvenciaAlertTitle = getSolvenciaAlertTitle(accion.solvencia)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="border-b mb-6">
        <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto gap-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>

          <TabsTrigger
            value="beneficiarios"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Beneficiarios</span>
          </TabsTrigger>

          <TabsTrigger
            value="cartera"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 flex gap-2 px-0 font-semibold justify-center transition-all"
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Cartera</span>
          </TabsTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-full items-center justify-center gap-2 py-3 text-sm font-semibold text-muted-foreground hover:bg-accent/50 transition-colors border-b-2 border-transparent">
                <ChevronDown className="h-4 w-4" />
                <span className="hidden sm:inline">Más</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("historial")}>
                <Clock className="h-4 w-4" />
                Historial
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => setActiveTab("documentos")}>
                <FileText className="h-4 w-4" />
                Documentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>
      </div>

      {/* --- RESUMEN TAB --- */}
      <TabsContent value="overview" className="mt-0 space-y-6">
        {/* Solvencia Alert (if not al_dia) */}
        {solvenciaAlert && (
          <Alert variant={getSolvenciaAlertVariant(accion.solvencia)} className="border-l-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-tight">
              {solvenciaAlertTitle}
            </AlertTitle>
            <AlertDescription className="text-xs">{solvenciaAlert}</AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Promedio Consumo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promedio Consumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(accion.kpis.consumo_promedio)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
                </div>
                <div className="h-10 w-24 flex items-end gap-1">
                  {[40, 60, 45, 80, 55, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cupo Invitados */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cupo Invitados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {accion.kpis.invitados_disponibles}
                    <span className="text-lg font-normal text-muted-foreground"> de 12</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">disponibles</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <Progress value={(accion.kpis.invitados_disponibles / 12) * 100} className="w-24 h-2" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {Math.round((accion.kpis.invitados_disponibles / 12) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deuda Total</span>
              <span className={`font-semibold ${accion.kpis.deuda_total > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {formatCurrency(accion.kpis.deuda_total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tipo de Membresía</span>
              <span className="font-semibold">{accion.tipo}</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- BENEFICIARIOS TAB --- */}
      <TabsContent value="beneficiarios" className="mt-0">
        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-base">Beneficiarios</CardTitle>
              <CardDescription>Personas vinculadas a esta acción</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Using the same FamilyGroupSection component from personas */}
            {/* TODO: When backend is ready, pass organizacion_id from accion context */}
            <FamilyGroupSection bp_id={accion.id} organizacion_id="default-org-id" />
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- CARTERA TAB --- */}
      <TabsContent value="cartera" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cartera de Pagos</CardTitle>
            <CardDescription>Historial de facturas y pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Periodo</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Concepto</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CARTERA.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-3 font-medium">{inv.periodo}</td>
                      <td className="py-3 px-3">{inv.concepto}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs">
                        {formatCurrency(inv.valor)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={inv.estado === "Pagado" ? "status-active" : "status-warning"}
                          showDot
                        >
                          {inv.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- HISTORIAL TAB --- */}
      <TabsContent value="historial" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Cambios</CardTitle>
            <CardDescription>Auditoría de transferencias y eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {MOCK_HISTORIAL.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-full w-px bg-border absolute ml-4 -z-10 mt-6" />
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="metadata-outline">@{item.user}</Badge>
                      <span className="text-[11px] text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- DOCUMENTOS TAB --- */}
      <TabsContent value="documentos" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos</CardTitle>
            <CardDescription>Archivos y certificados relacionados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_DOCUMENTOS.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.tamaño} • {doc.fecha}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
