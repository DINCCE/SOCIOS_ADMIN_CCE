'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { selectOrganization, getUserOrganizations, type UserOrganization } from '@/app/actions/orgs'

export default function SelectOrgPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrgs = async () => {
      const res = await getUserOrganizations()
      if (res.organizations) setOrgs(res.organizations)
      setLoading(false)
    }
    fetchOrgs()
  }, [])

  const handleSelectOrg = async (orgId: string) => {
    await selectOrganization(orgId)
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Selecciona una organización</h1>
          <p className="text-muted-foreground">Tienes acceso a múltiples cuentas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {orgs.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer transition-colors hover:bg-accent hover:border-primary/50"
              onClick={() => handleSelectOrg(org.id)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{org.nombre}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
