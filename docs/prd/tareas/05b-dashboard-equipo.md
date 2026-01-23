# PRD: Dashboard de Equipo de Tareas (Admin/Manager)

## Resumen

Crear un dashboard de supervisión para administradores y managers que permita ver el estado general de todas las tareas del equipo, identificar cuellos de botella, redistribuir carga y tomar decisiones basadas en métricas agregadas.

---

## Diferencia con Dashboard Personal

| Aspecto | Dashboard Personal | Dashboard de Equipo |
|---------|-------------------|---------------------|
| **Datos** | Solo tareas del usuario | Todas las tareas de la organización |
| **Propósito** | Autogestión | Supervisión y distribución |
| **Acceso** | Todos los usuarios | Solo admin/owner |
| **Métricas** | Individuales | Agregadas por equipo |
| **Acciones** | Completar, organizar | Reasignar, priorizar globalmente |

---

## Control de Acceso

```tsx
// Verificar rol antes de mostrar
const { role } = useUserRole()
const canAccessTeamDashboard = role === "owner" || role === "admin"

if (!canAccessTeamDashboard) {
  redirect("/admin/mis-tareas")
}
```

---

## Filosofía de Diseño

> **"Visibilidad completa para tomar decisiones informadas."**

### Principios Aplicados

| Principio | Aplicación |
|-----------|------------|
| **Bottleneck Visibility** | Destacar quién está sobrecargado |
| **Health Indicators** | Semáforo de salud del equipo |
| **Trend Analysis** | Comparar con semanas anteriores |
| **Actionable Insights** | Cada insight tiene una acción sugerida |
| **Drill-down** | Click para ver detalle de cualquier métrica |

---

## Diseño UI/UX

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Dashboard del Equipo                                          [Exportar ▾] │
│ Vista general de productividad • Última actualización: hace 5 min          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │  🚨 ALERTAS DEL EQUIPO                                                   ││
│ │  ───────────────────────────────────────────────────────────────────     ││
│ │                                                                          ││
│ │  ⚠️ 8 tareas vencidas sin atender              [Revisar]                 ││
│ │  ⚠️ Carlos López tiene 15 tareas asignadas     [Redistribuir]            ││
│ │  ⚠️ 5 tareas sin asignar                       [Asignar]                 ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
│ │  📊 TOTAL       │ │  🔴 VENCIDAS    │ │  ⏳ EN PROGRESO │ │ ✅ TASA    │ │
│ │     45          │ │     8           │ │      12         │ │   72%      │ │
│ │  pendientes     │ │  críticas       │ │                 │ │  semanal   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘ │
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │  👥 CARGA POR MIEMBRO                                          [Período]││
│ │  ───────────────────────────────────────────────────────────────────     ││
│ │                                                                          ││
│ │  Carlos López    ████████████████░░░░ 15  ⚠️ Sobrecargado  [Reasignar] ││
│ │  María García    ████████░░░░░░░░░░░░  8  ✅ Balanceado               ││
│ │  Juan Pérez      ██████░░░░░░░░░░░░░░  6  ✅ Balanceado               ││
│ │  Ana Rodríguez   ████░░░░░░░░░░░░░░░░  4  ✅ Con capacidad            ││
│ │  Sin asignar     ██████████░░░░░░░░░░ 10  ⚠️ Pendientes    [Asignar]  ││
│ │                                                                          ││
│ │  Promedio ideal: 8 tareas/persona                                        ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌─────────────────────────────────────┐ ┌──────────────────────────────────┐│
│ │                                     │ │                                  ││
│ │  📈 TENDENCIA (4 semanas)           │ │  ⏱️ TIEMPO DE RESOLUCIÓN        ││
│ │                                     │ │                                  ││
│ │      Creadas   Completadas          │ │  Promedio: 3.2 días             ││
│ │  S-3:  12         10                │ │  Mediana: 2 días                ││
│ │  S-2:  15         14                │ │                                  ││
│ │  S-1:   8         11                │ │  Por prioridad:                 ││
│ │  Hoy:  10          7                │ │  • Urgente: 0.8 días            ││
│ │                                     │ │  • Alta: 1.5 días               ││
│ │  [Gráfico de barras agrupadas]      │ │  • Media: 3.5 días              ││
│ │                                     │ │  • Baja: 5.2 días               ││
│ │                                     │ │                                  ││
│ └─────────────────────────────────────┘ └──────────────────────────────────┘│
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │  📊 DISTRIBUCIÓN                                                         ││
│ │  ───────────────────────────────────────────────────────────────────     ││
│ │                                                                          ││
│ │  [Por Estado]      [Por Prioridad]      [Por Documento]      [Por Tag]   ││
│ │   Donut Chart       Donut Chart          Bar Chart           Bar Chart   ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │  🏆 RANKING DE PRODUCTIVIDAD                               [Esta semana]││
│ │  ───────────────────────────────────────────────────────────────────     ││
│ │                                                                          ││
│ │  1. 🥇 María García       14 completadas    🔥 12 días racha            ││
│ │  2. 🥈 Juan Pérez         12 completadas    🔥  8 días racha            ││
│ │  3. 🥉 Ana Rodríguez      10 completadas    🔥  5 días racha            ││
│ │  4.    Carlos López        8 completadas                                ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes Principales

### 1. Alertas del Equipo (Action Required)

```tsx
interface TeamAlert {
  type: 'overdue' | 'overloaded' | 'unassigned' | 'bottleneck'
  severity: 'critical' | 'warning' | 'info'
  message: string
  count: number
  action: {
    label: string
    onClick: () => void
  }
}

<TeamAlertsSection
  alerts={[
    {
      type: 'overdue',
      severity: 'critical',
      message: '8 tareas vencidas sin atender',
      count: 8,
      action: { label: 'Revisar', onClick: () => filterByOverdue() }
    },
    {
      type: 'overloaded',
      severity: 'warning',
      message: 'Carlos López tiene 15 tareas asignadas',
      count: 15,
      action: { label: 'Redistribuir', onClick: () => openReassignModal('carlos-id') }
    },
    // ...
  ]}
/>
```

**Reglas de alertas**:
- **Crítico**: Tareas vencidas > 0
- **Warning**: Miembro con > 10 tareas (configurable)
- **Warning**: Tareas sin asignar > 5
- **Info**: Tasa de completación < 70%

### 2. Quick Stats Agregadas

```tsx
<div className="grid grid-cols-4 gap-4">
  <TeamStatCard
    label="Total Pendientes"
    value={45}
    icon={ClipboardList}
    onClick={() => openTasksList()}
  />
  <TeamStatCard
    label="Vencidas"
    value={8}
    icon={AlertTriangle}
    variant="critical"
    onClick={() => filterByOverdue()}
  />
  <TeamStatCard
    label="En Progreso"
    value={12}
    icon={Clock}
    onClick={() => filterByStatus('En Progreso')}
  />
  <TeamStatCard
    label="Tasa Semanal"
    value="72%"
    icon={TrendingUp}
    trend={+5} // vs semana anterior
    variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'critical'}
  />
</div>
```

### 3. Carga por Miembro (Hero Section)

```tsx
<TeamWorkloadSection
  members={[
    {
      id: 'carlos-id',
      name: 'Carlos López',
      pending: 15,
      completed: 8,
      status: 'overloaded', // 'overloaded' | 'balanced' | 'available'
      avatar: '...'
    },
    // ...
  ]}
  idealLoad={8}
  onReassign={(memberId) => openReassignModal(memberId)}
  onViewTasks={(memberId) => filterByAssignee(memberId)}
/>
```

**Indicadores de estado**:
- 🔴 **Sobrecargado**: > 120% del promedio ideal
- 🟢 **Balanceado**: 80-120% del promedio ideal
- 🔵 **Con capacidad**: < 80% del promedio ideal
- ⚪ **Sin asignar**: Tareas sin responsable

### 4. Modal de Reasignación

```tsx
<ReassignTasksModal
  open={showReassign}
  onClose={() => setShowReassign(false)}
  fromMember={selectedMember}
  availableMembers={membersWithCapacity}
  tasksToReassign={overflowTasks}
  onConfirm={handleBulkReassign}
/>
```

### 5. Tendencia Semanal (Comparativa)

```tsx
<WeeklyTrendChart
  data={[
    { week: "Sem -3", created: 12, completed: 10 },
    { week: "Sem -2", created: 15, completed: 14 },
    { week: "Sem -1", created: 8, completed: 11 },
    { week: "Actual", created: 10, completed: 7 },
  ]}
  showGoal={true}
  goalPercentage={80}
/>
```

### 6. Tiempo de Resolución

```tsx
<ResolutionTimeCard
  average={3.2}
  median={2}
  byPriority={[
    { priority: 'Urgente', days: 0.8 },
    { priority: 'Alta', days: 1.5 },
    { priority: 'Media', days: 3.5 },
    { priority: 'Baja', days: 5.2 },
  ]}
  trend={-0.5} // días menos vs semana anterior (positivo = mejoría)
/>
```

**Cálculo**:
```typescript
const resolutionTime = differenceInDays(
  new Date(tarea.actualizado_en), // cuando se marcó terminada
  new Date(tarea.creado_en)       // cuando se creó
)
```

### 7. Ranking de Productividad

```tsx
<ProductivityRanking
  members={[
    { rank: 1, name: 'María García', completed: 14, streak: 12 },
    { rank: 2, name: 'Juan Pérez', completed: 12, streak: 8 },
    // ...
  ]}
  period="Esta semana"
  showStreak={true}
/>
```

**Nota sobre gamificación**: El ranking es motivacional pero debe usarse con cuidado. Mostrar solo si la cultura del equipo lo permite.

---

## Implementación Técnica

### Paso 1: Crear Página con Control de Acceso

Crear archivo `app/admin/procesos/tareas/dashboard/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TareasDashboardEquipo } from "./tareas-dashboard-equipo"

export const metadata = {
  title: "Dashboard de Equipo - Tareas",
}

export default async function TeamDashboardPage() {
  const supabase = await createClient()

  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("config_organizacion_miembros")
    .select("role")
    .eq("user_id", user.id)
    .single()

  // Only admin and owner can access
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect("/admin/mis-tareas")
  }

  return <TareasDashboardEquipo />
}
```

### Paso 2: Query para Métricas Agregadas

```typescript
async function getTeamStats() {
  const supabase = createClient()

  // All tasks
  const { data: tareas } = await supabase
    .from("v_tareas_org")
    .select("*")
    .is("eliminado_en", null)

  // All team members
  const { data: members } = await supabase
    .from("config_organizacion_miembros")
    .select("user_id, nombre_completo, cargo")
    .is("eliminado_en", null)

  return calculateTeamStats(tareas || [], members || [])
}

function calculateTeamStats(tareas: TareaView[], members: Member[]) {
  // Group tasks by assignee
  const byAssignee = groupBy(tareas, 'asignado_id')

  // Calculate workload per member
  const workload = members.map(member => {
    const memberTasks = byAssignee[member.user_id] || []
    const pending = memberTasks.filter(t => t.estado !== 'Terminada').length
    const completed = memberTasks.filter(t => t.estado === 'Terminada').length

    return {
      ...member,
      pending,
      completed,
      status: calculateLoadStatus(pending, avgLoad)
    }
  })

  // Add unassigned
  const unassigned = byAssignee[null]?.length || 0

  // Calculate resolution time
  const completedTasks = tareas.filter(t => t.estado === 'Terminada')
  const resolutionTimes = completedTasks.map(t =>
    differenceInDays(new Date(t.actualizado_en), new Date(t.creado_en))
  )

  return {
    total: tareas.filter(t => t.estado !== 'Terminada').length,
    overdue: tareas.filter(t => isOverdue(t)).length,
    inProgress: tareas.filter(t => t.estado === 'En Progreso').length,
    completedThisWeek: completedTasks.filter(t => isThisWeek(t.actualizado_en)).length,
    workload,
    unassigned,
    avgResolutionTime: mean(resolutionTimes),
    medianResolutionTime: median(resolutionTimes),
    // ... más stats
  }
}
```

### Paso 3: Server Action para Reasignación Masiva

```typescript
// app/actions/tareas.ts

export async function reasignarTareasMasivo(
  tareaIds: string[],
  nuevoAsignadoId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tr_tareas")
    .update({
      asignado_id: nuevoAsignadoId,
      actualizado_en: new Date().toISOString()
    })
    .in("id", tareaIds)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath("/admin/procesos/tareas")
  revalidatePath("/admin/procesos/tareas/dashboard")

  return { success: true, count: tareaIds.length }
}
```

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `app/admin/procesos/tareas/dashboard/page.tsx` | [NEW] Página con control de acceso |
| `app/admin/procesos/tareas/dashboard/tareas-dashboard-equipo.tsx` | [NEW] Cliente principal |
| `app/admin/procesos/tareas/dashboard/components/team-alerts-section.tsx` | [NEW] Alertas |
| `app/admin/procesos/tareas/dashboard/components/team-stats-grid.tsx` | [NEW] Quick stats |
| `app/admin/procesos/tareas/dashboard/components/team-workload-section.tsx` | [NEW] Carga |
| `app/admin/procesos/tareas/dashboard/components/reassign-tasks-modal.tsx` | [NEW] Modal |
| `app/admin/procesos/tareas/dashboard/components/weekly-trend-chart.tsx` | [NEW] Gráfico |
| `app/admin/procesos/tareas/dashboard/components/resolution-time-card.tsx` | [NEW] Tiempos |
| `app/admin/procesos/tareas/dashboard/components/productivity-ranking.tsx` | [NEW] Ranking |
| `app/admin/procesos/tareas/dashboard/components/distribution-charts.tsx` | [NEW] Donuts |

---

## Criterios de Aceptación

- [ ] Solo usuarios admin/owner pueden acceder
- [ ] Las alertas muestran problemas críticos primero
- [ ] Click en alerta lleva a acción correspondiente
- [ ] La carga por miembro muestra indicadores visuales
- [ ] Se puede reasignar tareas desde el dashboard
- [ ] Los gráficos son interactivos (filtran al hacer click)
- [ ] El tiempo de resolución se calcula correctamente
- [ ] El ranking es opcional/configurable
- [ ] Se puede exportar a CSV/PDF

---

## Estimación

| Componente | Tiempo |
|------------|--------|
| Página + control acceso | 30 min |
| Team Alerts Section | 1 hora |
| Team Stats Grid | 45 min |
| Team Workload + Modal | 2.5 horas |
| Weekly Trend Chart | 1 hora |
| Resolution Time Card | 1 hora |
| Distribution Charts | 1 hora |
| Productivity Ranking | 1 hora |
| Server action reasignación | 30 min |
| Testing | 1 hora |

**Total**: ~10-11 horas
