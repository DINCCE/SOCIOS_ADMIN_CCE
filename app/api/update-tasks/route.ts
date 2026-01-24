import { updateTasksData } from '@/app/actions/tareas-update-data'
import { NextResponse } from 'next/server'

/**
 * One-time API endpoint to update tasks with recent dates
 * Call with: GET /api/update-tasks
 */
export async function GET() {
  try {
    const result = await updateTasksData()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Updated ${result.updated} tasks`,
        data: result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
