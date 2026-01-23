# PRD: Filtro de Tareas Completadas Antiguas

## Resumen

Implementar un filtro que oculte automáticamente tareas completadas (estado "Terminada") que superen un umbral de antigüedad configurable. Este filtro estará habilitado por defecto y será una configuración global para todos los usuarios de la organización.

---

## Problema

Actualmente, todas las tareas completadas permanecen visibles indefinidamente en las vistas de lista y kanban. Esto genera:

- **Saturación visual**: Demasiadas tareas completadas dificultan encontrar las activas
- **Rendimiento degradado**: Más datos a filtrar y renderizar
- **UX deficiente**: Los usuarios deben navegar entre tareas irrelevantes

---

## Solución Propuesta

### Funcionalidad

1. **Filtro dropdown** en el toolbar con opciones:
   - `Últimos 7 días` (por defecto)
   - `Últimos 15 días`
   - `Últimos 30 días`
   - `Personalizado` (abre date range picker)
   - `Mostrar todas` (desactiva el filtro)

2. **Lógica de filtrado**:
   - Aplica SOLO a tareas con `estado === 'Terminada'`
   - Compara `actualizado_en` contra el umbral seleccionado
   - Tareas con otros estados (`Pendiente`, `En Progreso`, `Pausada`, `Cancelada`) siempre se muestran

3. **Persistencia**:
   - La preferencia se guarda en `config_organizacion.configuracion` (JSONB)
   - Aplica a todos los usuarios de la organización
   - Campo: `configuracion.tareas.filtro_completadas_dias`

---

## Diseño UI/UX

### Ubicación

El filtro se agrega en el `PageToolbar`, después de los filtros existentes:

```
[Búsqueda] | [Prioridad v] [Estado v] [Etiquetas v] [Asignado v] [Vencimiento v] | [Completadas v] | [Vista] [Columnas]
```

### Componente

Usar `DataTableFacetedFilter` o un `Select` simple con las opciones:

```tsx
<Select value={completedFilter} onValueChange={setCompletedFilter}>
  <SelectTrigger className="w-[180px] h-8">
    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
    <SelectValue placeholder="Tareas completadas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="7">Últimos 7 días</SelectItem>
    <SelectItem value="15">Últimos 15 días</SelectItem>
    <SelectItem value="30">Últimos 30 días</SelectItem>
    <SelectItem value="custom">Personalizado...</SelectItem>
    <SelectSeparator />
    <SelectItem value="all">Mostrar todas</SelectItem>
  </SelectContent>
</Select>
```

### Visual Feedback

- Badge con contador: `"Ocultas: 15"` cuando hay tareas filtradas
- Tooltip explicativo en hover: "Se ocultan tareas completadas hace más de X días"

---

## Implementación Técnica

### Paso 1: Agregar estado en `tareas-page-client.tsx`

```tsx
// Estado para el filtro de completadas
const [completedDaysFilter, setCompletedDaysFilter] = useState<string>("7") // "7", "15", "30", "all", "custom"
const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | null>(null)
```

### Paso 2: Agregar lógica de filtrado

Modificar el `useMemo` de `fullyFilteredData`:

```tsx
const fullyFilteredData = React.useMemo(() => {
  let data = filteredData // Ya tiene globalSearch aplicado

  // Aplicar filtro de tareas completadas antiguas
  if (completedDaysFilter !== "all") {
    const cutoffDate = new Date()
    const days = completedDaysFilter === "custom"
      ? Math.floor((customDateRange?.from?.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : parseInt(completedDaysFilter, 10)

    cutoffDate.setDate(cutoffDate.getDate() - days)

    data = data.filter((tarea) => {
      // Siempre mostrar tareas NO completadas
      if (tarea.estado !== 'Terminada') return true

      // Para completadas, verificar si están dentro del rango
      const updatedAt = new Date(tarea.actualizado_en || tarea.creado_en)
      return updatedAt >= cutoffDate
    })
  }

  // Continuar con columnFilters existentes...
  if (columnFilters.length === 0) return data

  return data.filter((item) => {
    // ... lógica existente
  })
}, [filteredData, columnFilters, completedDaysFilter, customDateRange])
```

### Paso 3: Calcular tareas ocultas

```tsx
const hiddenCompletedCount = React.useMemo(() => {
  if (completedDaysFilter === "all") return 0

  const days = completedDaysFilter === "custom"
    ? /* calcular días del rango custom */
    : parseInt(completedDaysFilter, 10)

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return filteredData.filter((tarea) => {
    if (tarea.estado !== 'Terminada') return false
    const updatedAt = new Date(tarea.actualizado_en || tarea.creado_en)
    return updatedAt < cutoffDate
  }).length
}, [filteredData, completedDaysFilter])
```

### Paso 4: Agregar UI en el toolbar

En `PageToolbar.left`:

```tsx
{/* Separador después de fecha de vencimiento */}
<Separator orientation="vertical" className="h-6" />

{/* Filtro de completadas */}
<Select value={completedDaysFilter} onValueChange={setCompletedDaysFilter}>
  <SelectTrigger className="w-[180px] h-8 text-sm">
    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
    <SelectValue placeholder="Completadas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="7">Últimos 7 días</SelectItem>
    <SelectItem value="15">Últimos 15 días</SelectItem>
    <SelectItem value="30">Últimos 30 días</SelectItem>
    <SelectSeparator />
    <SelectItem value="all">Mostrar todas</SelectItem>
  </SelectContent>
</Select>

{/* Badge de ocultas */}
{hiddenCompletedCount > 0 && (
  <Badge variant="secondary" className="text-xs">
    Ocultas: {hiddenCompletedCount}
  </Badge>
)}
```

### Paso 5: Persistencia (Opcional - Fase 2)

Guardar preferencia en `config_organizacion.configuracion`:

1. Crear server action `updateOrganizacionPreference`
2. Leer preferencia inicial con `useQuery` o props del servidor
3. Actualizar `setCompletedDaysFilter` para guardar cambios

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| [tareas-page-client.tsx](file:///Users/oscarjavier/AIProjects/Nuevo%20Stack%20CCE/Proyectos/SOCIOS_ADMIN/app/admin/procesos/tareas/tareas-page-client.tsx) | Agregar estado, lógica de filtrado y UI del Select |

---

## Criterios de Aceptación

- [ ] El filtro muestra opciones: 7, 15, 30 días y "Mostrar todas"
- [ ] Por defecto está en "7 días"
- [ ] Solo oculta tareas con estado "Terminada"
- [ ] El contador de tareas ocultas es preciso
- [ ] Funciona tanto en vista Lista como en Kanban
- [ ] Al cambiar el filtro, la vista se actualiza inmediatamente
- [ ] El metadata del header refleja el conteo correcto (con/sin ocultas)

---

## Estimación

| Fase | Tiempo |
|------|--------|
| Implementación base | 1-2 horas |
| Testing | 30 min |
| Persistencia (opcional) | 1 hora |

**Total**: ~2-3 horas
