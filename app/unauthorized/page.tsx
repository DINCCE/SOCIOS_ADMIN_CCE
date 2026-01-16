'use client'

import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Acceso no autorizado</h1>
          <p className="text-muted-foreground">
            No tienes una organización asignada. Contacta al administrador.
          </p>
        </div>

        <Button variant="outline" onClick={handleSignOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
