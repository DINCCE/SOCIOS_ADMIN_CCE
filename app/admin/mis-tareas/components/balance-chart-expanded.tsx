"use client"

import * as React from "react"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { TareaView } from "@/features/procesos/tareas/columns"
import { subDays, format, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface BalanceChartExpandedProps {
  tareas: TareaView[]
}

const chartConfig = {
  created: {
    label: "Creadas",
    color: "var(--chart-2)",
  },
  completed: {
    label: "Terminadas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    payload: {
      date: string
      fullDate: string
    }
  }>
}

function ExpandedTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  const created = payload.find(p => p.name === "created")?.value || 0
  const completed = payload.find(p => p.name === "completed")?.value || 0
  const balance = completed - created

  return (
    <div className="rounded-lg border border-border/50 bg-background px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold">{data.fullDate}</p>
      <div className="space-y-2 mt-2">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />
          <p className="text-xs text-muted-foreground">Creadas: <span className="font-medium text-foreground">{created}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
          <p className="text-xs text-muted-foreground">Terminadas: <span className="font-medium text-foreground">{completed}</span></p>
        </div>
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Balance: <span className={`font-medium ${balance >= 0 ? 'text-status-positive' : 'text-status-negative'}`}>{balance >= 0 ? '+' : ''}{balance}</span></p>
        </div>
      </div>
    </div>
  )
}

interface BalanceChartExpandedPropsWithTabs extends BalanceChartExpandedProps {
  activeTab?: 'chart' | 'table'
}

export function BalanceChartExpanded({ tareas, activeTab = 'chart' }: BalanceChartExpandedPropsWithTabs) {

  // Calculate last 30 days data
  const monthlyData = React.useMemo(() => {
    const today = new Date()
    const days = []

    // Generate last 30 days (starting from 29 days ago to today)
    for (let i = 29; i >= 0; i--) {
      const currentDay = subDays(today, i)

      // Format date as "Ene 19", "Feb 25", etc.
      const dateLabel = format(currentDay, "MMM dd", { locale: es })
      const dayLabel = format(currentDay, "EEE", { locale: es }).charAt(0).toUpperCase()

      // Count tasks created on this day
      const created = tareas.filter(t => {
        if (!t.creado_en) return false
        const createdDate = parseISO(t.creado_en)
        return isSameDay(createdDate, currentDay)
      }).length

      // Count tasks completed on this day
      const completed = tareas.filter(t => {
        if (t.estado !== "Terminada") return false
        const dateToCheck = t.actualizado_en || t.creado_en
        if (!dateToCheck) return false
        const updatedDate = parseISO(dateToCheck)
        return isSameDay(updatedDate, currentDay)
      }).length

      days.push({
        date: dateLabel,
        day: dayLabel,
        fullDate: format(currentDay, "EEEE, dd MMM yyyy", { locale: es }),
        created,
        completed,
        balance: completed - created,
      })
    }

    return days
  }, [tareas])

  // Calculate totals for KPIs
  const totals = React.useMemo(() => {
    const totalCreated = monthlyData.reduce((sum, day) => sum + day.created, 0)
    const totalCompleted = monthlyData.reduce((sum, day) => sum + day.completed, 0)
    const ratio = totalCreated > 0 ? (totalCompleted / totalCreated) : 0
    const netBalance = totalCompleted - totalCreated

    return {
      totalCreated,
      totalCompleted,
      ratio: ratio.toFixed(2),
      netBalance,
    }
  }, [monthlyData])

  return (
    <div className="flex flex-col h-full">
      {/* KPI Section - No title, just the KPIs */}
      <div className="px-6 py-4 border-b border-border/40 shrink-0">
        {/* KPI Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-3">
          <KPIBox
            label="Creadas"
            value={totals.totalCreated.toString()}
            color="text-chart-2"
            subtext="30 días"
          />
          <KPIBox
            label="Terminadas"
            value={totals.totalCompleted.toString()}
            color="text-chart-1"
            subtext="30 días"
          />
          <KPIBox
            label="Ratio"
            value={`${totals.ratio}x`}
            color={Number(totals.ratio) >= 1 ? "text-status-positive" : "text-status-negative"}
            subtext="terminación"
          />
          <KPIBox
            label="Balance"
            value={totals.netBalance >= 0 ? `+${totals.netBalance}` : totals.netBalance.toString()}
            color={totals.netBalance >= 0 ? "text-status-positive" : "text-status-negative"}
            subtext="neto"
          />
        </div>
      </div>

      {/* Content Area - Chart or Table based on activeTab */}
      {activeTab === 'chart' ? (
        <div className="flex-1 min-h-0 px-6 py-6">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                accessibilityLayer
                data={monthlyData}
                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="4 4" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => {
                    return value
                  }}
                />
                <YAxis hide />
                <ChartTooltip content={<ExpandedTooltip />} cursor={false} />
                {/* Terminadas FIRST so it appears on TOP (z-index) */}
                <Area
                  dataKey="completed"
                  type="linear"
                  fill="var(--color-completed)"
                  fillOpacity={0.3}
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="created"
                  type="linear"
                  fill="var(--color-created)"
                  fillOpacity={0.3}
                  stroke="var(--color-created)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Creadas</TableHead>
                <TableHead className="text-right">Terminadas</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((day) => (
                <TableRow key={day.date}>
                  <TableCell className="font-medium">{day.fullDate}</TableCell>
                  <TableCell className="text-right text-chart-2">{day.created}</TableCell>
                  <TableCell className="text-right text-chart-1">{day.completed}</TableCell>
                  <TableCell className={`text-right font-medium ${day.balance >= 0 ? 'text-status-positive' : 'text-status-negative'}`}>
                    {day.balance >= 0 ? '+' : ''}{day.balance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

interface KPIBoxProps {
  label: string
  value: string
  color: string
  subtext: string
}

function KPIBox({ label, value, color, subtext }: KPIBoxProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 px-3 py-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-2xl font-bold leading-tight", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{subtext}</p>
    </div>
  )
}
