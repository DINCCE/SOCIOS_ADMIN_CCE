'use client'

import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComponentPlayground } from './component-playground'
import type { ComponentMeta } from '@/types/component-registry'
import '@/lib/component-isolation.css'

// Import all UI components explicitly
import * as UIComponents from '@/components/ui'

interface ComponentPreviewProps {
  component: ComponentMeta
  className?: string
}

/**
 * ComponentPreview - Live preview with playground tabs
 */
export function ComponentPreview({ component, className }: ComponentPreviewProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyCode = async () => {
    const code = `import { ${component.name} } from '@/components/ui/${component.id}'`
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card
      className={cn(
        'overflow-hidden border-primary/20',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl">{component.name}</CardTitle>
            <CardDescription className="mt-1 text-base">
              {component.description}
            </CardDescription>
          </div>

          {/* Copy button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="shrink-0 gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar import
              </>
            )}
          </Button>
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Ruta:</span>
          <code className="rounded bg-muted px-2 py-0.5 text-xs">
            {component.filePath}
          </code>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border/60 px-6">
            <TabsTrigger value="preview" className="gap-2">
              Vista Previa
            </TabsTrigger>
            {component.playground && (
              <TabsTrigger value="playground" className="gap-2">
                Playground
              </TabsTrigger>
            )}
          </TabsList>

          {/* Preview tab */}
          <TabsContent value="preview" className="p-6">
            <ComponentPreviewSandbox component={component} />
          </TabsContent>

          {/* Playground tab */}
          {component.playground && (
            <TabsContent value="playground" className="p-6">
              <ComponentPlaygroundWrapper component={component} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

/**
 * ComponentPreviewSandbox - Isolated preview container
 *
 * Renders a component with proper loading and error states
 */
interface ComponentPreviewSandboxProps {
  component: ComponentMeta
}

function ComponentPreviewSandbox({ component }: ComponentPreviewSandboxProps) {
  // Try to get the component from UIComponents
  const Component = React.useMemo(() => {
    // Convert component ID to PascalCase for named exports
    const pascalCaseId = component.id.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')

    // Try both the ID and PascalCase versions
    return (UIComponents as any)[component.id] ||
           (UIComponents as any)[pascalCaseId] ||
           (UIComponents as any)[component.name]
  }, [component.id, component.name])

  if (!Component) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <div className="space-y-2">
          <p className="font-medium">Componente no disponible</p>
          <p className="text-sm opacity-70">
            Este componente requiere una configuración específica para mostrarse en el showcase.
          </p>
          <p className="text-xs opacity-50">
            ID: {component.id}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="component-preview-sandbox">
      <Component />
    </div>
  )
}

/**
 * ComponentPlaygroundWrapper - Wrapper for playground
 *
 * Handles dynamic component loading for playground mode
 */
interface ComponentPlaygroundWrapperProps {
  component: ComponentMeta
}

function ComponentPlaygroundWrapper({ component }: ComponentPlaygroundWrapperProps) {
  // Try to get the component from UIComponents
  const Component = React.useMemo(() => {
    const pascalCaseId = component.id.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')

    return (UIComponents as any)[component.id] ||
           (UIComponents as any)[pascalCaseId] ||
           (UIComponents as any)[component.name]
  }, [component.id, component.name])

  if (!Component) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>Playground no disponible para este componente</p>
      </div>
    )
  }

  return <ComponentPlayground component={component} Component={Component} />
}
