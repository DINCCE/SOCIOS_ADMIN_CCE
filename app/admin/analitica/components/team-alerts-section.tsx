"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TeamAlert {
    type: 'overdue' | 'overloaded' | 'unassigned' | 'bottleneck'
    severity: 'critical' | 'warning' | 'info'
    message: string
    count: number
    action?: {
        label: string
        onClick: () => void
    }
}

interface TeamAlertsSectionProps {
    alerts: TeamAlert[]
}

export function TeamAlertsSection({ alerts }: TeamAlertsSectionProps) {
    if (alerts.length === 0) return null

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="h-4 w-4" />
            case 'warning': return <AlertTriangle className="h-4 w-4" />
            default: return <Info className="h-4 w-4" />
        }
    }

    const getVariant = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive'
            default: return 'default'
        }
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alertas del Equipo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map((alert, index) => (
                    <Alert
                        key={index}
                        variant={getVariant(alert.severity)}
                        className={cn(
                            "relative overflow-hidden transition-all hover:shadow-md",
                            alert.severity === 'warning' && "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                {getIcon(alert.severity)}
                            </div>
                            <div className="flex-1">
                                <AlertTitle className="text-sm font-semibold">
                                    {alert.severity === 'critical' ? 'Critico' : alert.severity === 'warning' ? 'Advertencia' : 'Nota'}
                                </AlertTitle>
                                <AlertDescription className="text-xs mt-1">
                                    {alert.message}
                                </AlertDescription>
                                {alert.action && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 h-7 px-2 text-xs font-medium hover:bg-background/20"
                                        onClick={alert.action.onClick}
                                    >
                                        {alert.action.label}
                                        <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Alert>
                ))}
            </div>
        </div>
    )
}
