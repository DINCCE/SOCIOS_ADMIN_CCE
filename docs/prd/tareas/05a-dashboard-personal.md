# PRD: Dashboard Personal de Tareas ("Mis Tareas")

## Resumen

Crear un dashboard personal donde cada usuario puede ver y gestionar **únicamente sus propias tareas**. Enfocado en productividad individual, con herramientas de autogestión y visibilidad de compromisos personales.

---

## Diferencia con Dashboard de Equipo

| Aspecto | Dashboard Personal | Dashboard de Equipo |
|---------|-------------------|---------------------|
| **Datos** | Solo tareas asignadas al usuario actual | Todas las tareas de la organización |
| **Propósito** | Autogestión y productividad | Supervisión y distribución |
| **Acceso** | Todos los usuarios | Solo admin/owner |
| **Ubicación** | Página de inicio o `/admin/mis-tareas` | `/admin/procesos/tareas/dashboard` |

---

## Filosofía de Diseño

> **"Tu día, tu control."**

### Principios Aplicados

| Principio | Aplicación |
|-----------|------------|
| **Commitment Device** | "Mi Foco Hoy" - máximo 3 tareas |
| **Progress Tracking** | Racha de días productivos |
| **Micro-wins** | Celebrar cada tarea completada |
| **Planning Fallacy Awareness** | Mostrar estimación vs realidad |
| **Time Blocking** | Vista por franjas horarias (opcional) |

---

## Diseño UI/UX

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Buenos días, Juan 👋                                    [Ver todas] [+ Nueva]│
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │  📌 MI FOCO HOY                                              [Editar]  ││
│ │                                                                         ││
│ │  ☐ Llamar a cliente Pérez para confirmar reunión              🔴 Alta  ││
│ │  ☐ Revisar contrato ABC antes de las 3pm                      🟡 Media ││
│ │  ☐ Enviar propuesta a XYZ Corp                                 🟢 Baja  ││
│ │                                                                         ││
│ │  [+ Agregar tarea al foco]                      Progreso: 0/3 (0%)      ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
│ │  🔴 VENCIDAS    │ │  🟠 HOY         │ │  📅 MAÑANA      │ │ 🔥 RACHA   │ │
│ │     2           │ │     3           │ │      1          │ │   5 días   │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘ │
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │  📋 MIS TAREAS PENDIENTES                                    [Filtrar ▾]││
│ │  ───────────────────────────────────────────────────────────────────     ││
│ │                                                                          ││
│ │  VENCIDAS                                                                ││
│ │  ┌────────────────────────────────────────────────────────────────────┐  ││
│ │  │ 🔴 Revisar compra de acción 1234               Venció hace 2 días │  ││
│ │  │    Alta • DOC-00456                                     [Completar]│  ││
│ │  └────────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  HOY                                                                     ││
│ │  ┌────────────────────────────────────────────────────────────────────┐  ││
│ │  │ 🟠 Llamar al cliente Pérez                               ⏰ Hoy   │  ││
│ │  └────────────────────────────────────────────────────────────────────┘  ││
│ │  ┌────────────────────────────────────────────────────────────────────┐  ││
│ │  │ 🟠 Reunión con equipo legal                              ⏰ Hoy   │  ││
│ │  └────────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ │  PRÓXIMOS 7 DÍAS                                                         ││
│ │  ┌────────────────────────────────────────────────────────────────────┐  ││
│ │  │ 🟡 Preparar presentación mensual                          📅 Vie  │  ││
│ │  └────────────────────────────────────────────────────────────────────┘  ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌─────────────────────────────────────┐ ┌──────────────────────────────────┐│
│ │                                     │ │                                  ││
│ │  📊 MI SEMANA                       │ │  🏆 MI PRODUCTIVIDAD             ││
│ │                                     │ │                                  ││
│ │  Completadas: 8                     │ │  Esta semana: 8 tareas          ││
│ │  Nuevas asignadas: 5                │ │  Promedio: 6 tareas/sem         ││
│ │  Pendientes: 12                     │ │                                  ││
│ │                                     │ │  🔥 Racha actual: 5 días        ││
│ │  [Gráfico mini: L M M J V S D]      │ │  📈 Mejor racha: 12 días        ││
│ │                                     │ │                                  ││
│ └─────────────────────────────────────┘ └──────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes Principales

### 1. Saludo Personalizado

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold">
      {getGreeting()}, {userName} 👋
    </h1>
    <p className="text-muted-foreground">
      Tienes {pendingCount} tareas pendientes para hoy.
    </p>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" asChild>
      <Link href="/admin/procesos/tareas">Ver todas</Link>
    </Button>
    <NewTareaSheet />
  </div>
</div>

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 18) return "Buenas tardes"
  return "Buenas noches"
}
```

### 2. Mi Foco Hoy (Hero Section)

El componente más prominente - máximo 3 tareas que el usuario elige como foco:

```tsx
interface FocusTask {
  id: string
  titulo: string
  prioridad: string
  completed: boolean
  orden: number
}

<MiFocoHoy
  tasks={focusTasks}
  onReorder={handleReorder}       // Drag and drop
  onToggleComplete={handleToggle}
  onRemove={handleRemove}
  onAdd={handleAddToFocus}
  maxTasks={3}
  showProgress={true}
/>
```

**Persistencia**: En `config_organizacion_miembros.atributos.foco_diario`:

```json
{
  "foco_diario": {
    "fecha": "2026-01-22",
    "tareas": ["uuid1", "uuid2", "uuid3"]
  }
}
```

### 3. Quick Stats Personales

```tsx
<div className="grid grid-cols-4 gap-4">
  <PersonalStatCard
    icon={AlertTriangle}
    label="Vencidas"
    value={stats.vencidas}
    urgentStyle
    onClick={() => scrollToSection("vencidas")}
  />
  <PersonalStatCard
    icon={Clock}
    label="Hoy"
    value={stats.hoy}
    warningStyle
    onClick={() => scrollToSection("hoy")}
  />
  <PersonalStatCard
    icon={Calendar}
    label="Mañana"
    value={stats.manana}
  />
  <PersonalStatCard
    icon={Flame}
    label="Racha"
    value={`${stats.racha} días`}
    accentStyle
  />
</div>
```

### 4. Lista de Tareas Agrupadas

```tsx
<MisTareasLista
  tareas={misTareas}
  groupBy="vencimiento" // 'vencimiento' | 'prioridad' | 'proyecto'
  onTaskClick={openTareaDetail}
  onQuickComplete={handleQuickComplete}
  showQuickActions
/>
```

**Grupos por vencimiento**:
1. Vencidas (rojo, prominente)
2. Hoy (naranja)
3. Mañana (amarillo)
4. Próximos 7 días (neutral)
5. Sin fecha (gris)

### 5. Mi Semana (Mini Stats)

```tsx
<MiSemanaCard
  completed={8}
  newAssigned={5}
  pending={12}
  weeklyData={[
    { day: "L", completed: 2, added: 1 },
    { day: "M", completed: 3, added: 2 },
    // ...
  ]}
/>
```

### 6. Mi Productividad (Gamificación Sutil)

```tsx
<MiProductividadCard
  thisWeek={8}
  average={6}
  currentStreak={5}
  bestStreak={12}
  showMotivation  // "¡Vas muy bien!" o "Un poco más de esfuerzo esta semana"
/>
```

**Racha**: Días consecutivos completando al menos 1 tarea.

---

## Implementación Técnica

### Paso 1: Crear Página

Crear archivo `app/admin/mis-tareas/page.tsx`:

```tsx
import { MisTareasDashboard } from "./mis-tareas-dashboard"

export const metadata = {
  title: "Mis Tareas",
}

export default function MisTareasPage() {
  return <MisTareasDashboard />
}
```

### Paso 2: Crear Cliente

Crear archivo `app/admin/mis-tareas/mis-tareas-dashboard.tsx`:

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function MisTareasDashboard() {
  // Get current user's tasks only
  const { data: misTareas, isLoading } = useQuery({
    queryKey: ["mis-tareas"],
    queryFn: async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Fetch only tasks assigned to current user
      const { data } = await supabase
        .from("v_tareas_org")
        .select("*")
        .eq("asignado_id", user.id)
        .is("eliminado_en", null)
        .order("fecha_vencimiento", { ascending: true })

      return data || []
    },
  })

  // ... resto del componente
}
```

### Paso 3: Lógica de Racha

```typescript
async function calcularRacha(userId: string): Promise<{ current: number; best: number }> {
  const supabase = createClient()
  
  // Get completion dates for last 30 days
  const { data } = await supabase
    .from("v_tareas_org")
    .select("actualizado_en")
    .eq("asignado_id", userId)
    .eq("estado", "Terminada")
    .gte("actualizado_en", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("actualizado_en", { ascending: false })

  if (!data?.length) return { current: 0, best: 0 }

  // Group by date
  const dateSet = new Set(
    data.map(t => new Date(t.actualizado_en).toDateString())
  )

  // Calculate current streak
  let current = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  while (dateSet.has(checkDate.toDateString())) {
    current++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Best streak would need historical tracking (simplified here)
  const best = Math.max(current, /* stored best */ 0)

  return { current, best }
}
```

### Paso 4: Integrar en Navegación

El dashboard personal podría ser la **página de inicio por defecto** después del login:

```tsx
// En app/admin/page.tsx o redirect desde /admin
redirect("/admin/mis-tareas")
```

O agregar en el sidebar:

```tsx
{
  title: "Mis Tareas",
  url: "/admin/mis-tareas",
  icon: CheckSquare,
  badge: pendingCount, // Mostrar contador
}
```

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `app/admin/mis-tareas/page.tsx` | [NEW] Página |
| `app/admin/mis-tareas/mis-tareas-dashboard.tsx` | [NEW] Cliente principal |
| `app/admin/mis-tareas/components/mi-foco-hoy.tsx` | [NEW] Hero section |
| `app/admin/mis-tareas/components/personal-stats.tsx` | [NEW] Métricas |
| `app/admin/mis-tareas/components/mis-tareas-lista.tsx` | [NEW] Lista agrupada |
| `app/admin/mis-tareas/components/mi-semana-card.tsx` | [NEW] Stats semana |
| `app/admin/mis-tareas/components/mi-productividad-card.tsx` | [NEW] Gamificación |

---

## Criterios de Aceptación

- [ ] Solo muestra tareas asignadas al usuario actual
- [ ] "Mi Foco Hoy" permite agregar hasta 3 tareas
- [ ] El foco se persiste entre sesiones
- [ ] Las tareas se agrupan por vencimiento
- [ ] La racha de días se calcula correctamente
- [ ] El saludo cambia según la hora del día
- [ ] Quick complete funciona sin abrir drawer
- [ ] El dashboard es responsive

---

## Estimación

| Componente | Tiempo |
|------------|--------|
| Página y layout | 30 min |
| Mi Foco Hoy + persistencia | 2 horas |
| Quick Stats | 45 min |
| Lista de Tareas | 1.5 horas |
| Mi Semana | 45 min |
| Mi Productividad + Racha | 1.5 horas |
| Integración navegación | 30 min |
| Testing | 30 min |

**Total**: ~8-9 horas
