import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WriteTestButton } from "./write-check"

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TestDBPage() {
    const supabase = await createClient()

    const results = {
        auth: { status: "pending", message: "" },
        organizations: { status: "pending", count: 0, message: "" },
        business_partners: { status: "pending", count: 0, message: "" },
    }

    // 1. Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
        results.auth = { status: "error", message: authError.message }
    } else if (!user) {
        results.auth = { status: "error", message: "No user found (Not authenticated)" }
    } else {
        results.auth = { status: "success", message: `Authenticated as ${user.email} (${user.id})` }
    }

    // 2. Check Organizations
    try {
        const { count, error, data } = await supabase
            .from("organizations")
            .select("*", { count: "exact", head: true })

        if (error) {
            results.organizations = { status: "error", count: 0, message: error.message }
        } else {
            // Also try to read one to be sure data access works beyond checking count
            const { data: orgData } = await supabase.from("organizations").select("id").limit(1).single()

            results.organizations = {
                status: count === 0 ? "warning" : "success",
                count: count || 0,
                message: count === 0
                    ? "CRITICAL: No organizations found. Creating persons requires an organization."
                    : `Found ${count} organizations. Sample ID: ${orgData?.id || 'N/A'}`
            }
        }
    } catch (e: any) {
        results.organizations = { status: "error", count: 0, message: e.message }
    }

    // 3. Check Business Partners (Permissions Check)
    try {
        const { count, error } = await supabase
            .from("business_partners")
            .select("*", { count: "exact", head: true })

        if (error) {
            results.business_partners = { status: "error", count: 0, message: error.message }
        } else {
            results.business_partners = {
                status: "success",
                count: count || 0,
                message: `Found ${count} business partners. Read permission OK.`
            }
        }
    } catch (e: any) {
        results.business_partners = { status: "error", count: 0, message: e.message }
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <h1 className="text-3xl font-bold">Diagnóstico de Base de Datos</h1>
            <p className="text-muted-foreground">Esta página verifica la conectividad y los requisitos previos para crear personas.</p>

            <div className="grid gap-6">

                {/* Auth Result */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {results.auth.status === "success" ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-destructive" />}
                            Autenticación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`p-4 rounded-md border ${results.auth.status === "success" ? "bg-background border-default" : "bg-destructive/15 border-destructive text-destructive"}`}>
                            <h5 className="font-medium mb-1">{results.auth.status === "success" ? "OK" : "Error"}</h5>
                            <div className="text-sm opacity-90">{results.auth.message}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Organizations Result */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {results.organizations.status === "success" && <CheckCircle2 className="text-green-500" />}
                            {results.organizations.status === "warning" && <AlertTriangle className="text-yellow-500" />}
                            {results.organizations.status === "error" && <XCircle className="text-destructive" />}
                            Organizaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`p-4 rounded-md border ${results.organizations.status === "error" ? "bg-destructive/15 border-destructive text-destructive" :
                            results.organizations.status === "warning" ? "bg-yellow-500/15 border-yellow-500 text-yellow-700" :
                                "bg-background border-default"
                            }`}>
                            <h5 className="font-medium mb-1">
                                {results.organizations.status === "error" ? "Error" : results.organizations.status === "warning" ? "Advertencia" : "OK"}
                            </h5>
                            <div className="text-sm opacity-90">
                                {results.organizations.message}
                            </div>
                        </div>
                        {results.organizations.status === "warning" && (
                            <div className="mt-4 p-4 bg-muted rounded-md text-sm">
                                <strong>Acción Requerida:</strong> Debes insertar al menos una organización en la tabla `organizations` para poder crear personas.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Permissions Result */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {results.business_partners.status === "success" ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-destructive" />}
                            Permisos (Business Partners)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`p-4 rounded-md border ${results.business_partners.status === "success" ? "bg-background border-default" : "bg-destructive/15 border-destructive text-destructive"}`}>
                            <h5 className="font-medium mb-1">{results.business_partners.status === "success" ? "Lectura OK" : "Error"}</h5>
                            <div className="text-sm opacity-90">{results.business_partners.message}</div>
                        </div>

                        {results.business_partners.status === "success" && (
                            <WriteTestButton />
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
