import { Metadata } from 'next'
import { SheetsShowcase } from '@/components/showcase/sheets-showcase'
import { ScrollArea } from '@/components/ui/scroll-area'

export const metadata: Metadata = {
  title: 'Vistas | SOCIOS_ADMIN',
  description: 'Showcase de todos los sheets y vistas de la aplicación',
}

export default function ViewsPage() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vistas</h1>
          <p className="text-muted-foreground mt-2">
            Previsualiza y prueba todos los componentes sheet de la aplicación
          </p>
        </div>

        <SheetsShowcase />
      </div>
    </ScrollArea>
  )
}
