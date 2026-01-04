"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

import { eliminarRelacion } from "@/app/actions/relaciones"

interface UnlinkFamilyConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relacion_id: string
  memberName: string
  onSuccess?: () => void
}

export function UnlinkFamilyConfirmDialog({
  open,
  onOpenChange,
  relacion_id,
  memberName,
  onSuccess,
}: UnlinkFamilyConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleUnlink() {
    setIsPending(true)
    try {
      const result = await eliminarRelacion(relacion_id)

      if (result.success) {
        toast.success("Familiar desvinculado correctamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error("Error unlinking family member:", err)
      toast.error("Error al desvincular familiar")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <SheetTitle>Desvincular Familiar</SheetTitle>
          </div>
          <SheetDescription className="mt-2">
            ¿Estás seguro de que deseas desvincular a <strong>{memberName}</strong> del grupo familiar?
            <br /><br />
            Esta acción eliminará la relación familiar pero no borrará la persona de la base de datos.
          </SheetDescription>
        </SheetHeader>

        <SheetFooter className="mt-6 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnlink}
            disabled={isPending}
          >
            {isPending ? "Desvinculando..." : "Desvincular"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
