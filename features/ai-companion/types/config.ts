export const AI_MODELS = [
    {
        id: 'anthropic/claude-haiku-4.5',
        label: 'Claude Haiku 4.5',
        provider: 'Anthropic',
    },
    {
        id: 'anthropic/claude-sonnet-4.5',
        label: 'Clause Sonnet 4.5',
        provider: 'Anthropic',
    },
    {
        id: 'deepseek/deepseek-v3.2',
        label: 'DeepSeek 3.2',
        provider: 'DeepSeek',
    },
    {
        id: 'google/gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        provider: 'Google',
    },
    {
        id: 'google/gemini-3-flash-preview',
        label: 'Gemini 3 Flash',
        provider: 'Google',
    },
    {
        id: 'z-ai/glm-4.7-flash',
        label: 'GLM-4.7 Flash',
        provider: 'BigModel',
    },
    {
        id: 'x-ai/grok-3-mini',
        label: 'Grok 3 mini',
        provider: 'X.AI',
    },
    {
        id: 'x-ai/grok-4.1-fast',
        label: 'Grok 4.1',
        provider: 'X.AI',
    },
] as const

export type AIModelId = (typeof AI_MODELS)[number]['id']

export const AI_MODES = [
    {
        id: 'standard',
        label: 'Estándar',
        description: 'Comportamiento equilibrado y útil',
    },
    {
        id: 'concise',
        label: 'Conciso',
        description: 'Respuestas cortas y directas al punto',
    },
    {
        id: 'technical',
        label: 'Técnico',
        description: 'Enfoque en detalles técnicos y código',
    },
    {
        id: 'creative',
        label: 'Creativo',
        description: 'Respuestas más elaboradas y expresivas',
    },
] as const

export type AIModeId = (typeof AI_MODES)[number]['id']

export const DEFAULT_MODEL: AIModelId = 'google/gemini-2.5-flash'
export const DEFAULT_MODE: AIModeId = 'standard'
