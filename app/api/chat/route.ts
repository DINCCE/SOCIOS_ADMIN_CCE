import { convertToModelMessages, streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import {
  aiNavigate,
  aiSearch,
  aiCreateTarea,
  aiCreateAccion,
  aiGetSummary,
} from '@/features/ai-companion/lib/ai-actions'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    // Build context string for system prompt
    let contextInfo = ''
    if (context) {
      if (context.currentPath) {
        contextInfo += `\nCurrent page: ${context.currentPath}`
      }
      if (context.currentPageEntity) {
        contextInfo += `\nCurrent entity: ${context.currentPageEntity}`
      }
    }

    const result = streamText({
      model: openrouter.chat('anthropic/claude-sonnet-4'),
      system: `You are a helpful AI assistant for SOCIOS_ADMIN CRM.

You can help users:
- Navigate to different pages (personas, empresas, tareas, acciones)
- Search and find information about actors and tasks
- Create new tareas (tasks) and acciones (activities)
- Get summaries and counts

Entities in the CRM:
- personas: Individual people in the system
- empresas: Companies/organizations
- tareas: Tasks assigned to users
- acciones: Activities and interactions logged${contextInfo}

When using tools:
1. Always explain what you're going to do before taking action
2. For navigation, tell the user which page you're navigating to
3. For searches, summarize the results clearly
4. For creating records, confirm what was created
5. Be concise and helpful in your responses`,
      messages: await convertToModelMessages(messages),
      tools: {
        navigate: {
          description: 'Navigate to a specific page in the CRM. Use this when the user wants to go to a different section.',
          inputSchema: z.object({
            path: z.string().describe('The route path to navigate to'),
            entity: z.enum(['personas', 'empresas', 'tareas', 'acciones', 'analitica', 'settings']).describe('The entity type'),
            entityId: z.string().optional().describe('Optional specific entity ID'),
          }),
          execute: async (params) => {
            return await aiNavigate(params as { path: string; entity: string; entityId?: string })
          },
        },
        search: {
          description: 'Search or filter records in the CRM.',
          inputSchema: z.object({
            entity: z.enum(['personas', 'empresas', 'tareas', 'acciones']).describe('The entity to search'),
            query: z.string().optional().describe('Search query text'),
            filters: z.record(z.string(), z.unknown()).optional().describe('Filters to apply'),
          }),
          execute: async (params) => {
            return await aiSearch(params as { entity: string; query?: string; filters?: Record<string, unknown> })
          },
        },
        createTarea: {
          description: 'Create a new tarea (task).',
          inputSchema: z.object({
            titulo: z.string().describe('Task title'),
            descripcion: z.string().optional().describe('Task description'),
            prioridad: z.enum(['baja', 'media', 'alta']).optional().describe('Task priority'),
          }),
          execute: async (params) => {
            return await aiCreateTarea(params as { titulo: string; descripcion?: string; prioridad?: 'baja' | 'media' | 'alta' })
          },
        },
        createAccion: {
          description: 'Create a new acción (action/activity).',
          inputSchema: z.object({
            tipo_acción: z.string().describe('Type of action'),
            descripcion: z.string().describe('Action description'),
          }),
          execute: async (params) => {
            return await aiCreateAccion(params as { tipo_acción: string; descripcion: string })
          },
        },
        getSummary: {
          description: 'Get a summary of information about entities.',
          inputSchema: z.object({
            entity: z.enum(['personas', 'empresas', 'tareas', 'acciones']).describe('The entity to summarize'),
          }),
          execute: async (params) => {
            return await aiGetSummary(params as { entity: string })
          },
        },
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
