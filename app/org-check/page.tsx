'use client'

import { useEffect } from 'react'
import { checkAndRedirect } from '@/app/actions/orgs'
import { Loader2 } from 'lucide-react'

export default function OrgCheckPage() {
  useEffect(() => {
    const init = async () => {
      await checkAndRedirect()
    }
    init()
  }, [])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    </div>
  )
}
