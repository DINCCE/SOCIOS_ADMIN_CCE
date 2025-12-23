"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { testWriteAction } from "./test-action"
import { Loader2, Terminal } from "lucide-react"

export function WriteTestButton() {
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    const runTest = async () => {
        setLoading(true)
        setLogs([])
        try {
            const result = await testWriteAction()
            setLogs(result.logs)
        } catch (error) {
            setLogs(["Error inesperado al ejecutar la acción."])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Button onClick={runTest} disabled={loading} variant="secondary">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ejecutar Prueba de Escritura
            </Button>

            {logs.length > 0 && (
                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm space-y-1">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-muted-foreground">
                        <Terminal className="h-4 w-4" />
                        <span>Log Output</span>
                    </div>
                    {logs.map((log, i) => (
                        <div key={i} className={log.includes("❌") ? "text-red-400" : log.includes("✅") ? "text-green-400" : ""}>
                            {log}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
