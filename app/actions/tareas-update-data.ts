'use server'

/**
 * Script to update tr_tareas with recent dates and distribute between users
 * This can be called via a one-time API endpoint or directly
 *
 * Run this with: node -e "require('./app/actions/tareas-update-data.ts').main()"
 */

import { createClient } from '@/lib/supabase/server'

// Users to distribute tasks between
const USER_1 = 'f4253232-db2e-4055-8ad9-80281be73235'

// Helper: Generate random dates around today (Jan 24, 2026)
function generateDates() {
  const today = new Date('2026-01-24T00:00:00.000Z')
  const dates = []

  // Last week (Jan 17-23, 2026) - some overdue/past tasks
  for (let i = 7; i >= 1; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0)
    dates.push(date)
  }

  // Today (Jan 24, 2026)
  const todayDate = new Date(today)
  todayDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0)
  dates.push(todayDate)

  // Tomorrow (Jan 25, 2026)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0)
  dates.push(tomorrow)

  // Next 2 weeks (Jan 26 - Feb 7, 2026)
  for (let i = 2; i <= 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    date.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0)
    dates.push(date)
  }

  return dates
}

// Coherent task names for business CRM
const taskTemplates = {
  alta: [
    'Revisar documentación de nuevo socio',
    'Verificar referencias comerciales',
    'Validar información de contacto',
    'Preparar contrato de asociación',
    'Enviar bienvenida a nuevo socio',
    'Agendar reunión de onboarding'
  ],
  seguimiento: [
    'Llamada de seguimiento mensual',
    'Revisar cumplimiento de acuerdos',
    'Actualizar información del socio',
    'Enviar reporte de actividades',
    'Verificar satisfacción del servicio',
    'Revisar oportunidades de upgrade'
  ],
  administrativo: [
    'Actualizar registro de acciones',
    'Verificar pagos pendientes',
    'Revisar documentación fiscal',
    'Actualizar datos de facturación',
    'Conciliar movimientos bancarios',
    'Preparar reporte mensual'
  ],
  comercial: [
    'Contactar lead potencial',
    'Preparar propuesta comercial',
    'Revisar solicitud de propuesta',
    'Seguimiento a oferta enviada',
    'Presentar servicios a prospecto',
    'Negociar términos de contrato'
  ],
  urgente: [
    'Resolver incidencia crítica',
    'Atender solicitud urgente',
    'Revisar rechazo de pago',
    'Resolver queja de cliente',
    'Atender cancelación de servicio',
    'Contactar socio moroso'
  ]
}

/**
 * Main function to update tasks
 */
export async function updateTasksData() {
  const supabase = await createClient()

  console.log('🔄 Starting tasks update...')

  // Step 1: Get current tasks
  console.log('\n📋 Fetching current tasks...')
  const { data: currentTasks, error: fetchError } = await supabase
    .from('tr_tareas')
    .select('*')
    .is('eliminado_en', null)

  if (fetchError) {
    console.error('Error fetching tasks:', fetchError)
    return { success: false, error: fetchError.message }
  }

  console.log(`Found ${currentTasks.length} existing tasks`)

  // Step 2: Get current user (first one we find from org members)
  const { data: orgMembers } = await supabase
    .from('config_organizacion_miembros')
    .select('user_id')
    .is('eliminado_en', null)
    .limit(10)

  const users = orgMembers?.map(m => m.user_id) || []
  const currentUser = users.find(u => u !== USER_1) || users[0] || USER_1

  console.log(`\n👥 Users:`)
  console.log(`  - User 1: ${USER_1}`)
  console.log(`  - User 2 (current): ${currentUser}`)

  // Step 3: Generate dates
  const dates = generateDates()
  console.log(`\n📅 Generated ${dates.length} dates from ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length - 1].toISOString().split('T')[0]}`)

  // Step 4: Update existing tasks with new dates and users
  console.log('\n🔄 Updating tasks...')
  let updateCount = 0
  let errorCount = 0

  for (let i = 0; i < currentTasks.length; i++) {
    const task = currentTasks[i]

    // Alternate between users
    const asignadoId = i % 2 === 0 ? currentUser : USER_1
    const fechaVencimiento = dates[i % dates.length].toISOString()

    // Determine if task should be completed based on due date
    const taskDate = new Date(fechaVencimiento)
    const today = new Date('2026-01-24')
    let estado: string = 'Pendiente'

    if (taskDate < today) {
      // Past dates: some completed, some pending (overdue)
      estado = Math.random() > 0.5 ? 'Terminada' : 'Pendiente'
    } else if (taskDate.toDateString() === today.toDateString()) {
      // Today: mostly in progress
      estado = Math.random() > 0.3 ? 'En Progreso' : 'Pendiente'
    }

    const { error: updateError } = await supabase
      .from('tr_tareas')
      .update({
        fecha_vencimiento: fechaVencimiento,
        asignado_id: asignadoId,
        estado: estado as any,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', task.id)

    if (updateError) {
      console.error(`  ❌ Error updating task ${task.id}:`, updateError.message)
      errorCount++
    } else {
      updateCount++
      if (updateCount % 10 === 0) {
        console.log(`  Updated ${updateCount}/${currentTasks.length} tasks...`)
      }
    }
  }

  console.log(`\n✅ Update complete:`)
  console.log(`  - Updated: ${updateCount} tasks`)
  console.log(`  - Errors: ${errorCount}`)

  // Step 5: Show summary
  const { data: summary } = await supabase
    .from('tr_tareas')
    .select('id, estado, prioridad, fecha_vencimiento, asignado_id')
    .is('eliminado_en', null)
    .order('fecha_vencimiento', { ascending: true })

  const byEstado: Record<string, number> = {}
  const byUser: Record<string, number> = { [currentUser]: 0, [USER_1]: 0 }
  const byDateRange = { past: 0, today: 0, future: 0 }

  summary?.forEach(t => {
    byEstado[t.estado] = (byEstado[t.estado] || 0) + 1
    if (t.asignado_id === currentUser) byUser[currentUser]++
    else if (t.asignado_id === USER_1) byUser[USER_1]++

    const taskDate = new Date(t.fecha_vencimiento!)
    const today = new Date('2026-01-24')
    if (taskDate < today) byDateRange.past++
    else if (taskDate.toDateString() === today.toDateString()) byDateRange.today++
    else byDateRange.future++
  })

  console.log('\n📊 Summary of updated tasks:')
  console.log('\n  By State:')
  Object.entries(byEstado).forEach(([k, v]) => console.log(`    - ${k}: ${v}`))
  console.log('\n  By User:')
  console.log(`    - Current user (${currentUser?.slice(0, 8)}...): ${byUser[currentUser] || 0}`)
  console.log(`    - User 1 (${USER_1.slice(0, 8)}...): ${byUser[USER_1] || 0}`)
  console.log('\n  By Date:')
  console.log(`    - Past (overdue): ${byDateRange.past}`)
  console.log(`    - Today: ${byDateRange.today}`)
  console.log(`    - Future: ${byDateRange.future}`)

  return {
    success: true,
    updated: updateCount,
    errors: errorCount,
    summary: { byEstado, byUser, byDateRange }
  }
}

// Allow running directly
// main().catch(console.error)
