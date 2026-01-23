/**
 * Access Denied component
 * Displayed when user doesn't have permission to access a page
 */

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AccessDeniedProps {
  message?: string
  showHomeButton?: boolean
}

export function AccessDenied({
  message = 'No tienes permisos para acceder a esta página.',
  showHomeButton = true,
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Acceso Denegado</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {showHomeButton && (
          <Button asChild variant="outline">
            <Link href="/admin">Volver al Inicio</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
