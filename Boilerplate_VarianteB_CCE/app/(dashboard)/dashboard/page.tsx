'use client'

import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
    const { data: user, isLoading } = useUser()

    return (
        <div className="p-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-6 w-24 rounded bg-slate-200 animate-pulse" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {user ? 'Active' : 'Guest'}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {user?.email || 'No email detected'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold">Row Level Security Demo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    The database policies ensure you only see data that belongs to you.
                </p>

                <div className="rounded-md border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">Todo List Component (Placeholder)</p>
                    <p className="text-xs text-muted-foreground mt-2">See <code>supabase/schema.sql</code> for the `todos` policies.</p>
                </div>
            </div>
        </div>
    )
}
