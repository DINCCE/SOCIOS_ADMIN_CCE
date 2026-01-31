'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Sparkles, Trash2, User, Copy, Settings, Bot, Zap, Cpu, Settings2, Maximize2, Mic, Paperclip, Image as ImageIcon, Loader2, ChevronDown, Globe, Sparkle } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useNotify } from '@/lib/hooks/use-notify'
import { AI_MODELS, AI_MODES, AI_SIZES, DEFAULT_MODEL, DEFAULT_MODE, type AIModelId, type AIModeId } from '../types/config'
import { useAICompanion } from '../hooks/use-ai-companion'

// UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

// ============================================================================
// Official AI Elements Imports
// ============================================================================

// Conversation & Messages
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAvatar,
  MessageActions,
  MessageAction,
  MessageToolbar,
} from '@/components/ai-elements/message'

// Prompt Input with all sub-components
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputButton,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'

// Attachments
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from '@/components/ai-elements/attachments'

// Reasoning & Tools
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning'
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'

// Rich Content Displays
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactContent,
} from '@/components/ai-elements/artifact'
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from '@/components/ai-elements/task'
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
} from '@/components/ai-elements/plan'
import {
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Persona } from '@/components/ai-elements/persona'

// Loading & States
import { Loader } from '@/components/ai-elements/loader'
import { Shimmer } from '@/components/ai-elements/shimmer'

// Context & Sources
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
} from '@/components/ai-elements/context'
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources'

// Speech Input
import { SpeechInput } from '@/components/ai-elements/speech-input'

// ============================================================================
// Types & Constants
// ============================================================================

interface AIChatViewProps {
  conversationId?: string
  showHeader?: boolean
  storageKey?: string
}

const STORAGE_KEY = 'ai-companion-messages'
const CONFIG_STORAGE_KEY = 'ai-companion-config'

// ============================================================================
// Helper Functions
// ============================================================================

function loadMessagesFromStorage(key: string) {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Failed to load messages from storage:', e)
  }
  return []
}

function saveMessagesToStorage(key: string, messages: unknown[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(messages))
  } catch (e) {
    console.error('Failed to save messages to storage:', e)
  }
}

function clearMessagesFromStorage(key: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error('Failed to clear messages from storage:', e)
  }
}

function loadConfigFromStorage() {
  if (typeof window === 'undefined') return { modelId: DEFAULT_MODEL, modeId: DEFAULT_MODE }
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load config from storage:', e)
  }
  return { modelId: DEFAULT_MODEL, modeId: DEFAULT_MODE }
}

function saveConfigToStorage(config: { modelId: string; modeId: string }) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('Failed to save config to storage:', e)
  }
}

// ============================================================================
// Tool Result Renderer
// ============================================================================

function ToolResultRenderer({ toolResult, isStreaming }: { toolResult: any, isStreaming: boolean }) {
  const { toolName, result, error, args } = toolResult
  const isError = !!error

  if (isError) {
    return (
      <Tool defaultOpen={true}>
        <ToolHeader
          type="dynamic-tool"
          toolName={toolName}
          state="output-error"
          title={`Error en ${toolName}`}
        />
        <ToolContent>
          <ToolOutput output={null} errorText={error} />
        </ToolContent>
      </Tool>
    )
  }

  switch (toolName) {
    case 'createTarea':
      return (
        <Task defaultOpen={true}>
          <TaskTrigger title={`Tarea creada: ${result.data?.titulo || args.titulo}`} />
          <TaskContent>
            <TaskItem>Estado: {result.data?.estado || 'Pendiente'}</TaskItem>
            <TaskItem>Prioridad: {result.data?.prioridad}</TaskItem>
            {result.data?.fecha_vencimiento && (
              <TaskItem>Vencimiento: {new Date(result.data.fecha_vencimiento).toLocaleDateString()}</TaskItem>
            )}
          </TaskContent>
        </Task>
      )

    case 'search':
      return (
        <Tool defaultOpen={false}>
          <ToolHeader
            type="dynamic-tool"
            toolName={toolName}
            state="output-available"
            title={`Resultados de búsqueda (${result.count || 0})`}
          />
          <ToolContent>
            <div className="flex flex-col gap-2">
              {result.results?.map((item: any) => (
                <div key={item.id} className="text-xs p-2 rounded bg-muted/50 border border-border">
                  <p className="font-medium">{item.nombre_completo || item.razon_social || item.titulo || item.codigo_accion}</p>
                  <p className="text-muted-foreground line-clamp-1">{item.descripcion || item.email_principal || item.estado}</p>
                </div>
              ))}
              {(!result.results || result.results.length === 0) && (
                <p className="text-xs text-muted-foreground italic">No se encontraron resultados.</p>
              )}
            </div>
          </ToolContent>
        </Tool>
      )

    case 'asignarFamiliar':
    case 'asignarAccion':
      return (
        <Plan defaultOpen={true}>
          <PlanHeader>
            <PlanTitle>{toolName === 'asignarFamiliar' ? 'Relación establecida' : 'Acción asignada'}</PlanTitle>
            <PlanDescription>{result.message}</PlanDescription>
          </PlanHeader>
          <PlanContent>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-1.5 rounded-full bg-green-500" />
                <span>Validación de permisos completada</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-1.5 rounded-full bg-green-500" />
                <span>Actualización de base de datos exitosa</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-1.5 rounded-full bg-green-500" />
                <span>Notificación enviada al sistema</span>
              </div>
            </div>
          </PlanContent>
        </Plan>
      )

    case 'createPersona':
    case 'createEmpresa':
    case 'createDocComercial':
      return (
        <Artifact className="max-w-md">
          <ArtifactHeader>
            <ArtifactTitle>{result.message}</ArtifactTitle>
            <ArtifactDescription>Registro insertado correctamente</ArtifactDescription>
          </ArtifactHeader>
          <ArtifactContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono truncate">{result.data?.id}</span>
              <span className="text-muted-foreground">Código BP:</span>
              <span>{result.data?.codigo_bp || 'N/A'}</span>
            </div>
          </ArtifactContent>
        </Artifact>
      )

    default:
      return (
        <Tool defaultOpen={false}>
          <ToolHeader
            type="dynamic-tool"
            toolName={toolName}
            state="output-available"
            title={`Resultado de ${toolName}`}
          />
          <ToolContent>
            <ToolOutput output={result} errorText={undefined} />
          </ToolContent>
        </Tool>
      )
  }
}

// ============================================================================
// Attachments Display Component
// ============================================================================

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <div className="px-3 pt-3">
      <Attachments variant="inline">
        {attachments.files.map((attachment) => (
          <Attachment
            data={attachment}
            key={attachment.id}
            onRemove={() => attachments.remove(attachment.id)}
          >
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function AIChatView({
  conversationId = 'ai-companion-main',
  showHeader = true,
  storageKey = STORAGE_KEY,
}: AIChatViewProps) {
  return (
    <PromptInputProvider>
      <AIChatViewInternal
        conversationId={conversationId}
        showHeader={showHeader}
        storageKey={storageKey}
      />
    </PromptInputProvider>
  )
}

function AIChatViewInternal({
  conversationId,
  showHeader,
  storageKey,
}: AIChatViewProps) {
  const router = useRouter()
  const { notifyError } = useNotify()
  const { chatSize, setChatSize } = useAICompanion()

  // State for config
  const [modelId, setModelId] = useState<string>(() => loadConfigFromStorage().modelId)
  const [modeId, setModeId] = useState<string>(() => loadConfigFromStorage().modeId)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  // Save config when it changes
  useEffect(() => {
    saveConfigToStorage({ modelId, modeId })
  }, [modelId, modeId])

  const chatResult = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        modelId,
        modeId,
      },
    }),
    onToolCall: async ({ toolCall }) => {
      const tc = toolCall as { toolName: string; toolCallId: string; input?: any }

      if (tc.toolName === 'navigate') {
        if (!tc.input) {
          addToolOutput({
            tool: tc.toolName,
            toolCallId: tc.toolCallId,
            output: { success: false, error: 'Arguments are missing' }
          })
          return
        }

        let navigateTo = tc.input.path

        // If page title is provided, try to resolve it to a path
        if (tc.input.page) {
          const pageTitle = tc.input.page.toLowerCase().trim()
          const titleMap: Record<string, string> = {
            'panel': '/admin',
            'mis tareas': '/admin/mis-tareas',
            'analítica': '/admin/analitica',
            'analitica': '/admin/analitica',
            'personas': '/admin/socios/personas',
            'empresas': '/admin/socios/empresas',
            'acciones': '/admin/procesos/acciones',
            'documentos comerciales': '/admin/procesos/documentos-comerciales',
            'documentos': '/admin/procesos/documentos-comerciales',
            'tareas': '/admin/procesos/tareas',
            'organizaciones': '/admin/organizations',
            'perfil': '/admin/settings/profile',
            'cuenta': '/admin/settings/account',
            'componentes': '/admin/settings/componentes',
            'vistas': '/admin/settings/views',
          }

          if (titleMap[pageTitle]) {
            navigateTo = titleMap[pageTitle]
          } else {
            const matchedKey = Object.keys(titleMap).find(key => pageTitle.includes(key))
            if (matchedKey) {
              navigateTo = titleMap[matchedKey]
            }
          }
        }

        if (navigateTo) {
          if (tc.input.entityId) {
            if (tc.input.entity === 'personas') {
              navigateTo = `/admin/socios/personas/${tc.input.entityId}`
            } else if (tc.input.entity === 'empresas') {
              navigateTo = `/admin/socios/empresas/${tc.input.entityId}`
            } else if (tc.input.entity === 'acciones') {
              navigateTo = `/admin/procesos/acciones/${tc.input.entityId}`
            } else if (tc.input.entity === 'tareas') {
              navigateTo = `/admin/procesos/tareas`
            } else if (tc.input.entity === 'doc_comerciales') {
              navigateTo = `/admin/procesos/documentos-comerciales`
            } else if (navigateTo && !navigateTo.includes(tc.input.entityId)) {
              navigateTo = `${navigateTo}/${tc.input.entityId}`
            }
          }

          router.push(navigateTo)
          addToolOutput({
            tool: tc.toolName,
            toolCallId: tc.toolCallId,
            output: { success: true, navigatedTo: navigateTo }
          })
        } else {
          addToolOutput({
            tool: tc.toolName,
            toolCallId: tc.toolCallId,
            output: { success: false, error: 'Could not determine destination path' }
          })
        }
      }
    },
    onError: (err) => {
      notifyError({
        title: 'Error en el chat',
        description: err.message
      })
    },
  })

  const { messages, sendMessage, status, error, stop, addToolOutput, clearError, setMessages } = chatResult

  // Load messages from localStorage on mount
  useEffect(() => {
    if (!storageKey) return
    const saved = loadMessagesFromStorage(storageKey as string)
    if (saved.length > 0) {
      const validMessages = saved.filter((msg: unknown) => {
        if (typeof msg !== 'object' || msg === null) return false
        const m = msg as { id?: string; role?: string; parts?: unknown[] }
        return m.id && m.role && Array.isArray(m.parts)
      })
      setMessages(validMessages)
    }
  }, [storageKey, setMessages])

  // Save messages to localStorage
  useEffect(() => {
    if (!storageKey) return
    saveMessagesToStorage(storageKey as string, messages)
  }, [messages, storageKey])

  const handleClearChat = useCallback(() => {
    if (storageKey) {
      setMessages([])
      clearMessagesFromStorage(storageKey)
    }
  }, [storageKey, setMessages])

  // Daily auto-clean logic
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return

    const lastVisitKey = 'ai-companion-last-visit'
    const lastVisit = localStorage.getItem(lastVisitKey)
    const today = new Date().toDateString()

    if (lastVisit && lastVisit !== today) {
      handleClearChat()
    }

    localStorage.setItem(lastVisitKey, today)
  }, [storageKey, handleClearChat])

  const isStreaming = status === 'streaming'
  const isThinking = status === 'submitted'
  const isLoading = isStreaming || isThinking
  const hasMessages = messages.length > 0

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  const currentModelData = useMemo(() => {
    return AI_MODELS.find(m => m.id === modelId)
  }, [modelId])

  const currentModelLabel = currentModelData?.label || 'Desconocido'
  const currentModeLabel = AI_MODES.find(m => m.id === modeId)?.label || 'Estándar'

  // Get the last assistant message for context display
  const lastAssistantMessage = useMemo(() => {
    return messages.filter(m => m.role === 'assistant').at(-1)
  }, [messages])

  const hasUsage = lastAssistantMessage && 'usage' in lastAssistantMessage

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 bg-background">
          <div className="flex items-center gap-3">
            <div className="relative">
              {isLoading ? (
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  <Persona
                    state={isStreaming ? 'speaking' : 'thinking'}
                    variant="obsidian"
                    className="size-full"
                  />
                </div>
              ) : (
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">Country AI</h3>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                  <Cpu className="size-3" />
                  {currentModelLabel}
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                  <Settings2 className="size-3" />
                  {currentModeLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={!hasMessages || isLoading}
              className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              title="Limpiar chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Configuración de IA"
                  disabled={isLoading}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Configuración de IA</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Bot className="mr-2 h-4 w-4" />
                    <span>Modelo</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={modelId} onValueChange={setModelId}>
                        {AI_MODELS.map((model) => (
                          <DropdownMenuRadioItem key={model.id} value={model.id}>
                            <div className="flex flex-col">
                              <span>{model.label}</span>
                              <span className="text-[10px] text-muted-foreground">{model.provider}</span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Modo</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={modeId} onValueChange={setModeId}>
                        {AI_MODES.map((mode) => (
                          <DropdownMenuRadioItem key={mode.id} value={mode.id}>
                            <div className="flex flex-col">
                              <span>{mode.label}</span>
                              <span className="text-[10px] text-muted-foreground">{mode.description}</span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    <span>Tamaño</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={chatSize} onValueChange={setChatSize}>
                        {AI_SIZES.map((size) => (
                          <DropdownMenuRadioItem key={size.id} value={size.id}>
                            <div className="flex flex-col">
                              <span>{size.label}</span>
                              <span className="text-[10px] text-muted-foreground">{size.height}</span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleClearChat}
                  disabled={!hasMessages}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Limpiar Chat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Messages */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="px-4 py-6">
          {!hasMessages ? (
            <ConversationEmptyState
              title="¿En qué puedo ayudarte?"
              description="Pregúntame sobre personas, empresas, tareas o acciones del CRM."
              icon={
                <div className="relative">
                  <Persona state="idle" variant="obsidian" className="size-20" />
                  <div className="absolute -top-1 -right-1">
                    <Sparkle className="size-5 text-primary animate-pulse" />
                  </div>
                </div>
              }
            >
              <div className="mt-6 w-full max-w-md mx-auto">
                <p className="text-xs text-muted-foreground text-center mb-3">Prueba estas sugerencias:</p>
                <Suggestions>
                  {[
                    { text: 'Show active personas', icon: '👥' },
                    { text: 'Find tareas for today', icon: '📋' },
                    { text: 'How to create an acción', icon: '💡' },
                  ].map((suggestion) => (
                    <Suggestion
                      key={suggestion.text}
                      suggestion={suggestion.text}
                      onClick={handleSuggestionClick}
                    >
                      {suggestion.icon && <span className="mr-1.5">{suggestion.icon}</span>}
                      {suggestion.text}
                    </Suggestion>
                  ))}
                </Suggestions>
              </div>
            </ConversationEmptyState>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <div className={cn("flex gap-3 px-1", message.role === 'user' && "flex-row-reverse")}>
                    <MessageAvatar
                      fallback={message.role === 'user' ? 'U' : 'AI'}
                      icon={message.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      className={cn(message.role === 'user' ? "bg-primary/10" : "bg-muted")}
                    />
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <MessageContent
                        className={cn(
                          message.role === 'assistant' && 'bg-muted/30 rounded-xl px-4 py-3'
                        )}
                      >
                        {message.parts.map((part, i) => {
                          if (part.type === 'text') {
                            return (
                              <MessageResponse
                                key={i}
                                className="text-foreground"
                              >
                                {(part as any).text}
                              </MessageResponse>
                            )
                          }

                          if (part.type === 'reasoning') {
                            return (
                              <Reasoning key={i} isStreaming={isStreaming}>
                                <ReasoningTrigger />
                                <ReasoningContent>{(part as any).reasoning}</ReasoningContent>
                              </Reasoning>
                            )
                          }

                          if (part.type === 'tool-call') {
                            const toolCall = part as any
                            return (
                              <Tool key={i}>
                                <ToolHeader
                                  type="dynamic-tool"
                                  toolName={toolCall.toolName}
                                  state="input-available"
                                  title={`Using tool: ${toolCall.toolName}`}
                                />
                                <ToolContent>
                                  <ToolInput input={toolCall.args} />
                                </ToolContent>
                              </Tool>
                            )
                          }

                          if (part.type === 'tool-result') {
                            const toolResult = part as any
                            return (
                              <ToolResultRenderer
                                key={i}
                                toolResult={toolResult}
                                isStreaming={isStreaming}
                              />
                            )
                          }

                          // Handle source-display parts
                          if ((part as any).type === 'source-display') {
                            const sourceData = part as any
                            return (
                              <Sources key={i}>
                                <SourcesTrigger count={sourceData.sources?.length || 1} />
                                <SourcesContent>
                                  {sourceData.sources?.map((source: any, idx: number) => (
                                    <Source key={idx} href={source.url} title={source.title || source.url} />
                                  ))}
                                </SourcesContent>
                              </Sources>
                            )
                          }

                          return null
                        })}
                      </MessageContent>

                      {/* Message Actions & Toolbar */}
                      {message.role === 'assistant' && !isStreaming && (
                        <MessageToolbar>
                          <MessageActions>
                            <MessageAction
                              tooltip="Copiar mensaje"
                              onClick={() => {
                                const text = message.parts
                                  .filter(p => p.type === 'text')
                                  .map(p => (p as any).text)
                                  .join('\n')
                                navigator.clipboard.writeText(text)
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </MessageAction>
                            {hasUsage && (
                              <Context
                                usedTokens={(lastAssistantMessage as any).usage?.totalTokens || 0}
                                maxTokens={128000}
                                usage={(lastAssistantMessage as any).usage}
                                modelId={modelId}
                              >
                                <ContextTrigger />
                                <ContextContent>
                                  <ContextContentHeader />
                                  <ContextContentBody>
                                    <ContextInputUsage />
                                    <ContextOutputUsage />
                                  </ContextContentBody>
                                  <ContextContentFooter />
                                </ContextContent>
                              </Context>
                            )}
                          </MessageActions>
                        </MessageToolbar>
                      )}

                      {/* Loading indicator for streaming message */}
                      {message.role === 'assistant' && isStreaming && message === messages[messages.length - 1] && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                          <Loader size={12} />
                          <span>Escribiendo...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Message>
              ))}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input / Composer */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        {error && (
          <div className="mb-3 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center justify-between">
            <span className="text-xs">{error.message}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-xs underline hover:no-underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <PromptInput
          multiple
          globalDrop={false}
          onSubmit={({ text, files }) => {
            if (text.trim() || (files && files.length > 0)) {
              sendMessage({ text, files: files || [] })
            }
          }}
        >
          <PromptInputAttachmentsDisplay />
          <PromptInputBody>
            <PromptInputTextarea
              name="message"
              placeholder="Escribe un mensaje..."
              disabled={isLoading}
              autoFocus
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              {/* Attachments Menu */}
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              {/* Voice Input */}
              <SpeechInput
                onTranscriptionChange={(text) => {
                  // Append transcribed text to textarea
                  const textarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = text
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                  }
                }}
                lang="es-ES"
              />

              {/* Model Selector Button */}
              <DropdownMenu open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
                <DropdownMenuTrigger asChild>
                  <PromptInputButton>
                    <Sparkle className="size-3.5 text-primary" />
                    <span className="text-xs">{currentModelData?.shortLabel || currentModelLabel}</span>
                    <ChevronDown className="size-3.5" />
                  </PromptInputButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Modelo</p>
                  <DropdownMenuSeparator />
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => {
                        setModelId(model.id)
                        setModelSelectorOpen(false)
                      }}
                      className={cn(
                        "cursor-pointer",
                        modelId === model.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Bot className="size-4" />
                        <div className="flex flex-col">
                          <span className="text-sm">{model.label}</span>
                          <span className="text-[10px] text-muted-foreground">{model.provider}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
