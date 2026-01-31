import { convertToModelMessages, streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

import {
  aiSearch,
  aiCreateTarea,
  aiCreateDocComercial,
  aiCreatePersona,
  aiCreateEmpresa,
  aiAsignarFamiliar,
  aiAsignarAccion,
  aiGetSummary,
} from '@/features/ai-companion/lib/ai-actions'
import {
  navigateToolSchema,
  searchToolSchema,
  createTareaToolSchema,
  createDocComercialToolSchema,
  createPersonaToolSchema,
  createEmpresaToolSchema,
  asignarFamiliarToolSchema,
  asignarAccionToolSchema,
  getSummaryToolSchema,
} from '@/features/ai-companion/lib/ai-tools'
import { AI_MODELS, AI_MODES, DEFAULT_MODEL, DEFAULT_MODE, type AIModeId } from '@/features/ai-companion/types/config'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

const getModePrompt = (modeId: AIModeId) => {
  switch (modeId) {
    case 'concise':
      return '\n\nIMPORTANT: Be extremely concise. Give short, direct answers. Avoid unnecessary explanations.'
    case 'technical':
      return '\n\nIMPORTANT: Provide technical details, database field names when relevant, and clear step-by-step instructions. Focus on accuracy and technical depth.'
    case 'creative':
      return '\n\nIMPORTANT: Be more descriptive and helpful. Provide context and suggestions. Use a more friendly and engaging tone.'
    case 'standard':
    default:
      return ''
  }
}

export async function POST(req: Request) {
  try {
    const { messages, context, modelId, modeId } = await req.json()

    // Validate model and mode or use defaults
    const selectedModel = AI_MODELS.some(m => m.id === modelId) ? modelId : DEFAULT_MODEL
    const selectedMode = (AI_MODES.some(m => m.id === modeId) ? modeId : DEFAULT_MODE) as AIModeId

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

    const modePrompt = getModePrompt(selectedMode)

    const result = streamText({
      model: openrouter.chat(selectedModel),
      system: `You are a helpful AI assistant for SOCIOS_ADMIN CRM.

You can help users:
- Navigate to any page in the CRM
- Search and find information (personas, empresas, tareas, acciones, doc_comerciales)
- Create new records (personas, empresas, tareas, doc_comerciales)
- Assign family relationships between actors
- Assign actions (shares) to actors
- Get summaries and counts
- Answer questions about the CRM${contextInfo}

CRITICAL: When the user wants to go to a page or navigate, you MUST call the 'navigate' tool. Do not just say you will do it; execute the tool call immediately.

NAVIGATION KEYWORDS: If the user says any of these words, you MUST call the navigate tool:
- "navega", "navigate", "go to", "vé a", "ir a", "llévame a", "abre", "open", "show me"
- Followed by any page name like: "personas", "empresas", "tareas", "mis tareas", "panel", etc.

AVAILABLE PAGES FOR NAVIGATION (Use these exact names for the 'page' argument):
- "Personas" -> Individual partners list (/admin/socios/personas)
- "Empresas" -> Company partners list (/admin/socios/empresas)
- "Mis Tareas" -> User tasks (/admin/mis-tareas)
- "Tareas" -> Global tasks processes (/admin/procesos/tareas)
- "Acciones" -> Shares/Actions processes (/admin/procesos/acciones)
- "Documentos Comerciales" -> Commercial documents processes (/admin/procesos/documentos-comerciales)
- "Panel" -> Main dashboard (/admin)
- "Analítica" -> Analytics dashboard (/admin/analitica)
- "Organizaciones" -> Organization management (/admin/organizations)
- "Perfil" -> User profile settings (/admin/settings/profile)
- "Cuenta" -> Account settings (/admin/settings/account)
- "Componentes" -> UI components reference (/admin/settings/componentes)
- "Vistas" -> System views settings (/admin/settings/views)

EXAMPLE:
User: "navega a personas"
You MUST: Call navigate tool with {page: "Personas"}
Then respond: "Te he llevado a la página de Personas."

DO NOT just respond with text for navigation requests. You MUST call the tool.

When using tools:
1. For navigation: ALWAYS call the navigate tool, then confirm with text.
2. For searches: Call search tool, then summarize results.
3. For creating records: Call the appropriate create tool, then confirm.
4. For assignments: Call the assignment tool, then explain what was done.
5. Be concise and helpful in your responses${modePrompt}`,
      messages: await convertToModelMessages(messages),
      tools: {
        navigate: {
          description: 'Navigate to a specific page in the CRM.',
          inputSchema: navigateToolSchema,
          execute: async (params) => {
            // Navigation is handled client-side in onToolCall
            // This execute function ensures arguments are properly passed through
            return { success: true, params }
          },
        },
        search: {
          description: 'Search or filter records in the CRM.',
          inputSchema: searchToolSchema,
          execute: async (params) => {
            try {
              return await aiSearch(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Search failed' }
            }
          },
        },
        createTarea: {
          description: 'Create a new tarea (task).',
          inputSchema: createTareaToolSchema,
          execute: async (params) => {
            try {
              return await aiCreateTarea(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to create tarea' }
            }
          },
        },
        createDocComercial: {
          description: 'Create a new commercial document (opportunity, offer, etc.).',
          inputSchema: createDocComercialToolSchema,
          execute: async (params) => {
            try {
              return await aiCreateDocComercial(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to create document' }
            }
          },
        },
        createPersona: {
          description: 'Create a new persona (individual partner).',
          inputSchema: createPersonaToolSchema,
          execute: async (params) => {
            try {
              return await aiCreatePersona(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to create persona' }
            }
          },
        },
        createEmpresa: {
          description: 'Create a new empresa (company partner).',
          inputSchema: createEmpresaToolSchema,
          execute: async (params) => {
            try {
              return await aiCreateEmpresa(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to create empresa' }
            }
          },
        },
        asignarFamiliar: {
          description: 'Create a relationship (family, labor, etc.) between two actors.',
          inputSchema: asignarFamiliarToolSchema,
          execute: async (params) => {
            try {
              return await aiAsignarFamiliar(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to assign relationship' }
            }
          },
        },
        asignarAccion: {
          description: 'Assign a share (accion) to an actor.',
          inputSchema: asignarAccionToolSchema,
          execute: async (params) => {
            try {
              return await aiAsignarAccion(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to assign share' }
            }
          },
        },
        getSummary: {
          description: 'Get a summary of information about entities.',
          inputSchema: getSummaryToolSchema,
          execute: async (params) => {
            try {
              return await aiGetSummary(params)
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Failed to get summary' }
            }
          },
        },
      },
    })

    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
